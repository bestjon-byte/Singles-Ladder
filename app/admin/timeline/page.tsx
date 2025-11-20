'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TimelineEvent {
  timestamp: string
  type: string
  description: string
  status?: string
  data: any
}

export default function TimelinePage() {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [player1Name, setPlayer1Name] = useState('Mike')
  const [player2Name, setPlayer2Name] = useState('Jon Best')

  const fetchTimeline = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // Find users by name
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${player1Name}%,name.ilike.%${player2Name}%`)

      if (usersError) throw usersError

      console.log('Found users:', users)

      const player1 = users?.find(u =>
        u.name.toLowerCase().includes(player1Name.toLowerCase())
      )
      const player2 = users?.find(u =>
        u.name.toLowerCase().includes(player2Name.toLowerCase())
      )

      if (!player1 || !player2) {
        setError(`Could not find both players. Found: ${users?.map(u => u.name).join(', ')}`)
        setLoading(false)
        return
      }

      console.log(`Player 1: ${player1.name} (${player1.id})`)
      console.log(`Player 2: ${player2.name} (${player2.id})`)

      // Query challenges
      const { data: challenges, error: challengesError } = await supabase
        .from('challenges')
        .select('*')
        .or(`and(challenger_id.eq.${player1.id},challenged_id.eq.${player2.id}),and(challenger_id.eq.${player2.id},challenged_id.eq.${player1.id})`)
        .order('created_at', { ascending: true })

      if (challengesError) throw challengesError

      console.log('Challenges:', challenges)

      // Query matches
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`and(player1_id.eq.${player1.id},player2_id.eq.${player2.id}),and(player1_id.eq.${player2.id},player2_id.eq.${player1.id})`)
        .order('created_at', { ascending: true })

      if (matchesError) throw matchesError

      console.log('Matches:', matches)

      // Build timeline
      const events: TimelineEvent[] = []

      // Add challenge events
      challenges?.forEach(c => {
        const challenger = c.challenger_id === player1.id ? player1.name : player2.name
        const challenged = c.challenged_id === player1.id ? player1.name : player2.name

        events.push({
          timestamp: c.created_at,
          type: 'challenge_created',
          description: `${challenger} challenged ${challenged}`,
          status: c.status,
          data: c
        })

        if (c.accepted_date) {
          events.push({
            timestamp: c.accepted_date,
            type: 'challenge_accepted',
            description: `${challenged} accepted challenge from ${challenger}`,
            status: c.status,
            data: c
          })
        }

        if (c.status === 'withdrawn') {
          events.push({
            timestamp: c.updated_at,
            type: 'challenge_withdrawn',
            description: `Challenge withdrawn (${challenger} vs ${challenged})`,
            status: c.status,
            data: c
          })
        }

        if (c.completed_at) {
          events.push({
            timestamp: c.completed_at,
            type: 'challenge_completed',
            description: `Challenge completed (${challenger} vs ${challenged})`,
            status: c.status,
            data: c
          })
        }
      })

      // Add match events
      matches?.forEach(m => {
        const p1 = m.player1_id === player1.id ? player1.name : player2.name
        const p2 = m.player2_id === player1.id ? player1.name : player2.name
        const winner = m.winner_id === player1.id ? player1.name :
                       m.winner_id === player2.id ? player2.name : 'Unknown'

        events.push({
          timestamp: m.created_at,
          type: 'match_created',
          description: `Match created: ${p1} vs ${p2} (Challenge ID: ${m.challenge_id?.substring(0, 8) || 'None'})`,
          data: m
        })

        if (m.completed_at) {
          events.push({
            timestamp: m.completed_at,
            type: 'match_completed',
            description: `Match completed: ${p1} vs ${p2}, Winner: ${winner}`,
            data: m
          })
        }
      })

      // Sort by timestamp
      events.sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      setTimeline(events)
      setLoading(false)
    } catch (err: any) {
      console.error('Error fetching timeline:', err)
      setError(err.message)
      setLoading(false)
    }
  }, [player1Name, player2Name])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  if (loading) return <div className="p-8">Loading timeline...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Player Timeline Debug</h1>

      <div className="mb-6 flex gap-4">
        <div>
          <label className="block mb-2">Player 1 Name:</label>
          <input
            type="text"
            value={player1Name}
            onChange={(e) => setPlayer1Name(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <div>
          <label className="block mb-2">Player 2 Name:</label>
          <input
            type="text"
            value={player2Name}
            onChange={(e) => setPlayer2Name(e.target.value)}
            className="border p-2 rounded"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchTimeline}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Timeline of Events ({timeline.length} events)</h2>
        {timeline.length === 0 && (
          <p className="text-gray-500">No events found between these players.</p>
        )}
        {timeline.map((event, index) => (
          <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
            <div className="text-sm text-gray-500">
              {new Date(event.timestamp).toLocaleString()}
            </div>
            <div className="font-semibold text-lg">{event.type}</div>
            <div>{event.description}</div>
            {event.status && (
              <div className="text-sm text-gray-600">Status: {event.status}</div>
            )}
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-blue-600">
                View raw data
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(event.data, null, 2)}
              </pre>
            </details>
          </div>
        ))}
      </div>
    </div>
  )
}
