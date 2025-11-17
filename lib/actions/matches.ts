'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface SubmitScoreParams {
  matchId: string
  set1Player1: number
  set1Player2: number
  set2Player1: number
  set2Player2: number
  set3Player1?: number
  set3Player2?: number
  finalSetType?: 'tiebreak' | 'full_set' | null
}

function calculateWinner(params: SubmitScoreParams): string | null {
  const { set1Player1, set1Player2, set2Player1, set2Player2, set3Player1, set3Player2 } = params

  let player1Sets = 0
  let player2Sets = 0

  // Count set wins
  if (set1Player1 > set1Player2) player1Sets++
  else player2Sets++

  if (set2Player1 > set2Player2) player1Sets++
  else player2Sets++

  if (set3Player1 !== undefined && set3Player2 !== undefined) {
    if (set3Player1 > set3Player2) player1Sets++
    else player2Sets++
  }

  // Winner is whoever won 2+ sets
  if (player1Sets >= 2) return 'player1'
  if (player2Sets >= 2) return 'player2'

  return null // Match not complete
}

export async function submitMatchScore(params: SubmitScoreParams) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get the match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, challenge:challenges(*)')
      .eq('id', params.matchId)
      .single()

    if (matchError || !match) {
      return { error: 'Match not found' }
    }

    // Verify user is one of the players
    if (match.player1_id !== user.id && match.player2_id !== user.id) {
      return { error: 'You are not authorized to submit scores for this match' }
    }

    // Verify match hasn't already been completed
    if (match.winner_id) {
      return { error: 'This match has already been completed' }
    }

    // Calculate winner
    const winnerSide = calculateWinner(params)
    if (!winnerSide) {
      return { error: 'Invalid score - match must have a winner' }
    }

    const winnerId = winnerSide === 'player1' ? match.player1_id : match.player2_id
    const loserId = winnerSide === 'player1' ? match.player2_id : match.player1_id

    // Update match with score
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        set1_player1_score: params.set1Player1,
        set1_player2_score: params.set1Player2,
        set2_player1_score: params.set2Player1,
        set2_player2_score: params.set2Player2,
        set3_player1_score: params.set3Player1 || null,
        set3_player2_score: params.set3Player2 || null,
        final_set_type: params.finalSetType || null,
        winner_id: winnerId,
        submitted_by_user_id: user.id,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.matchId)

    if (updateError) {
      console.error('Error updating match:', updateError)
      return { error: 'Failed to submit score' }
    }

    // Update challenge status to completed
    if (match.challenge_id) {
      await supabase
        .from('challenges')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', match.challenge_id)
    }

    // Update ladder positions if this was a challenge match
    if (match.match_type === 'challenge' && match.challenge_id) {
      const challenge = match.challenge as any

      // If challenger won, they move up
      if (winnerId === challenge.challenger_id) {
        await updateLadderPositions(match.season_id, challenge.challenger_id, challenge.challenged_id)
      }
      // If challenger lost, no position change
    }

    // TODO: Update player stats (Phase 6)
    // TODO: Create notifications (Phase 4)

    revalidatePath('/matches')
    revalidatePath('/challenges')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in submitMatchScore:', error)
    return { error: 'An unexpected error occurred' }
  }
}

async function updateLadderPositions(
  seasonId: string,
  winnerId: string,
  loserId: string
) {
  const supabase = await createClient()

  // Get both players' positions
  const { data: positions } = await supabase
    .from('ladder_positions')
    .select('id, user_id, position')
    .eq('season_id', seasonId)
    .in('user_id', [winnerId, loserId])
    .eq('is_active', true)

  if (!positions || positions.length !== 2) {
    console.error('Could not find both players on ladder')
    return
  }

  const winnerPos = positions.find(p => p.user_id === winnerId)
  const loserPos = positions.find(p => p.user_id === loserId)

  if (!winnerPos || !loserPos) return

  // Winner takes the loser's position, loser and everyone in between moves down
  if (winnerPos.position > loserPos.position) {
    const newWinnerPosition = loserPos.position
    const oldWinnerPosition = winnerPos.position

    // Step 1: Move winner to a temporary position to avoid conflicts
    await supabase
      .from('ladder_positions')
      .update({ position: -1 })
      .eq('id', winnerPos.id)

    // Step 2: Get all players between loser and winner (inclusive of loser, exclusive of old winner position)
    const { data: playersToShift } = await supabase
      .from('ladder_positions')
      .select('id, user_id, position')
      .eq('season_id', seasonId)
      .eq('is_active', true)
      .gte('position', loserPos.position)
      .lt('position', oldWinnerPosition)
      .order('position', { ascending: false })

    // Step 3: Shift everyone down by 1 (in reverse order to avoid conflicts)
    if (playersToShift && playersToShift.length > 0) {
      for (const player of playersToShift) {
        await supabase
          .from('ladder_positions')
          .update({ position: player.position + 1 })
          .eq('id', player.id)
      }
    }

    // Step 4: Move winner to new position
    await supabase
      .from('ladder_positions')
      .update({ position: newWinnerPosition })
      .eq('id', winnerPos.id)

    // Step 5: Record in ladder history
    await supabase
      .from('ladder_history')
      .insert({
        season_id: seasonId,
        user_id: winnerId,
        previous_position: oldWinnerPosition,
        new_position: newWinnerPosition,
        change_reason: 'match_result',
      })
  }
}

export async function getMatchesForUser() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated', matches: [] }
    }

    // Get active season
    const { data: activeSeason } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!activeSeason) {
      return { matches: [] }
    }

    // Get all matches where user is involved
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:users!matches_player1_id_fkey(id, name, email),
        player2:users!matches_player2_id_fkey(id, name, email),
        winner:users!matches_winner_id_fkey(id, name),
        challenge:challenges(id, is_wildcard),
        season:seasons(name)
      `)
      .eq('season_id', activeSeason.id)
      .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
      .order('match_date', { ascending: false })

    if (error) {
      console.error('Error fetching matches:', error)
      return { error: 'Failed to fetch matches', matches: [] }
    }

    return { matches: matches || [] }
  } catch (error) {
    console.error('Error in getMatchesForUser:', error)
    return { error: 'An unexpected error occurred', matches: [] }
  }
}
