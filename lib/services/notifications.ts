import { createClient } from '@supabase/supabase-js'
import { NotificationType } from '@/types'
import {
  sendChallengeReceivedEmail,
  sendChallengeAcceptedEmail,
  sendChallengeRejectedEmail,
  sendChallengeWithdrawnEmail,
  sendMatchScoreSubmittedEmail,
} from './email'

// Use service role client to bypass RLS for system operations
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  relatedChallengeId?: string
  relatedMatchId?: string
  sendEmail?: boolean
}

/**
 * Core function to create a notification in the database
 */
async function createNotification(params: CreateNotificationParams): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getServiceClient()

    // Insert notification into database
    const { error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        related_challenge_id: params.relatedChallengeId || null,
        related_match_id: params.relatedMatchId || null,
        email_sent: params.sendEmail || false,
      })

    if (insertError) {
      console.error('Error creating notification:', insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Exception creating notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Notify challenged player about a new challenge
 */
export async function notifyChallengeReceived(challengeId: string): Promise<void> {
  try {
    const supabase = getServiceClient()

    // Fetch challenge details with user information
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:users!challenges_challenger_id_fkey(id, name, email, email_notifications_enabled),
        challenged:users!challenges_challenged_id_fkey(id, name, email, email_notifications_enabled)
      `)
      .eq('id', challengeId)
      .single()

    if (error || !challenge) {
      console.error('Error fetching challenge for notification:', error)
      return
    }

    const challenger = challenge.challenger as any
    const challenged = challenge.challenged as any

    // Create in-app notification
    await createNotification({
      userId: challenged.id,
      type: 'challenge_received',
      title: `New challenge from ${challenger.name}`,
      message: `${challenger.name} has challenged you to a match on ${new Date(challenge.proposed_date).toLocaleDateString()}.`,
      relatedChallengeId: challengeId,
      sendEmail: challenged.email_notifications_enabled,
    })

    // Send email if enabled
    if (challenged.email_notifications_enabled) {
      await sendChallengeReceivedEmail({
        recipientEmail: challenged.email,
        recipientName: challenged.name,
        challengerName: challenger.name,
        proposedDate: challenge.proposed_date,
        proposedLocation: challenge.proposed_location,
        challengeId,
        isWildcard: challenge.is_wildcard,
      })
    }
  } catch (error) {
    console.error('Error in notifyChallengeReceived:', error)
    // Don't throw - notification failures shouldn't break core operations
  }
}

/**
 * Notify challenger that their challenge was accepted
 */
export async function notifyChallengeAccepted(challengeId: string): Promise<void> {
  try {
    const supabase = getServiceClient()

    // Fetch challenge details with user information
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:users!challenges_challenger_id_fkey(id, name, email, email_notifications_enabled),
        challenged:users!challenges_challenged_id_fkey(id, name, email, email_notifications_enabled)
      `)
      .eq('id', challengeId)
      .single()

    if (error || !challenge) {
      console.error('Error fetching challenge for notification:', error)
      return
    }

    const challenger = challenge.challenger as any
    const challenged = challenge.challenged as any

    // Create in-app notification
    await createNotification({
      userId: challenger.id,
      type: 'challenge_accepted',
      title: `${challenged.name} accepted your challenge!`,
      message: `Your match is scheduled for ${new Date(challenge.accepted_date || challenge.proposed_date).toLocaleDateString()}.`,
      relatedChallengeId: challengeId,
      sendEmail: challenger.email_notifications_enabled,
    })

    // Send email if enabled
    if (challenger.email_notifications_enabled) {
      await sendChallengeAcceptedEmail({
        recipientEmail: challenger.email,
        recipientName: challenger.name,
        challengedName: challenged.name,
        acceptedDate: challenge.accepted_date || challenge.proposed_date,
        acceptedLocation: challenge.accepted_location || challenge.proposed_location,
        challengeId,
      })
    }
  } catch (error) {
    console.error('Error in notifyChallengeAccepted:', error)
  }
}

/**
 * Notify challenger that their challenge was rejected
 */
export async function notifyChallengeRejected(challengeId: string): Promise<void> {
  try {
    const supabase = getServiceClient()

    // Fetch challenge details with user information
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:users!challenges_challenger_id_fkey(id, name, email, email_notifications_enabled),
        challenged:users!challenges_challenged_id_fkey(id, name, email, email_notifications_enabled)
      `)
      .eq('id', challengeId)
      .single()

    if (error || !challenge) {
      console.error('Error fetching challenge for notification:', error)
      return
    }

    const challenger = challenge.challenger as any
    const challenged = challenge.challenged as any

    // Create in-app notification
    await createNotification({
      userId: challenger.id,
      type: 'challenge_accepted', // Reusing type, but message is different
      title: `Challenge declined`,
      message: `${challenged.name} has declined your challenge.`,
      relatedChallengeId: challengeId,
      sendEmail: challenger.email_notifications_enabled,
    })

    // Send email if enabled
    if (challenger.email_notifications_enabled) {
      await sendChallengeRejectedEmail({
        recipientEmail: challenger.email,
        recipientName: challenger.name,
        challengedName: challenged.name,
        challengeId,
      })
    }
  } catch (error) {
    console.error('Error in notifyChallengeRejected:', error)
  }
}

/**
 * Notify challenged player that the challenge was withdrawn
 */
export async function notifyChallengeWithdrawn(challengeId: string): Promise<void> {
  try {
    const supabase = getServiceClient()

    // Fetch challenge details with user information
    const { data: challenge, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:users!challenges_challenger_id_fkey(id, name, email, email_notifications_enabled),
        challenged:users!challenges_challenged_id_fkey(id, name, email, email_notifications_enabled)
      `)
      .eq('id', challengeId)
      .single()

    if (error || !challenge) {
      console.error('Error fetching challenge for notification:', error)
      return
    }

    const challenger = challenge.challenger as any
    const challenged = challenge.challenged as any

    // Create in-app notification
    await createNotification({
      userId: challenged.id,
      type: 'challenge_accepted', // Reusing type
      title: `Challenge withdrawn`,
      message: `${challenger.name} has withdrawn their challenge.`,
      relatedChallengeId: challengeId,
      sendEmail: challenged.email_notifications_enabled,
    })

    // Send email if enabled
    if (challenged.email_notifications_enabled) {
      await sendChallengeWithdrawnEmail({
        recipientEmail: challenged.email,
        recipientName: challenged.name,
        challengerName: challenger.name,
        challengeId,
      })
    }
  } catch (error) {
    console.error('Error in notifyChallengeWithdrawn:', error)
  }
}

/**
 * Notify both players when a match score is submitted
 */
export async function notifyMatchScoreSubmitted(matchId: string): Promise<void> {
  try {
    const supabase = getServiceClient()

    // Fetch match details with user information
    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:users!matches_player1_id_fkey(id, name, email, email_notifications_enabled),
        player2:users!matches_player2_id_fkey(id, name, email, email_notifications_enabled),
        winner:users!matches_winner_id_fkey(id, name),
        submitter:users!matches_submitted_by_user_id_fkey(id, name)
      `)
      .eq('id', matchId)
      .single()

    if (error || !match) {
      console.error('Error fetching match for notification:', error)
      return
    }

    const player1 = match.player1 as any
    const player2 = match.player2 as any
    const winner = match.winner as any
    const submitter = match.submitter as any

    // Format scores
    const set1Score = `${match.set1_player1_score}-${match.set1_player2_score}`
    const set2Score = `${match.set2_player1_score}-${match.set2_player2_score}`
    const set3Score = match.set3_player1_score !== null && match.set3_player2_score !== null
      ? `${match.set3_player1_score}-${match.set3_player2_score}`
      : undefined

    // Notify player 1 (if not the submitter)
    if (match.submitted_by_user_id !== player1.id) {
      await createNotification({
        userId: player1.id,
        type: 'score_submitted',
        title: 'Match score submitted',
        message: `${submitter.name} submitted the score for your match. Winner: ${winner.name}`,
        relatedMatchId: matchId,
        sendEmail: player1.email_notifications_enabled,
      })

      if (player1.email_notifications_enabled) {
        await sendMatchScoreSubmittedEmail({
          recipientEmail: player1.email,
          recipientName: player1.name,
          opponentName: player2.name,
          submitterName: submitter.name,
          winner: winner.name,
          set1Score,
          set2Score,
          set3Score,
          matchId,
        })
      }
    }

    // Notify player 2 (if not the submitter)
    if (match.submitted_by_user_id !== player2.id) {
      await createNotification({
        userId: player2.id,
        type: 'score_submitted',
        title: 'Match score submitted',
        message: `${submitter.name} submitted the score for your match. Winner: ${winner.name}`,
        relatedMatchId: matchId,
        sendEmail: player2.email_notifications_enabled,
      })

      if (player2.email_notifications_enabled) {
        await sendMatchScoreSubmittedEmail({
          recipientEmail: player2.email,
          recipientName: player2.name,
          opponentName: player1.name,
          submitterName: submitter.name,
          winner: winner.name,
          set1Score,
          set2Score,
          set3Score,
          matchId,
        })
      }
    }
  } catch (error) {
    console.error('Error in notifyMatchScoreSubmitted:', error)
  }
}
