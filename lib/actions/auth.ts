'use server'

import { notifyNewUserSignup } from '@/lib/services/notifications'

/**
 * Server action to notify admins of new user signup
 * This should be called after successful user registration
 */
export async function notifyAdminsOfNewUser(userId: string) {
  try {
    await notifyNewUserSignup(userId)
    return { success: true }
  } catch (error) {
    console.error('Error notifying admins of new user:', error)
    return { success: false, error: 'Failed to notify admins' }
  }
}
