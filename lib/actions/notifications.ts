'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  email_sent: boolean
  created_at: string
  related_challenge_id?: string
  related_match_id?: string
}

/**
 * Get notifications for the current user
 */
export async function getNotificationsForUser(limit?: number) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated', notifications: [] }
    }

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return { error: 'Failed to fetch notifications', notifications: [] }
    }

    return { notifications: notifications || [] }
  } catch (error) {
    console.error('Error in getNotificationsForUser:', error)
    return { error: 'An unexpected error occurred', notifications: [] }
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCount() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated', count: 0 }
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error('Error fetching unread count:', error)
      return { error: 'Failed to fetch unread count', count: 0 }
    }

    return { count: count || 0 }
  } catch (error) {
    console.error('Error in getUnreadCount:', error)
    return { error: 'An unexpected error occurred', count: 0 }
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Update notification
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user owns this notification

    if (updateError) {
      console.error('Error marking notification as read:', updateError)
      return { error: 'Failed to mark notification as read' }
    }

    revalidatePath('/notifications')

    return { success: true }
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllNotificationsAsRead() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Update all unread notifications
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (updateError) {
      console.error('Error marking all notifications as read:', updateError)
      return { error: 'Failed to mark all notifications as read' }
    }

    revalidatePath('/notifications')

    return { success: true }
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Delete notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id) // Ensure user owns this notification

    if (deleteError) {
      console.error('Error deleting notification:', deleteError)
      return { error: 'Failed to delete notification' }
    }

    revalidatePath('/notifications')

    return { success: true }
  } catch (error) {
    console.error('Error in deleteNotification:', error)
    return { error: 'An unexpected error occurred' }
  }
}
