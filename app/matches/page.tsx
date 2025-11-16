import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MatchesList from '@/components/matches/MatchesList'

export default async function MatchesPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get active season
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, name')
    .eq('is_active', true)
    .single()

  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Matches
                </h1>
              </div>
              <div className="flex items-center">
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <p className="text-gray-600 dark:text-gray-400">
              No active season. Matches will be available once a season starts.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Get all matches for this user
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      player1:users!matches_player1_id_fkey(id, name, email),
      player2:users!matches_player2_id_fkey(id, name, email),
      winner:users!matches_winner_id_fkey(id, name),
      challenge:challenges(id, is_wildcard)
    `)
    .eq('season_id', activeSeason.id)
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .order('match_date', { ascending: false })

  // Check if user has admin access
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Matches
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Ladder
              </Link>
              <Link
                href="/challenges"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Challenges
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Profile
              </Link>
              {admin && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Matches
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {activeSeason.name}
            </p>
          </div>

          <MatchesList
            matches={matches || []}
            currentUserId={user.id}
          />
        </div>
      </main>
    </div>
  )
}
