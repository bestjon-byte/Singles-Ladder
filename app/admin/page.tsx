import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Calendar, TrendingUp, Trophy, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()

  // Get stats
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: seasonCount } = await supabase
    .from('seasons')
    .select('*', { count: 'exact', head: true })

  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .single()

  const { count: ladderCount } = activeSeason
    ? await supabase
        .from('ladder_positions')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', activeSeason.id)
        .eq('is_active', true)
    : { count: 0 }

  const { count: matchCount } = activeSeason
    ? await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', activeSeason.id)
    : { count: 0 }

  const { count: challengeCount } = activeSeason
    ? await supabase
        .from('challenges')
        .select('*', { count: 'exact', head: true })
        .eq('season_id', activeSeason.id)
    : { count: 0 }

  return (
    <div className="px-4 sm:px-0">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-2">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Manage users, seasons, and ladder positions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Users
          </h3>
          <p className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
            {userCount || 0}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Seasons
          </h3>
          <p className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
            {seasonCount || 0}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-purple-soft flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Players in Ladder
          </h3>
          <p className="text-3xl font-heading font-bold text-gray-900 dark:text-white">
            {ladderCount || 0}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Active Season
          </h3>
          <p className="text-lg font-heading font-bold text-gray-900 dark:text-white truncate">
            {activeSeason?.name || 'None'}
          </p>
        </div>
      </div>

      {/* Activity Stats */}
      {activeSeason && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Matches
                </p>
                <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white mt-1">
                  {matchCount || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Challenges
                </p>
                <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white mt-1">
                  {challengeCount || 0}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-8">
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/admin/users"
            className="card-interactive p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Manage Users
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View all users
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>

          <Link
            href="/admin/ladder"
            className="card-interactive p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-purple flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Manage Ladder
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Adjust positions
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>

          <Link
            href="/admin/seasons"
            className="card-interactive p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Manage Seasons
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Create & activate
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
