import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ChallengesList from '@/components/challenges/ChallengesList'
import CreateChallengeButton from '@/components/challenges/CreateChallengeButton'

export default async function ChallengesPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get active season
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, name, wildcards_per_player')
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
                  Challenges
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
              No active season. Challenges will be available once a season starts.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Check if user is on the ladder
  const { data: ladderPosition } = await supabase
    .from('ladder_positions')
    .select('position')
    .eq('season_id', activeSeason.id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  // Get all challenges for this user
  const { data: challenges } = await supabase
    .from('challenges')
    .select(`
      *,
      challenger:users!challenges_challenger_id_fkey(id, name, email),
      challenged:users!challenges_challenged_id_fkey(id, name, email)
    `)
    .eq('season_id', activeSeason.id)
    .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Get wildcards remaining
  const { data: wildcardsUsed } = await supabase
    .from('wildcard_usage')
    .select('id')
    .eq('season_id', activeSeason.id)
    .eq('user_id', user.id)

  const wildcardsRemaining = activeSeason.wildcards_per_player - (wildcardsUsed?.length || 0)

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
                Challenges
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
                href="/matches"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Matches
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
          {/* Header with Create Challenge Button */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Challenges
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {ladderPosition ? (
                  <>
                    Your position: #{ladderPosition.position} • Wildcards remaining: {wildcardsRemaining}/{activeSeason.wildcards_per_player}
                  </>
                ) : (
                  'You must be on the ladder to create challenges'
                )}
              </p>
            </div>
            {ladderPosition && (
              <CreateChallengeButton
                seasonId={activeSeason.id}
                userPosition={ladderPosition.position}
                wildcardsRemaining={wildcardsRemaining}
              />
            )}
          </div>

          {/* Challenges List */}
          {!ladderPosition ? (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <p className="text-gray-600 dark:text-gray-400">
                You must be added to the ladder by an admin before you can create or receive challenges.
              </p>
            </div>
          ) : (
            <ChallengesList
              challenges={challenges || []}
              currentUserId={user.id}
            />
          )}
        </div>
      </main>
    </div>
  )
}
