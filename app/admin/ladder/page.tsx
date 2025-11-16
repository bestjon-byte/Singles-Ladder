import { createClient } from '@/lib/supabase/server'
import LadderManagement from '@/components/admin/LadderManagement'

export const dynamic = 'force-dynamic'

export default async function AdminLadderPage() {
  const supabase = await createClient()

  // Get active season
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!activeSeason) {
    return (
      <div className="px-4 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Manage Ladder
        </h1>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <p className="text-gray-600 dark:text-gray-400">
            No active season. Please create and activate a season first.
          </p>
        </div>
      </div>
    )
  }

  // Get current ladder positions with user data
  const { data: positions } = await supabase
    .from('ladder_positions')
    .select(`
      *,
      user:users(*)
    `)
    .eq('season_id', activeSeason.id)
    .eq('is_active', true)
    .order('position', { ascending: true })

  // Get all users who are NOT in the ladder
  const usersInLadder = positions?.map(p => p.user_id) || []

  let availableUsersQuery = supabase
    .from('users')
    .select('*')

  // Only filter out users if there are actually users in the ladder
  if (usersInLadder.length > 0) {
    availableUsersQuery = availableUsersQuery.not('id', 'in', `(${usersInLadder.join(',')})`)
  }

  const { data: availableUsers } = await availableUsersQuery.order('name', { ascending: true })

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Manage Ladder
      </h1>

      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Active Season: <span className="font-medium text-gray-900 dark:text-white">{activeSeason.name}</span>
      </div>

      <LadderManagement
        seasonId={activeSeason.id}
        initialPositions={positions || []}
        availableUsers={availableUsers || []}
      />
    </div>
  )
}
