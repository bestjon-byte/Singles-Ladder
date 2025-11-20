import { createClient } from '@supabase/supabase-js'

// This script queries the timeline of events between two players
// Run with: npx tsx scripts/query-timeline.ts

async function queryTimeline() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // First, find Mike and Jon Best
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .or('name.ilike.%Mike%,name.ilike.%Jon Best%')

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return
  }

  console.log('\n=== USERS ===')
  console.log(JSON.stringify(users, null, 2))

  if (!users || users.length < 2) {
    console.error('Could not find both Mike and Jon Best')
    return
  }

  const mike = users.find(u => u.name.toLowerCase().includes('mike'))
  const jonBest = users.find(u => u.name.toLowerCase().includes('jon'))

  if (!mike || !jonBest) {
    console.error('Could not identify Mike and Jon Best')
    return
  }

  console.log(`\nMike: ${mike.name} (${mike.id})`)
  console.log(`Jon Best: ${jonBest.name} (${jonBest.id})`)

  // Query challenges between them
  const { data: challenges, error: challengesError } = await supabase
    .from('challenges')
    .select('*')
    .or(`and(challenger_id.eq.${mike.id},challenged_id.eq.${jonBest.id}),and(challenger_id.eq.${jonBest.id},challenged_id.eq.${mike.id})`)
    .order('created_at', { ascending: true })

  if (challengesError) {
    console.error('Error fetching challenges:', challengesError)
  } else {
    console.log('\n=== CHALLENGES ===')
    console.log(JSON.stringify(challenges, null, 2))
  }

  // Query matches between them
  const { data: matches, error: matchesError } = await supabase
    .from('matches')
    .select('*')
    .or(`and(player1_id.eq.${mike.id},player2_id.eq.${jonBest.id}),and(player1_id.eq.${jonBest.id},player2_id.eq.${mike.id})`)
    .order('created_at', { ascending: true })

  if (matchesError) {
    console.error('Error fetching matches:', matchesError)
  } else {
    console.log('\n=== MATCHES ===')
    console.log(JSON.stringify(matches, null, 2))
  }

  // Query notifications for both users related to their challenges/matches
  const { data: notifications, error: notificationsError } = await supabase
    .from('notifications')
    .select('*')
    .in('user_id', [mike.id, jonBest.id])
    .order('created_at', { ascending: true })

  if (notificationsError) {
    console.error('Error fetching notifications:', notificationsError)
  } else {
    console.log('\n=== NOTIFICATIONS (All for both users) ===')
    console.log(JSON.stringify(notifications, null, 2))
  }

  // Create a unified timeline
  const timeline: any[] = []

  if (challenges) {
    challenges.forEach(c => {
      const challenger = c.challenger_id === mike.id ? 'Mike' : 'Jon Best'
      const challenged = c.challenged_id === mike.id ? 'Mike' : 'Jon Best'

      timeline.push({
        timestamp: c.created_at,
        type: 'challenge_created',
        description: `${challenger} challenged ${challenged}`,
        status: c.status,
        data: c
      })

      if (c.accepted_date) {
        timeline.push({
          timestamp: c.accepted_date,
          type: 'challenge_accepted',
          description: `${challenged} accepted challenge from ${challenger}`,
          data: c
        })
      }

      if (c.completed_at) {
        timeline.push({
          timestamp: c.completed_at,
          type: 'challenge_completed',
          description: `Challenge between ${challenger} and ${challenged} completed`,
          data: c
        })
      }

      if (c.status === 'withdrawn' && c.updated_at !== c.created_at) {
        timeline.push({
          timestamp: c.updated_at,
          type: 'challenge_withdrawn',
          description: `Challenge withdrawn (${challenger} vs ${challenged})`,
          data: c
        })
      }
    })
  }

  if (matches) {
    matches.forEach(m => {
      const player1 = m.player1_id === mike.id ? 'Mike' : 'Jon Best'
      const player2 = m.player2_id === mike.id ? 'Mike' : 'Jon Best'
      const winner = m.winner_id === mike.id ? 'Mike' : m.winner_id === jonBest.id ? 'Jon Best' : 'Unknown'

      timeline.push({
        timestamp: m.created_at,
        type: 'match_created',
        description: `Match created: ${player1} vs ${player2}`,
        data: m
      })

      if (m.completed_at) {
        timeline.push({
          timestamp: m.completed_at,
          type: 'match_completed',
          description: `Match completed: ${player1} vs ${player2}, Winner: ${winner}`,
          data: m
        })
      }
    })
  }

  // Sort timeline by timestamp
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  console.log('\n=== UNIFIED TIMELINE ===')
  timeline.forEach(event => {
    console.log(`\n[${new Date(event.timestamp).toISOString()}] ${event.type.toUpperCase()}`)
    console.log(`  ${event.description}`)
    if (event.status) {
      console.log(`  Status: ${event.status}`)
    }
  })
}

queryTimeline().catch(console.error)
