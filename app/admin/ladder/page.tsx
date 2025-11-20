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
        <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-8">
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
            Manage Ladder
          </h1>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Active Season: <span className="font-medium text-gray-900 dark:text-white">{activeSeason.name}</span>
            {activeSeason.status === 'playoffs' && (
              <span className="ml-2 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md text-xs font-medium">
                Playoffs In Progress
              </span>
            )}
            {activeSeason.status === 'completed' && (
              <span className="ml-2 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-xs font-medium">
                Season Complete
              </span>
            )}
          </div>
        </div>
      </div>

      <LadderManagement
        seasonId={activeSeason.id}
        seasonName={activeSeason.name}
        seasonStatus={activeSeason.status}
        initialPositions={positions || []}
        availableUsers={availableUsers || []}
      />
    </div>
  )
}
