'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function fixStuckPositions(seasonId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Verify user is admin
    const { data: admin } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!admin) {
      return { error: 'Only admins can fix ladder positions' }
    }

    // Use service role client to bypass RLS
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Find any players stuck at position -1
    const { data: stuckPlayers } = await serviceSupabase
      .from('ladder_positions')
      .select('id, user_id, position')
      .eq('season_id', seasonId)
      .eq('is_active', true)
      .eq('position', -1)

    if (!stuckPlayers || stuckPlayers.length === 0) {
      return { success: true, message: 'No stuck positions found' }
    }

    console.log(`Found ${stuckPlayers.length} players stuck at position -1`)

    // For each stuck player, find the next available position
    for (const stuckPlayer of stuckPlayers) {
      // Get all positions in order
      const { data: allPositions } = await serviceSupabase
        .from('ladder_positions')
        .select('position')
        .eq('season_id', seasonId)
        .eq('is_active', true)
        .neq('position', -1)
        .order('position', { ascending: true })

      // Find the first gap or append to end
      let targetPosition = 1
      if (allPositions && allPositions.length > 0) {
        // Find first gap in sequence
        for (let i = 0; i < allPositions.length; i++) {
          if (allPositions[i].position !== i + 1) {
            targetPosition = i + 1
            break
          }
        }
        // If no gap, append to end
        if (targetPosition === 1) {
          targetPosition = allPositions[allPositions.length - 1].position + 1
        }
      }

      console.log(`Moving player ${stuckPlayer.user_id} from -1 to ${targetPosition}`)

      // Move player to target position
      await serviceSupabase
        .from('ladder_positions')
        .update({ position: targetPosition })
        .eq('id', stuckPlayer.id)
    }

    revalidatePath('/dashboard')
    revalidatePath('/admin/ladder')

    return { success: true, message: `Fixed ${stuckPlayers.length} stuck position(s)` }
  } catch (error) {
    console.error('Error fixing stuck positions:', error)
    return { error: 'Failed to fix stuck positions' }
  }
}
