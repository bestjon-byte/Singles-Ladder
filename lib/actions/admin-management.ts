'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function promoteToAdmin(userId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Verify current user is admin
    const { data: currentAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!currentAdmin) {
      return { error: 'Only admins can promote users' }
    }

    // Check if user is already an admin
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingAdmin) {
      return { error: 'User is already an admin' }
    }

    // Get user's email for the admins table
    const { data: targetUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return { error: 'User not found' }
    }

    // Promote user to admin
    const { error: insertError } = await supabase
      .from('admins')
      .insert({
        user_id: userId,
        email: targetUser.email,
      })

    if (insertError) {
      console.error('Error promoting user to admin:', insertError)
      return { error: 'Failed to promote user to admin' }
    }

    revalidatePath('/admin/users')

    return { success: true }
  } catch (error) {
    console.error('Error in promoteToAdmin:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function demoteFromAdmin(userId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Verify current user is admin
    const { data: currentAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!currentAdmin) {
      return { error: 'Only admins can demote users' }
    }

    // Prevent self-demotion
    if (userId === user.id) {
      return { error: 'You cannot demote yourself' }
    }

    // Demote user from admin
    const { error: deleteError } = await supabase
      .from('admins')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error demoting user from admin:', deleteError)
      return { error: 'Failed to demote user from admin' }
    }

    revalidatePath('/admin/users')

    return { success: true }
  } catch (error) {
    console.error('Error in demoteFromAdmin:', error)
    return { error: 'An unexpected error occurred' }
  }
}
