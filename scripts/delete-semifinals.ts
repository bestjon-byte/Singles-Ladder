import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function deleteSemiFinals() {
  try {
    console.log('Fetching semi-final matches...')

    // First, get all semi-final matches
    const { data: matches, error: fetchError } = await supabase
      .from('matches')
      .select('*')
      .eq('match_type', 'semifinal')

    if (fetchError) {
      console.error('Error fetching matches:', fetchError)
      return
    }

    console.log(`Found ${matches?.length || 0} semi-final matches`)

    if (!matches || matches.length === 0) {
      console.log('No semi-final matches to delete')
      return
    }

    // Display matches before deletion
    console.log('\nMatches to be deleted:')
    matches.forEach(match => {
      console.log(`- Match ID: ${match.id}, Status: ${match.status}, Winner: ${match.winner_id || 'N/A'}`)
    })

    // Delete related notifications
    console.log('\nDeleting related notifications...')
    for (const match of matches) {
      // Only delete if related_match_id is the current match
      const { error: notifError } = await supabase
        .from('notifications')
        .delete()
        .eq('related_match_id', match.id)

      if (notifError) {
        console.error(`Error deleting notifications for match ${match.id}:`, notifError)
      }
    }

    // Delete the matches
    console.log('\nDeleting semi-final matches...')
    const { error: deleteError } = await supabase
      .from('matches')
      .delete()
      .eq('match_type', 'semifinal')

    if (deleteError) {
      console.error('Error deleting matches:', deleteError)
      return
    }

    console.log('✅ Successfully deleted all semi-final matches and related data')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

deleteSemiFinals()
