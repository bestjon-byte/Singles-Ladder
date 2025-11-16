'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateChallengeParams {
  challengedId: string
  proposedDate: string
  proposedLocation: string
  isWildcard: boolean
}

export async function createChallenge(params: CreateChallengeParams) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get active season
    const { data: activeSeason } = await supabase
      .from('seasons')
      .select('id, wildcards_per_player')
      .eq('is_active', true)
      .single()

    if (!activeSeason) {
      return { error: 'No active season found' }
    }

    // Get challenger's ladder position
    const { data: challengerPosition } = await supabase
      .from('ladder_positions')
      .select('position')
      .eq('season_id', activeSeason.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!challengerPosition) {
      return { error: 'You must be on the ladder to create a challenge' }
    }

    // Get challenged player's ladder position
    const { data: challengedPosition } = await supabase
      .from('ladder_positions')
      .select('position')
      .eq('season_id', activeSeason.id)
      .eq('user_id', params.challengedId)
      .eq('is_active', true)
      .single()

    if (!challengedPosition) {
      return { error: 'Challenged player is not on the ladder' }
    }

    // Validate challenge rules
    if (!params.isWildcard) {
      // Normal challenge: can only challenge players within 2 positions above
      const positionDiff = challengerPosition.position - challengedPosition.position
      if (positionDiff <= 0 || positionDiff > 2) {
        return { error: 'You can only challenge players 1-2 positions above you (use a wildcard to challenge others)' }
      }
    } else {
      // Wildcard challenge: check if user has wildcards available
      const { data: wildcardsUsed } = await supabase
        .from('wildcard_usage')
        .select('id')
        .eq('season_id', activeSeason.id)
        .eq('user_id', user.id)

      const wildcardsRemaining = activeSeason.wildcards_per_player - (wildcardsUsed?.length || 0)

      if (wildcardsRemaining <= 0) {
        return { error: 'You have no wildcards remaining this season' }
      }
    }

    // Check if challenger has an active challenge
    const { data: challengerActiveChallenge } = await supabase
      .from('challenges')
      .select('id')
      .eq('season_id', activeSeason.id)
      .in('status', ['pending', 'accepted'])
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .single()

    if (challengerActiveChallenge) {
      return { error: 'You already have an active challenge. Complete or withdraw it first.' }
    }

    // Check if challenged player has an active challenge
    const { data: challengedActiveChallenge } = await supabase
      .from('challenges')
      .select('id')
      .eq('season_id', activeSeason.id)
      .in('status', ['pending', 'accepted'])
      .or(`challenger_id.eq.${params.challengedId},challenged_id.eq.${params.challengedId}`)
      .single()

    if (challengedActiveChallenge) {
      return { error: 'The challenged player already has an active challenge' }
    }

    // Create the challenge
    const { data: challenge, error: createError } = await supabase
      .from('challenges')
      .insert({
        season_id: activeSeason.id,
        challenger_id: user.id,
        challenged_id: params.challengedId,
        is_wildcard: params.isWildcard,
        status: 'pending',
        proposed_date: params.proposedDate,
        proposed_location: params.proposedLocation,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating challenge:', createError)
      return { error: 'Failed to create challenge' }
    }

    // If wildcard, record wildcard usage
    if (params.isWildcard && challenge) {
      const { error: wildcardError } = await supabase
        .from('wildcard_usage')
        .insert({
          season_id: activeSeason.id,
          user_id: user.id,
          challenge_id: challenge.id,
        })

      if (wildcardError) {
        console.error('Error recording wildcard usage:', wildcardError)
        // Don't fail the challenge creation, just log it
      }
    }

    // TODO: Create notification for challenged player (Phase 4)

    revalidatePath('/challenges')
    revalidatePath('/dashboard')

    return { success: true, challengeId: challenge.id }
  } catch (error) {
    console.error('Error in createChallenge:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function acceptChallenge(challengeId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get the challenge
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*, challenger:users!challenges_challenger_id_fkey(name), challenged:users!challenges_challenged_id_fkey(name)')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      return { error: 'Challenge not found' }
    }

    // Verify user is the challenged player
    if (challenge.challenged_id !== user.id) {
      return { error: 'You are not authorized to accept this challenge' }
    }

    // Verify challenge is still pending
    if (challenge.status !== 'pending') {
      return { error: 'This challenge is no longer pending' }
    }

    // Accept the challenge - creates a fixture
    const { error: updateError } = await supabase
      .from('challenges')
      .update({
        status: 'accepted',
        accepted_date: challenge.proposed_date,
        accepted_location: challenge.proposed_location,
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)

    if (updateError) {
      console.error('Error accepting challenge:', updateError)
      return { error: 'Failed to accept challenge' }
    }

    // Create match fixture
    const { error: matchError } = await supabase
      .from('matches')
      .insert({
        challenge_id: challengeId,
        season_id: challenge.season_id,
        player1_id: challenge.challenger_id,
        player2_id: challenge.challenged_id,
        match_type: 'challenge',
        match_date: challenge.proposed_date,
        location: challenge.proposed_location,
      })

    if (matchError) {
      console.error('Error creating match:', matchError)
      // Don't fail the whole operation if match creation fails
    }

    // TODO: Create notification for challenger (Phase 4)

    revalidatePath('/challenges')
    revalidatePath('/matches')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in acceptChallenge:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function rejectChallenge(challengeId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get the challenge
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      return { error: 'Challenge not found' }
    }

    // Verify user is the challenged player
    if (challenge.challenged_id !== user.id) {
      return { error: 'You are not authorized to reject this challenge' }
    }

    // Verify challenge is still pending
    if (challenge.status !== 'pending') {
      return { error: 'This challenge is no longer pending' }
    }

    // Reject the challenge - unlocks both players
    const { error: updateError } = await supabase
      .from('challenges')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)

    if (updateError) {
      console.error('Error rejecting challenge:', updateError)
      return { error: 'Failed to reject challenge' }
    }

    // TODO: Create notification for challenger (Phase 4)

    revalidatePath('/challenges')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in rejectChallenge:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function withdrawChallenge(challengeId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Get the challenge
    const { data: challenge } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', challengeId)
      .single()

    if (!challenge) {
      return { error: 'Challenge not found' }
    }

    // Only challenger can withdraw
    if (challenge.challenger_id !== user.id) {
      return { error: 'Only the challenger can withdraw a challenge' }
    }

    // Can only withdraw pending or accepted challenges
    if (!['pending', 'accepted'].includes(challenge.status)) {
      return { error: 'This challenge cannot be withdrawn' }
    }

    // Withdraw the challenge
    const { error: updateError } = await supabase
      .from('challenges')
      .update({
        status: 'withdrawn',
        updated_at: new Date().toISOString(),
      })
      .eq('id', challengeId)

    if (updateError) {
      console.error('Error withdrawing challenge:', updateError)
      return { error: 'Failed to withdraw challenge' }
    }

    // TODO: Create notification for challenged player (Phase 4)

    revalidatePath('/challenges')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in withdrawChallenge:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function getChallengesForUser() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated', challenges: [] }
    }

    // Get active season
    const { data: activeSeason } = await supabase
      .from('seasons')
      .select('id')
      .eq('is_active', true)
      .single()

    if (!activeSeason) {
      return { challenges: [] }
    }

    // Get all challenges where user is involved
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:users!challenges_challenger_id_fkey(id, name, email),
        challenged:users!challenges_challenged_id_fkey(id, name, email),
        season:seasons(name)
      `)
      .eq('season_id', activeSeason.id)
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching challenges:', error)
      return { error: 'Failed to fetch challenges', challenges: [] }
    }

    return { challenges: challenges || [] }
  } catch (error) {
    console.error('Error in getChallengesForUser:', error)
    return { error: 'An unexpected error occurred', challenges: [] }
  }
}

export async function getWildcardsRemaining() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated', remaining: 0 }
    }

    // Get active season
    const { data: activeSeason } = await supabase
      .from('seasons')
      .select('id, wildcards_per_player')
      .eq('is_active', true)
      .single()

    if (!activeSeason) {
      return { remaining: 0 }
    }

    // Get wildcards used
    const { data: wildcardsUsed } = await supabase
      .from('wildcard_usage')
      .select('id')
      .eq('season_id', activeSeason.id)
      .eq('user_id', user.id)

    const remaining = activeSeason.wildcards_per_player - (wildcardsUsed?.length || 0)

    return { remaining, total: activeSeason.wildcards_per_player }
  } catch (error) {
    console.error('Error in getWildcardsRemaining:', error)
    return { error: 'An unexpected error occurred', remaining: 0 }
  }
}
