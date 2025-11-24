import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function rollbackPlayoffs() {
  try {
    console.log('Starting playoff rollback...\n')

    // 1. Get the active season
    const { data: season, error: seasonError } = await supabase
      .from('seasons')
      .select('*')
      .eq('is_active', true)
      .single()

    if (seasonError || !season) {
      console.error('Error fetching active season:', seasonError)
      return
    }

    console.log(`Found active season: ${season.name} (ID: ${season.id})`)
    console.log(`Current status: ${season.status}\n`)

    // 2. Delete all playoff matches (semifinal, final, third_place, quarterfinal)
    console.log('Deleting playoff matches...')
    const { data: playoffMatches, error: fetchMatchesError } = await supabase
      .from('matches')
      .select('*')
      .eq('season_id', season.id)
      .in('match_type', ['semifinal', 'final', 'third_place', 'quarterfinal'])

    if (fetchMatchesError) {
      console.error('Error fetching playoff matches:', fetchMatchesError)
      return
    }

    console.log(`Found ${playoffMatches?.length || 0} playoff matches to delete`)

    if (playoffMatches && playoffMatches.length > 0) {
      // Delete related notifications
      console.log('Deleting related notifications...')
      for (const match of playoffMatches) {
        await supabase
          .from('notifications')
          .delete()
          .eq('related_match_id', match.id)
      }

      // Delete matches
      const { error: deleteMatchesError } = await supabase
        .from('matches')
        .delete()
        .eq('season_id', season.id)
        .in('match_type', ['semifinal', 'final', 'third_place', 'quarterfinal'])

      if (deleteMatchesError) {
        console.error('Error deleting matches:', deleteMatchesError)
        return
      }
      console.log('✅ Playoff matches deleted\n')
    }

    // 3. Delete playoff bracket data
    console.log('Deleting playoff bracket...')
    const { error: deleteBracketError } = await supabase
      .from('playoff_brackets')
      .delete()
      .eq('season_id', season.id)

    if (deleteBracketError && deleteBracketError.code !== 'PGRST116') { // PGRST116 = no rows found (not an error)
      console.error('Error deleting bracket:', deleteBracketError)
    } else {
      console.log('✅ Playoff bracket deleted\n')
    }

    // 4. Reset season to 'active' status
    console.log('Resetting season status to active...')
    const { error: updateSeasonError } = await supabase
      .from('seasons')
      .update({
        status: 'active',
        playoff_started_at: null,
        playoff_winner_id: null,
        playoff_completed_at: null,
        playoff_format: null
      })
      .eq('id', season.id)

    if (updateSeasonError) {
      console.error('Error updating season:', updateSeasonError)
      return
    }

    console.log('✅ Season reset to active status\n')

    // 5. Verify the rollback
    const { data: updatedSeason } = await supabase
      .from('seasons')
      .select('*')
      .eq('id', season.id)
      .single()

    console.log('=== ROLLBACK COMPLETE ===')
    console.log(`Season: ${updatedSeason?.name}`)
    console.log(`Status: ${updatedSeason?.status}`)
    console.log(`Playoff started: ${updatedSeason?.playoff_started_at || 'null'}`)
    console.log('\nYou can now test the knockout phase again!')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

rollbackPlayoffs()
