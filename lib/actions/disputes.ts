'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function disputeMatchScore(matchId: string) {
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
      .select('*, player1:users!matches_player1_id_fkey(id, name), player2:users!matches_player2_id_fkey(id, name)')
      .eq('id', matchId)
      .single()

    if (matchError || !match) {
      return { error: 'Match not found' }
    }

    // Verify user is one of the players
    if (match.player1_id !== user.id && match.player2_id !== user.id) {
      return { error: 'You are not authorized to dispute this match' }
    }

    // Verify match is completed
    if (!match.winner_id) {
      return { error: 'Cannot dispute a match that has not been completed' }
    }

    // Verify match is not already disputed
    if (match.is_disputed) {
      return { error: 'This match is already disputed' }
    }

    // Update match to disputed status
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        is_disputed: true,
        disputed_by_user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', matchId)

    if (updateError) {
      console.error('Error disputing match:', updateError)
      return { error: 'Failed to dispute match' }
    }

    // TODO: Create notification for admin (Phase 4)
    // TODO: Create notification for other player (Phase 4)

    revalidatePath('/matches')
    revalidatePath('/admin/disputes')

    return { success: true }
  } catch (error) {
    console.error('Error in disputeMatchScore:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function resolveDispute(params: {
  matchId: string
  action: 'confirm' | 'reverse'
  newWinnerId?: string
  set1Player1?: number
  set1Player2?: number
  set2Player1?: number
  set2Player2?: number
  set3Player1?: number
  set3Player2?: number
  finalSetType?: 'tiebreak' | 'full_set' | null
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Verify user is admin
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!admin) {
      return { error: 'Only admins can resolve disputes' }
    }

    // Get the match with challenge info
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*, challenge:challenges(*)')
      .eq('id', params.matchId)
      .single()

    if (matchError || !match) {
      return { error: 'Match not found' }
    }

    // Verify match is disputed
    if (!match.is_disputed) {
      return { error: 'This match is not disputed' }
    }

    const challenge = match.challenge as any

    if (params.action === 'confirm') {
      // Just mark as resolved, keep existing score
      const { error: updateError } = await supabase
        .from('matches')
        .update({
          is_disputed: false,
          disputed_by_user_id: null,
          dispute_resolved_by_admin_id: admin.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.matchId)

      if (updateError) {
        console.error('Error confirming dispute:', updateError)
        return { error: 'Failed to confirm dispute resolution' }
      }
    } else if (params.action === 'reverse') {
      // Store old winner for potential ladder rollback
      const oldWinnerId = match.winner_id

      // Update match with new score
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
          winner_id: params.newWinnerId,
          is_disputed: false,
          disputed_by_user_id: null,
          dispute_resolved_by_admin_id: admin.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.matchId)

      if (updateError) {
        console.error('Error reversing match result:', updateError)
        return { error: 'Failed to reverse match result' }
      }

      // If this was a challenge match and the winner changed, update ladder
      if (match.match_type === 'challenge' && challenge && oldWinnerId !== params.newWinnerId) {
        try {
          console.log('=== DISPUTE REVERSAL - LADDER UPDATE ===')
          console.log('Old winner:', oldWinnerId)
          console.log('New winner:', params.newWinnerId)
          console.log('Challenger:', challenge.challenger_id)
          console.log('Challenged:', challenge.challenged_id)

          // First, rollback the original ladder update if challenger won originally
          if (oldWinnerId === challenge.challenger_id) {
            console.log('Challenger won originally - need to rollback')
            // Rollback: move old winner (challenger) back down, move challenged back up
            await rollbackLadderUpdate(match.season_id, challenge.challenger_id, challenge.challenged_id)
          }

          // Then apply new ladder update if new winner is challenger
          if (params.newWinnerId === challenge.challenger_id) {
            console.log('New winner is challenger - applying ladder update')
            const { updateLadderPositionsForDispute } = await import('./matches')
            await updateLadderPositionsForDispute(match.season_id, challenge.challenger_id, challenge.challenged_id)
          }

          console.log('Ladder update complete')
        } catch (error) {
          console.error('Error updating ladder after dispute resolution:', error)
          // Don't fail the whole operation
        }
      }
    }

    // TODO: Create notifications for both players (Phase 4)

    revalidatePath('/matches')
    revalidatePath('/admin/disputes')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in resolveDispute:', error)
    return { error: 'An unexpected error occurred' }
  }
}

async function rollbackLadderUpdate(
  seasonId: string,
  challengerId: string,
  challengedId: string
) {
  // Use service role client to bypass RLS
  const { createClient: createServiceClient } = await import('@supabase/supabase-js')
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log(`Rollback ladder update - Challenger: ${challengerId}, Challenged: ${challengedId}`)

  // Get both players' positions
  const { data: positions, error: positionsError } = await supabase
    .from('ladder_positions')
    .select('id, user_id, position')
    .eq('season_id', seasonId)
    .in('user_id', [challengerId, challengedId])
    .eq('is_active', true)

  if (positionsError || !positions || positions.length !== 2) {
    console.error('Error fetching positions for rollback:', positionsError)
    throw new Error('Could not find both players on ladder')
  }

  const challengerPos = positions.find(p => p.user_id === challengerId)
  const challengedPos = positions.find(p => p.user_id === challengedId)

  if (!challengerPos || !challengedPos) {
    throw new Error('Could not match challenger/challenged positions')
  }

  console.log(`Current positions - Challenger: ${challengerPos.position}, Challenged: ${challengedPos.position}`)

  // Challenger should be above (lower position number) challenged after the original win
  // We need to reverse this: move challenger back down, move challenged back up
  if (challengerPos.position < challengedPos.position) {
    const newChallengerPosition = challengedPos.position
    const oldChallengerPosition = challengerPos.position

    console.log(`Rolling back: Challenger from ${oldChallengerPosition} to ${newChallengerPosition}`)

    // Move challenger to temp position
    await supabase
      .from('ladder_positions')
      .update({ position: -1 })
      .eq('id', challengerPos.id)

    // Get all players that need to shift up (between old and new position, excluding the now-empty old position)
    const { data: playersToShift } = await supabase
      .from('ladder_positions')
      .select('id, user_id, position')
      .eq('season_id', seasonId)
      .eq('is_active', true)
      .gt('position', oldChallengerPosition)  // Greater than (not including) old position
      .lte('position', newChallengerPosition)  // Less than or equal to new position
      .order('position', { ascending: true })

    console.log(`Players to shift up: ${playersToShift?.length || 0}`)

    // Shift everyone up (decrease position number by 1)
    if (playersToShift && playersToShift.length > 0) {
      for (const player of playersToShift) {
        console.log(`Shifting player ${player.user_id} from ${player.position} to ${player.position - 1}`)
        await supabase
          .from('ladder_positions')
          .update({ position: player.position - 1 })
          .eq('id', player.id)
      }
    }

    // Move challenger to final position
    console.log(`Moving challenger from -1 to ${newChallengerPosition}`)
    await supabase
      .from('ladder_positions')
      .update({ position: newChallengerPosition })
      .eq('id', challengerPos.id)

    console.log('Rollback complete')
  }
}

export async function getDisputedMatches() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated', matches: [] }
    }

    // Verify user is admin
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!admin) {
      return { error: 'Only admins can view disputed matches', matches: [] }
    }

    // Get all disputed matches
    const { data: matches, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:users!matches_player1_id_fkey(id, name, email),
        player2:users!matches_player2_id_fkey(id, name, email),
        winner:users!matches_winner_id_fkey(id, name),
        disputed_by:users!matches_disputed_by_user_id_fkey(id, name),
        challenge:challenges(id, is_wildcard, challenger_id, challenged_id),
        season:seasons(id, name)
      `)
      .eq('is_disputed', true)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching disputed matches:', error)
      return { error: 'Failed to fetch disputed matches', matches: [] }
    }

    return { matches: matches || [] }
  } catch (error) {
    console.error('Error in getDisputedMatches:', error)
    return { error: 'An unexpected error occurred', matches: [] }
  }
}
