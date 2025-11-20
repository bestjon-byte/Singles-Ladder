'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AvailabilityData } from '@/types/availability'

export interface UpdateProfileParams {
  name: string
  whatsapp_number?: string
  email_notifications_enabled: boolean
  whatsapp_notifications_enabled: boolean
  availability?: AvailabilityData | null
}

export async function updateProfile(params: UpdateProfileParams) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Update user profile
  const { error } = await supabase
    .from('users')
    .update({
      name: params.name,
      whatsapp_number: params.whatsapp_number || null,
      email_notifications_enabled: params.email_notifications_enabled,
      whatsapp_notifications_enabled: params.whatsapp_notifications_enabled,
      availability: params.availability || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    return { error: error.message }
  }

  revalidatePath('/profile')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Update password via Supabase Auth
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    console.error('Password update error:', error)
    return { error: error.message }
  }

  return { success: true }
}
