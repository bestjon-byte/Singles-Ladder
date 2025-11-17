import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Calendar, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  const supabase = await createClient()

  // Get only actionable data
  const [
    { count: disputeCount },
    { data: activeSeason }
  ] = await Promise.all([
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_disputed', true),
    supabase.from('seasons').select('*').eq('is_active', true).single()
  ])

  // Calculate days until season ends
  const daysUntilEnd = activeSeason
    ? Math.ceil((new Date(activeSeason.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const seasonEndingSoon = daysUntilEnd !== null && daysUntilEnd <= 7 && daysUntilEnd > 0

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-8">
        Admin Panel
      </h1>

      {/* ALERTS - Show only what needs attention */}
      <div className="space-y-4 mb-8">
        {/* Disputed Matches Alert */}
        {disputeCount > 0 && (
          <Link
            href="/admin/disputes"
            className="block p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100">
                    {disputeCount} disputed {disputeCount === 1 ? 'match' : 'matches'} need attention
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Review and resolve match disputes
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            </div>
          </Link>
        )}

        {/* Season Ending Soon Alert */}
        {seasonEndingSoon && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  Season "{activeSeason.name}" ends in {daysUntilEnd} {daysUntilEnd === 1 ? 'day' : 'days'}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Consider planning the next season
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No Active Season Alert */}
        {!activeSeason && (
          <Link
            href="/admin/seasons"
            className="block p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    No active season
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Create and activate a season to start
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            </div>
          </Link>
        )}

        {/* All Good - No Alerts */}
        {disputeCount === 0 && activeSeason && !seasonEndingSoon && (
          <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="font-medium text-green-900 dark:text-green-100">
              All systems running smoothly
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              No pending actions required
            </p>
          </div>
        )}
      </div>

      {/* SIMPLE LINKS - Not big action cards */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Quick Links
        </h2>

        <Link
          href="/admin/users"
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Manage Users</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/seasons"
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Manage Seasons</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/ladder"
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-900 dark:text-white">Manage Ladder</span>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/disputes"
          className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">Review Disputes</span>
              {disputeCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-semibold text-white bg-red-600 rounded-full">
                  {disputeCount}
                </span>
              )}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </Link>
      </div>
    </div>
  )
}
