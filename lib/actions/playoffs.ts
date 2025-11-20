'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PlayoffFormat, PlayoffBracketData, PlayoffBracketMatch, PlayoffBracketRound, User } from '@/types'

// Create service role client to bypass RLS
async function createServiceRoleClient() {
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', userId)
    .single()
  return !!data
}

// Get top N players from ladder
async function getTopPlayers(seasonId: string, count: number) {
  const supabase = await createClient()

  const { data: positions, error } = await supabase
    .from('ladder_positions')
    .select('*, user:users(*)')
    .eq('season_id', seasonId)
    .eq('is_active', true)
    .order('position', { ascending: true })
    .limit(count)

  if (error) {
    throw new Error(`Failed to fetch ladder positions: ${error.message}`)
  }

  return positions.map(pos => ({
    ...pos.user,
    seed: pos.position
  }))
}

// Generate bracket matchups based on format
function generateBracketStructure(
  format: PlayoffFormat,
  players: Array<User & { seed: number }>
): PlayoffBracketData {
  const rounds: PlayoffBracketRound[] = []

  if (format === 'final') {
    // Just the final: 1 vs 2
    rounds.push({
      roundNumber: 1,
      roundName: 'Final',
      matches: [
        {
          matchId: '', // Will be set when match created
          player1Seed: 1,
          player2Seed: 2,
          player1Id: players[0].id,
          player2Id: players[1].id,
          player1Name: players[0].name,
          player2Name: players[1].name,
          position: 1,
          isComplete: false
        }
      ],
      isComplete: false
    })
  } else if (format === 'semis') {
    // Semis: 1v4, 2v3 then final
    rounds.push({
      roundNumber: 1,
      roundName: 'Semi Finals',
      matches: [
        {
          matchId: '',
          player1Seed: 1,
          player2Seed: 4,
          player1Id: players[0].id,
          player2Id: players[3].id,
          player1Name: players[0].name,
          player2Name: players[3].name,
          position: 1,
          isComplete: false
        },
        {
          matchId: '',
          player1Seed: 2,
          player2Seed: 3,
          player1Id: players[1].id,
          player2Id: players[2].id,
          player1Name: players[1].name,
          player2Name: players[2].name,
          position: 2,
          isComplete: false
        }
      ],
      isComplete: false
    })
    rounds.push({
      roundNumber: 2,
      roundName: 'Final',
      matches: [
        {
          matchId: '',
          player1Seed: 0, // TBD from semi 1
          player2Seed: 0, // TBD from semi 2
          position: 1,
          isComplete: false
        }
      ],
      isComplete: false
    })
  } else if (format === 'quarters') {
    // Quarters: 1v8, 4v5, 2v7, 3v6 (keeps 1&2 on opposite sides)
    rounds.push({
      roundNumber: 1,
      roundName: 'Quarter Finals',
      matches: [
        {
          matchId: '',
          player1Seed: 1,
          player2Seed: 8,
          player1Id: players[0].id,
          player2Id: players[7].id,
          player1Name: players[0].name,
          player2Name: players[7].name,
          position: 1,
          isComplete: false
        },
        {
          matchId: '',
          player1Seed: 4,
          player2Seed: 5,
          player1Id: players[3].id,
          player2Id: players[4].id,
          player1Name: players[3].name,
          player2Name: players[4].name,
          position: 2,
          isComplete: false
        },
        {
          matchId: '',
          player1Seed: 2,
          player2Seed: 7,
          player1Id: players[1].id,
          player2Id: players[6].id,
          player1Name: players[1].name,
          player2Name: players[6].name,
          position: 3,
          isComplete: false
        },
        {
          matchId: '',
          player1Seed: 3,
          player2Seed: 6,
          player1Id: players[2].id,
          player2Id: players[5].id,
          player1Name: players[2].name,
          player2Name: players[5].name,
          position: 4,
          isComplete: false
        }
      ],
      isComplete: false
    })
    rounds.push({
      roundNumber: 2,
      roundName: 'Semi Finals',
      matches: [
        {
          matchId: '',
          player1Seed: 0, // TBD from QF1 vs QF2
          player2Seed: 0,
          position: 1,
          isComplete: false
        },
        {
          matchId: '',
          player1Seed: 0, // TBD from QF3 vs QF4
          player2Seed: 0,
          position: 2,
          isComplete: false
        }
      ],
      isComplete: false
    })
    rounds.push({
      roundNumber: 3,
      roundName: 'Final',
      matches: [
        {
          matchId: '',
          player1Seed: 0, // TBD from SF1 vs SF2
          player2Seed: 0,
          position: 1,
          isComplete: false
        }
      ],
      isComplete: false
    })
  }

  return {
    format,
    rounds
  }
}

// Create playoff matches in database
async function createPlayoffMatches(
  seasonId: string,
  bracketData: PlayoffBracketData
): Promise<PlayoffBracketData> {
  const supabase = await createServiceRoleClient()

  // Create matches for first round (others created later as tournament progresses)
  const firstRound = bracketData.rounds[0]

  for (const match of firstRound.matches) {
    if (!match.player1Id || !match.player2Id) continue

    const matchType = firstRound.roundName.toLowerCase().includes('quarter')
      ? 'quarterfinal'
      : firstRound.roundName.toLowerCase().includes('semi')
      ? 'semifinal'
      : 'final'

    const { data: createdMatch, error } = await supabase
      .from('matches')
      .insert({
        season_id: seasonId,
        player1_id: match.player1Id,
        player2_id: match.player2Id,
        match_type: matchType,
        round_number: firstRound.roundNumber,
        bracket_position: match.position,
        player1_seed: match.player1Seed,
        player2_seed: match.player2Seed
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create match: ${error.message}`)
    }

    // Update match ID in bracket data
    match.matchId = createdMatch.id
  }

  return bracketData
}

// Main function: Start playoffs
export async function startPlayoffs(seasonId: string, format: PlayoffFormat) {
  try {
    const supabase = await createClient()

    // Verify user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    const isUserAdmin = await isAdmin(user.id)
    if (!isUserAdmin) {
      return { error: 'Only admins can start playoffs' }
    }

    // Get season
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', seasonId)
      .single()

    if (seasonError || !season) {
      return { error: 'Season not found' }
    }

    // Verify season is active
    if (season.status !== 'active') {
      return { error: 'Season must be in active status to start playoffs' }
    }

    // Check if playoffs already exist for this season
    const { data: existingBracket } = await supabase
      .from('playoff_brackets')
      .select('id')
      .eq('season_id', seasonId)
      .single()

    if (existingBracket) {
      return { error: 'Playoffs have already been started for this season' }
    }

    // Determine number of players needed
    const playerCount = format === 'final' ? 2 : format === 'semis' ? 4 : 8

    // Get top players from ladder
    const topPlayers = await getTopPlayers(seasonId, playerCount)

    if (topPlayers.length < playerCount) {
      return {
        error: `Not enough players on ladder. Need ${playerCount} but only ${topPlayers.length} available.`
      }
    }

    // Generate bracket structure
    const bracketData = generateBracketStructure(format, topPlayers)

    // Create playoff matches in database
    const updatedBracketData = await createPlayoffMatches(seasonId, bracketData)

    // Create playoff bracket record
    const { data: bracket, error: bracketError } = await supabase
      .from('playoff_brackets')
      .insert({
        season_id: seasonId,
        format,
        bracket_data: updatedBracketData
      })
      .select()
      .single()

    if (bracketError) {
      return { error: `Failed to create playoff bracket: ${bracketError.message}` }
    }

    // Update season status to playoffs
    const { error: updateSeasonError } = await supabase
      .from('seasons')
      .update({
        status: 'playoffs',
        playoff_format: format,
        playoff_started_at: new Date().toISOString()
      })
      .eq('id', seasonId)

    if (updateSeasonError) {
      return { error: `Failed to update season: ${updateSeasonError.message}` }
    }

    // Send notifications to all playoff participants
    const participantIds = topPlayers.map(p => p.id)
    const notifications = participantIds.map(userId => ({
      user_id: userId,
      type: 'playoff_started',
      title: '🏆 Playoffs Have Started!',
      message: `The knockout playoffs have begun! Check your first match in the bracket.`,
      is_read: false
    }))

    await supabase.from('notifications').insert(notifications)

    // Revalidate paths
    revalidatePath('/admin/ladder')
    revalidatePath('/matches')
    revalidatePath('/dashboard')

    return {
      success: true,
      bracketId: bracket.id,
      message: `Playoffs started successfully with ${playerCount} players!`
    }
  } catch (error) {
    console.error('Error starting playoffs:', error)
    return { error: error instanceof Error ? error.message : 'Failed to start playoffs' }
  }
}

// Get active playoff bracket
export async function getActivePlayoffBracket(seasonId: string) {
  try {
    const supabase = await createClient()

    const { data: bracket, error } = await supabase
      .from('playoff_brackets')
      .select('*')
      .eq('season_id', seasonId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No bracket found - not an error, just no playoffs
        return null
      }
      throw error
    }

    // Enrich bracket data with latest match info
    const enrichedBracket = await enrichBracketWithMatches(bracket)

    return enrichedBracket
  } catch (error) {
    console.error('Error fetching playoff bracket:', error)
    return null
  }
}

// Enrich bracket with current match data
async function enrichBracketWithMatches(bracket: any) {
  const supabase = await createClient()

  const bracketData: PlayoffBracketData = bracket.bracket_data

  // Get all playoff matches for this season
  const { data: matches } = await supabase
    .from('matches')
    .select('*, player1:users!matches_player1_id_fkey(*), player2:users!matches_player2_id_fkey(*), winner:users!matches_winner_id_fkey(*)')
    .eq('season_id', bracket.season_id)
    .in('match_type', ['quarterfinal', 'semifinal', 'final'])
    .order('round_number', { ascending: true })
    .order('bracket_position', { ascending: true })

  if (!matches) return bracket

  // Update bracket data with match info
  for (const round of bracketData.rounds) {
    for (const bracketMatch of round.matches) {
      const dbMatch = matches.find(m => m.id === bracketMatch.matchId)
      if (dbMatch) {
        bracketMatch.player1Id = dbMatch.player1_id
        bracketMatch.player2Id = dbMatch.player2_id
        bracketMatch.player1Name = dbMatch.player1?.name
        bracketMatch.player2Name = dbMatch.player2?.name
        bracketMatch.winnerId = dbMatch.winner_id
        bracketMatch.isComplete = !!dbMatch.winner_id

        if (dbMatch.set1_player1_score !== null) {
          bracketMatch.scores = {
            set1Player1: dbMatch.set1_player1_score,
            set1Player2: dbMatch.set1_player2_score,
            set2Player1: dbMatch.set2_player1_score,
            set2Player2: dbMatch.set2_player2_score,
            set3Player1: dbMatch.set3_player1_score,
            set3Player2: dbMatch.set3_player2_score
          }
        }
      }
    }

    // Check if round is complete
    round.isComplete = round.matches.every(m => m.isComplete)
  }

  // Check if tournament is complete
  const finalRound = bracketData.rounds[bracketData.rounds.length - 1]
  if (finalRound.isComplete && finalRound.matches[0].winnerId) {
    bracketData.winnerId = finalRound.matches[0].winnerId
  }

  return {
    ...bracket,
    bracket_data: bracketData
  }
}

// Progress winner to next round
export async function progressToNextRound(matchId: string) {
  try {
    const supabase = await createClient()
    const serviceClient = await createServiceRoleClient()

    // Get the completed match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return { error: 'Match not found' }
    }

    // Verify match is complete
    if (!match.winner_id) {
      return { error: 'Match is not complete yet' }
    }

    // Get playoff bracket
    const { data: bracket, error: bracketError } = await supabase
      .from('playoff_brackets')
      .select('*')
      .eq('season_id', match.season_id)
      .single()

    if (bracketError || !bracket) {
      return { error: 'Playoff bracket not found' }
    }

    const bracketData: PlayoffBracketData = bracket.bracket_data
    const currentRoundIndex = match.round_number! - 1

    // Check if there's a next round
    if (currentRoundIndex >= bracketData.rounds.length - 1) {
      // This was the final - complete playoffs!
      return await completePlayoffs(match.season_id, match.winner_id)
    }

    const nextRound = bracketData.rounds[currentRoundIndex + 1]

    // Determine which next round match this winner goes to
    let nextMatchIndex: number
    let playerSlot: 'player1' | 'player2'

    if (bracketData.format === 'semis') {
      // Semi 1 winner → Final player1, Semi 2 winner → Final player2
      nextMatchIndex = 0
      playerSlot = match.bracket_position === 1 ? 'player1' : 'player2'
    } else if (bracketData.format === 'quarters') {
      if (currentRoundIndex === 0) {
        // QF → SF mapping
        // QF1,QF2 → SF1, QF3,QF4 → SF2
        nextMatchIndex = match.bracket_position! <= 2 ? 0 : 1
        playerSlot = match.bracket_position! % 2 === 1 ? 'player1' : 'player2'
      } else {
        // SF → Final
        nextMatchIndex = 0
        playerSlot = match.bracket_position === 1 ? 'player1' : 'player2'
      }
    } else {
      // Final format - no progression needed
      return { success: true }
    }

    const nextMatch = nextRound.matches[nextMatchIndex]

    // Check if next round match already exists in DB
    if (nextMatch.matchId) {
      // Update existing match with winner
      const updateData: any = {}
      if (playerSlot === 'player1') {
        updateData.player1_id = match.winner_id
        updateData.player1_seed = match.winner_id === match.player1_id ? match.player1_seed : match.player2_seed
      } else {
        updateData.player2_id = match.winner_id
        updateData.player2_seed = match.winner_id === match.player1_id ? match.player1_seed : match.player2_seed
      }

      await serviceClient
        .from('matches')
        .update(updateData)
        .eq('id', nextMatch.matchId)
    } else {
      // Create next round match if both players are ready
      const matchData: any = {
        season_id: match.season_id,
        match_type: nextRound.roundName.toLowerCase().includes('semi') ? 'semifinal' : 'final',
        round_number: nextRound.roundNumber,
        bracket_position: nextMatchIndex + 1
      }

      if (playerSlot === 'player1') {
        matchData.player1_id = match.winner_id
        matchData.player1_seed = match.winner_id === match.player1_id ? match.player1_seed : match.player2_seed
      } else {
        matchData.player2_id = match.winner_id
        matchData.player2_seed = match.winner_id === match.player1_id ? match.player1_seed : match.player2_seed
      }

      // Only create match if we have both players
      if (matchData.player1_id && matchData.player2_id) {
        const { data: newMatch } = await serviceClient
          .from('matches')
          .insert(matchData)
          .select()
          .single()

        if (newMatch) {
          nextMatch.matchId = newMatch.id
        }
      }
    }

    // Update bracket in database
    nextMatch[playerSlot === 'player1' ? 'player1Id' : 'player2Id'] = match.winner_id
    nextMatch[playerSlot === 'player1' ? 'player1Seed' : 'player2Seed'] =
      match.winner_id === match.player1_id ? match.player1_seed : match.player2_seed

    // Get winner name
    const { data: winner } = await supabase
      .from('users')
      .select('name')
      .eq('id', match.winner_id)
      .single()

    if (winner) {
      nextMatch[playerSlot === 'player1' ? 'player1Name' : 'player2Name'] = winner.name
    }

    await serviceClient
      .from('playoff_brackets')
      .update({
        bracket_data: bracketData,
        updated_at: new Date().toISOString()
      })
      .eq('id', bracket.id)

    // Send notification to winner
    await supabase.from('notifications').insert({
      user_id: match.winner_id,
      type: 'playoff_advanced',
      title: '🎉 You Advanced!',
      message: `Congratulations! You've advanced to the ${nextRound.roundName}.`,
      related_match_id: matchId,
      is_read: false
    })

    // Send notification to loser
    const loserId = match.winner_id === match.player1_id ? match.player2_id : match.player1_id
    await supabase.from('notifications').insert({
      user_id: loserId,
      type: 'playoff_eliminated',
      title: 'Playoff Match Complete',
      message: `Your playoff run has ended in the ${match.match_type}. Great effort!`,
      related_match_id: matchId,
      is_read: false
    })

    revalidatePath('/matches')
    revalidatePath('/dashboard')

    return { success: true, nextRound: nextRound.roundName }
  } catch (error) {
    console.error('Error progressing to next round:', error)
    return { error: error instanceof Error ? error.message : 'Failed to progress to next round' }
  }
}

// Complete playoffs and crown champion
async function completePlayoffs(seasonId: string, winnerId: string) {
  try {
    const supabase = await createClient()

    // Update season with winner
    await supabase
      .from('seasons')
      .update({
        status: 'completed',
        playoff_winner_id: winnerId,
        playoff_completed_at: new Date().toISOString()
      })
      .eq('id', seasonId)

    // Update bracket
    const { data: bracket } = await supabase
      .from('playoff_brackets')
      .select('*')
      .eq('season_id', seasonId)
      .single()

    if (bracket) {
      const bracketData: PlayoffBracketData = bracket.bracket_data
      bracketData.winnerId = winnerId
      bracketData.completedAt = new Date().toISOString()

      await supabase
        .from('playoff_brackets')
        .update({
          bracket_data: bracketData,
          updated_at: new Date().toISOString()
        })
        .eq('id', bracket.id)
    }

    // Send champion notification
    await supabase.from('notifications').insert({
      user_id: winnerId,
      type: 'playoff_champion',
      title: '🏆 CHAMPION!',
      message: 'Congratulations! You are the season champion!',
      is_read: false
    })

    revalidatePath('/matches')
    revalidatePath('/dashboard')
    revalidatePath('/admin/ladder')

    return { success: true, champion: true }
  } catch (error) {
    console.error('Error completing playoffs:', error)
    return { error: error instanceof Error ? error.message : 'Failed to complete playoffs' }
  }
}
