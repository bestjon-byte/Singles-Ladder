'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CreateSeasonData {
  name: string
  startDate: string
  endDate: string | null
  wildcardsAllowed: number
}

export async function createSeason(data: CreateSeasonData) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!admin) {
      return { error: 'Unauthorized - admin access required' }
    }

    // Create the season
    const { error: insertError } = await supabase
      .from('seasons')
      .insert({
        name: data.name,
        start_date: data.startDate,
        end_date: data.endDate,
        wildcards_per_player: data.wildcardsAllowed,
        is_active: false, // Don't auto-activate
      })

    if (insertError) {
      console.error('Error creating season:', insertError)
      return { error: 'Failed to create season' }
    }

    revalidatePath('/admin/seasons')
    revalidatePath('/admin')

    return { success: true }
  } catch (error) {
    console.error('Error in createSeason:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function toggleSeasonActive(seasonId: string, isActive: boolean) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!admin) {
      return { error: 'Unauthorized - admin access required' }
    }

    // If activating, deactivate all other seasons first
    if (isActive) {
      const { error: deactivateError } = await supabase
        .from('seasons')
        .update({ is_active: false })
        .neq('id', seasonId)

      if (deactivateError) {
        console.error('Error deactivating other seasons:', deactivateError)
        return { error: 'Failed to deactivate other seasons' }
      }
    }

    // Update the target season
    const { error: updateError } = await supabase
      .from('seasons')
      .update({ is_active: isActive })
      .eq('id', seasonId)

    if (updateError) {
      console.error('Error updating season:', updateError)
      return { error: 'Failed to update season' }
    }

    revalidatePath('/admin/seasons')
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in toggleSeasonActive:', error)
    return { error: 'An unexpected error occurred' }
  }
}
