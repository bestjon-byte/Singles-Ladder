import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifyDeletion() {
  console.log('Checking for remaining semifinal matches...')

  const { data: matches, error } = await supabase
    .from('matches')
    .select('*')
    .eq('match_type', 'semifinal')

  if (error) {
    console.error('Error:', error)
    return
  }

  console.log(`Found ${matches?.length || 0} semifinal matches`)

  if (matches && matches.length > 0) {
    console.log('⚠️  Warning: Semifinal matches still exist:')
    matches.forEach(match => {
      console.log(`  - Match ID: ${match.id}`)
    })
  } else {
    console.log('✅ No semifinal matches found - deletion successful!')
  }
}

verifyDeletion()
