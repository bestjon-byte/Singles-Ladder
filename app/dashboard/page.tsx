import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { Trophy, Target, Award, TrendingUp, Medal, Zap } from 'lucide-react'

export default async function DashboardPage() {
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

  // Check if user is admin
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Get active season
  const { data: season } = await supabase
    .from('seasons')
    .select('id, name, wildcards_per_player')
    .eq('is_active', true)
    .maybeSingle()

  // Get user's ladder position (only if there's an active season)
  const { data: ladderEntry } = season ? await supabase
    .from('ladder_positions')
    .select('position, season_id')
    .eq('user_id', user.id)
    .eq('season_id', season.id)
    .eq('is_active', true)
    .maybeSingle()
    : { data: null }

  // Get total ladder players (only if there's an active season)
  const { count: totalPlayers } = season ? await supabase
    .from('ladder_positions')
    .select('*', { count: 'exact', head: true })
    .eq('season_id', season.id)
    .eq('is_active', true)
    : { count: 0 }

  // Calculate available wildcards
  const { data: wildcardsUsed } = season && ladderEntry ? await supabase
    .from('wildcard_usage')
    .select('id')
    .eq('season_id', season.id)
    .eq('user_id', user.id)
    : { data: [] }

  const availableWildcards = season && ladderEntry
    ? (season.wildcards_per_player - (wildcardsUsed?.length || 0))
    : 0

  // Get user's match stats
  const { count: wins } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('winner_id', user.id)

  const { count: totalMatches } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)

  // Get pending challenges
  const { count: pendingChallenges } = await supabase
    .from('challenges')
    .select('*', { count: 'exact', head: true })
    .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
    .eq('status', 'pending')

  const winRate = totalMatches ? Math.round(((wins || 0) / totalMatches) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation isAdmin={!!admin} userName={profile?.name} />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {profile?.name?.split(' ')[0] || 'Player'}!
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {season ? `${season.name} season is live` : 'No active season'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Ladder Position */}
          <div className="card p-6 group hover:border-primary-200 dark:hover:border-primary-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-purple-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              {ladderEntry && (
                <div className="badge-primary text-lg font-bold">
                  #{ladderEntry.position}
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Ladder Position
            </h3>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
              {ladderEntry ? `#${ladderEntry.position} of ${totalPlayers}` : 'Not on ladder'}
            </p>
          </div>

          {/* Win Rate */}
          <div className="card p-6 group hover:border-primary-200 dark:hover:border-primary-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="badge-success text-lg font-bold">
                {winRate}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Win Rate
            </h3>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
              {wins || 0} / {totalMatches || 0} wins
            </p>
          </div>

          {/* Pending Challenges */}
          <div className="card p-6 group hover:border-primary-200 dark:hover:border-primary-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              {(pendingChallenges || 0) > 0 && (
                <div className="badge-warning text-lg font-bold">
                  {pendingChallenges}
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Pending Challenges
            </h3>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
              {pendingChallenges || 0}
            </p>
          </div>

          {/* Wildcards */}
          <div className="card p-6 group hover:border-primary-200 dark:hover:border-primary-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              {ladderEntry && availableWildcards > 0 && (
                <div className="badge bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-lg font-bold">
                  {availableWildcards}
                </div>
              )}
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Wildcards Left
            </h3>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
              {availableWildcards}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link href="/challenges" className="card-interactive p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-gradient-purple flex items-center justify-center">
                <Target className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-1">
                  View Challenges
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your active challenges
                </p>
              </div>
            </div>
          </Link>

          <Link href="/matches" className="card-interactive p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-green-600 flex items-center justify-center">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-1">
                  Match History
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View your match results
                </p>
              </div>
            </div>
          </Link>

          <Link href="/profile" className="card-interactive p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-blue-600 flex items-center justify-center">
                <Medal className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-1">
                  Your Profile
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Update your information
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Status Section */}
        <div className="card p-8">
          {ladderEntry ? (
            <>
              <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                You&apos;re on the Ladder!
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Current position: #{ladderEntry.position}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {ladderEntry.position === 1
                        ? "You're at the top! Defend your position!"
                        : `Challenge players above you to climb the ladder`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Wildcards: {availableWildcards}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use wildcards to challenge players further up the ladder
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                Get Started
              </h2>
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <Trophy className="w-8 h-8 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-primary-900 dark:text-primary-100 mb-2">
                      Join the Ladder
                    </h3>
                    <p className="text-primary-800 dark:text-primary-200 mb-4">
                      You&apos;re not currently on the ladder. Contact an admin to be added and start competing!
                    </p>
                    <ul className="space-y-2 text-sm text-primary-700 dark:text-primary-300">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                        Wait for an admin to add you to the ladder
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                        Once added, you can challenge other players
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                        Win matches to climb the rankings
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
