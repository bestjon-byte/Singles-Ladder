import { Resend } from 'resend'
import {
  generateChallengeReceivedEmail,
  generateChallengeAcceptedEmail,
  generateChallengeRejectedEmail,
  generateChallengeWithdrawnEmail,
  generateMatchScoreSubmittedEmail,
  generateScoreDisputedEmail,
  generateNewUserSignupEmail,
} from '@/lib/templates/email-html'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY)

// Default sender email
const FROM_EMAIL = process.env.FROM_EMAIL || 'Tennis Ladder <noreply@tennisladder.com>'

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

/**
 * Base email sending function
 */
async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  // Skip if Resend is not configured
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured - skipping email send')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent successfully:', data?.id)
    return { success: true }
  } catch (error) {
    console.error('Exception sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send challenge received notification email
 */
export async function sendChallengeReceivedEmail(params: {
  recipientEmail: string
  recipientName: string
  challengerName: string
  proposedDate: string
  proposedLocation: string
  challengeId: string
  isWildcard: boolean
}): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = generateChallengeReceivedEmail({
    recipientName: params.recipientName,
    challengerName: params.challengerName,
    proposedDate: params.proposedDate,
    proposedLocation: params.proposedLocation,
    challengeId: params.challengeId,
    isWildcard: params.isWildcard,
  })

  return sendEmail({
    to: params.recipientEmail,
    subject,
    html,
  })
}

/**
 * Send challenge accepted notification email
 */
export async function sendChallengeAcceptedEmail(params: {
  recipientEmail: string
  recipientName: string
  challengedName: string
  acceptedDate: string
  acceptedLocation: string
  challengeId: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = generateChallengeAcceptedEmail({
    recipientName: params.recipientName,
    challengedName: params.challengedName,
    acceptedDate: params.acceptedDate,
    acceptedLocation: params.acceptedLocation,
    challengeId: params.challengeId,
  })

  return sendEmail({
    to: params.recipientEmail,
    subject,
    html,
  })
}

/**
 * Send challenge rejected notification email
 */
export async function sendChallengeRejectedEmail(params: {
  recipientEmail: string
  recipientName: string
  challengedName: string
  challengeId: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = generateChallengeRejectedEmail({
    recipientName: params.recipientName,
    challengedName: params.challengedName,
    challengeId: params.challengeId,
  })

  return sendEmail({
    to: params.recipientEmail,
    subject,
    html,
  })
}

/**
 * Send challenge withdrawn notification email
 */
export async function sendChallengeWithdrawnEmail(params: {
  recipientEmail: string
  recipientName: string
  challengerName: string
  challengeId: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = generateChallengeWithdrawnEmail({
    recipientName: params.recipientName,
    challengerName: params.challengerName,
    challengeId: params.challengeId,
  })

  return sendEmail({
    to: params.recipientEmail,
    subject,
    html,
  })
}

/**
 * Send match score submitted notification email
 */
export async function sendMatchScoreSubmittedEmail(params: {
  recipientEmail: string
  recipientName: string
  opponentName: string
  submitterName: string
  winner: string
  set1Score: string
  set2Score: string
  set3Score?: string
  matchId: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = generateMatchScoreSubmittedEmail({
    recipientName: params.recipientName,
    opponentName: params.opponentName,
    submitterName: params.submitterName,
    winner: params.winner,
    set1Score: params.set1Score,
    set2Score: params.set2Score,
    set3Score: params.set3Score,
    matchId: params.matchId,
  })

  return sendEmail({
    to: params.recipientEmail,
    subject,
    html,
  })
}

/**
 * Send score disputed notification email
 */
export async function sendScoreDisputedEmail(params: {
  recipientEmail: string
  recipientName: string
  opponentName: string
  disputedByName: string
  set1Score: string
  set2Score: string
  set3Score?: string
  matchId: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = generateScoreDisputedEmail({
    recipientName: params.recipientName,
    opponentName: params.opponentName,
    disputedByName: params.disputedByName,
    set1Score: params.set1Score,
    set2Score: params.set2Score,
    set3Score: params.set3Score,
    matchId: params.matchId,
  })

  return sendEmail({
    to: params.recipientEmail,
    subject,
    html,
  })
}

/**
 * Send new user signup notification email to admin
 */
export async function sendNewUserSignupEmail(params: {
  adminEmail: string
  adminName: string
  newUserName: string
  newUserEmail: string
  newUserWhatsapp?: string
}): Promise<{ success: boolean; error?: string }> {
  const { subject, html } = generateNewUserSignupEmail({
    adminName: params.adminName,
    newUserName: params.newUserName,
    newUserEmail: params.newUserEmail,
    newUserWhatsapp: params.newUserWhatsapp,
  })

  return sendEmail({
    to: params.adminEmail,
    subject,
    html,
  })
}
