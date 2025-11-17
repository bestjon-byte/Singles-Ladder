'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addPlayerToLadder(
  seasonId: string,
  userId: string,
  position: number
) {
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

    // Check if user is already in the ladder
    const { data: existingPosition } = await supabase
      .from('ladder_positions')
      .select('id')
      .eq('season_id', seasonId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (existingPosition) {
      return { error: 'Player is already in the ladder' }
    }

    // Get all positions at or after the target position
    const { data: positionsToShift } = await supabase
      .from('ladder_positions')
      .select('id, position, user_id')
      .eq('season_id', seasonId)
      .eq('is_active', true)
      .gte('position', position)
      .order('position', { ascending: false }) // Process in reverse order to avoid conflicts

    // Shift existing positions down
    if (positionsToShift && positionsToShift.length > 0) {
      for (const pos of positionsToShift) {
        const { error: updateError } = await supabase
          .from('ladder_positions')
          .update({ position: pos.position + 1 })
          .eq('id', pos.id)

        if (updateError) {
          console.error('Error shifting position:', updateError)
          return { error: 'Failed to shift existing positions' }
        }
      }
    }

    // Insert the new player at the specified position
    const { error: insertError } = await supabase
      .from('ladder_positions')
      .insert({
        season_id: seasonId,
        user_id: userId,
        position: position,
        is_active: true,
      })

    if (insertError) {
      console.error('Error inserting position:', insertError)
      return { error: 'Failed to add player to ladder' }
    }

    revalidatePath('/admin/ladder')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in addPlayerToLadder:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function removePlayerFromLadder(seasonId: string, userId: string) {
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

    // Get the position being removed
    const { data: positionToRemove } = await supabase
      .from('ladder_positions')
      .select('id, position')
      .eq('season_id', seasonId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!positionToRemove) {
      return { error: 'Player not found in ladder' }
    }

    // Mark position as inactive instead of deleting (preserves history)
    const { error: updateError } = await supabase
      .from('ladder_positions')
      .update({ is_active: false })
      .eq('id', positionToRemove.id)

    if (updateError) {
      console.error('Error removing position:', updateError)
      return { error: 'Failed to remove player from ladder' }
    }

    // Shift positions above down to fill the gap
    const { data: positionsToShift } = await supabase
      .from('ladder_positions')
      .select('id, position')
      .eq('season_id', seasonId)
      .eq('is_active', true)
      .gt('position', positionToRemove.position)
      .order('position', { ascending: true }) // Process in forward order

    if (positionsToShift && positionsToShift.length > 0) {
      for (const pos of positionsToShift) {
        const { error: shiftError } = await supabase
          .from('ladder_positions')
          .update({ position: pos.position - 1 })
          .eq('id', pos.id)

        if (shiftError) {
          console.error('Error shifting position:', shiftError)
          // Continue anyway, this is less critical
        }
      }
    }

    revalidatePath('/admin/ladder')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in removePlayerFromLadder:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function movePlayerPosition(
  seasonId: string,
  userId: string,
  newPosition: number
) {
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

    // Get the player's current position
    const { data: currentPositionData } = await supabase
      .from('ladder_positions')
      .select('id, position')
      .eq('season_id', seasonId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (!currentPositionData) {
      return { error: 'Player not found in ladder' }
    }

    const currentPosition = currentPositionData.position

    // No change needed
    if (currentPosition === newPosition) {
      return { success: true }
    }

    // Step 1: Move the player to a temporary position to avoid constraint violations
    const { error: tempError } = await supabase
      .from('ladder_positions')
      .update({ position: -1 })
      .eq('id', currentPositionData.id)

    if (tempError) {
      console.error('Error moving to temp position:', tempError)
      return { error: 'Failed to move player to temporary position' }
    }

    // Step 2: Shift other positions
    if (currentPosition < newPosition) {
      // Moving down: shift positions between current and new up by 1
      const { data: positionsToShift } = await supabase
        .from('ladder_positions')
        .select('id, position')
        .eq('season_id', seasonId)
        .eq('is_active', true)
        .gt('position', currentPosition)
        .lte('position', newPosition)
        .order('position', { ascending: true })

      if (positionsToShift && positionsToShift.length > 0) {
        for (const pos of positionsToShift) {
          const { error: shiftError } = await supabase
            .from('ladder_positions')
            .update({ position: pos.position - 1 })
            .eq('id', pos.id)

          if (shiftError) {
            console.error('Error shifting position up:', shiftError)
            return { error: 'Failed to shift positions' }
          }
        }
      }
    } else {
      // Moving up: shift positions between new and current down by 1
      const { data: positionsToShift } = await supabase
        .from('ladder_positions')
        .select('id, position')
        .eq('season_id', seasonId)
        .eq('is_active', true)
        .gte('position', newPosition)
        .lt('position', currentPosition)
        .order('position', { ascending: false })

      if (positionsToShift && positionsToShift.length > 0) {
        for (const pos of positionsToShift) {
          const { error: shiftError } = await supabase
            .from('ladder_positions')
            .update({ position: pos.position + 1 })
            .eq('id', pos.id)

          if (shiftError) {
            console.error('Error shifting position down:', shiftError)
            return { error: 'Failed to shift positions' }
          }
        }
      }
    }

    // Step 3: Update the player's position to final position
    const { error: updateError } = await supabase
      .from('ladder_positions')
      .update({ position: newPosition })
      .eq('id', currentPositionData.id)

    if (updateError) {
      console.error('Error updating position:', updateError)
      return { error: 'Failed to update player position' }
    }

    revalidatePath('/admin/ladder')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error in movePlayerPosition:', error)
    return { error: 'An unexpected error occurred' }
  }
}
