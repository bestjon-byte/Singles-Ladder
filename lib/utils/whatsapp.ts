import { Challenge } from '@/types'
import { formatDate } from 'date-fns'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://singles-ladder.vercel.app'

/**
 * Generate a formatted WhatsApp message for a challenge
 */
export function generateWhatsAppChallengeMessage(params: {
  challengerName: string
  challengedName: string
  proposedDate: string
  proposedLocation: string
  isWildcard: boolean
}): string {
  const formattedDate = formatDate(new Date(params.proposedDate), 'EEEE, MMMM d, yyyy \'at\' h:mm a')

  return `🎾 Tennis Ladder Challenge${params.isWildcard ? ' (WILDCARD)' : ''}

Hi ${params.challengedName}!

I'd like to challenge you to a match:
📅 Date: ${formattedDate}
📍 Location: ${params.proposedLocation}

Accept here:
${APP_URL}/matches

Good luck! 🎾
- ${params.challengerName}`
}

/**
 * Generate a WhatsApp share link (opens WhatsApp app with pre-filled message)
 */
export function generateWhatsAppShareLink(message: string, phoneNumber?: string): string {
  const encodedMessage = encodeURIComponent(message)

  // Remove all non-digit characters from phone number
  const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : ''

  // Format: https://wa.me/<phone>?text=<message>
  // If no phone number, opens WhatsApp with message ready to send to any contact
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
  } else {
    return `https://wa.me/?text=${encodedMessage}`
  }
}

/**
 * Generate a WhatsApp message for match reminder
 */
export function generateWhatsAppMatchReminder(params: {
  opponentName: string
  matchDate: string
  location: string
  userName: string
}): string {
  const formattedDate = formatDate(new Date(params.matchDate), 'EEEE, MMMM d, yyyy \'at\' h:mm a')

  return `🎾 Match Reminder

Hi ${params.opponentName}!

Just a reminder about our upcoming match:
📅 Date: ${formattedDate}
📍 Location: ${params.location}

See you on the court! 🎾
- ${params.userName}`
}

/**
 * Check if device is likely a mobile device (for better UX)
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    window.navigator.userAgent
  )
}
