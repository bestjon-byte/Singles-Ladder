import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import MatchesList from '@/components/matches/MatchesList'
import { Award, Trophy, TrendingUp, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MatchesPage() {
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
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, name')
    .eq('is_active', true)
    .single()

  if (!activeSeason) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation isAdmin={!!admin} userName={profile?.name} />
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="card p-12 text-center">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
              No Active Season
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Matches will be available once a season starts.
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

  // Calculate stats
  const totalMatches = matches?.length || 0
  const wins = matches?.filter(m => m.winner_id === user.id).length || 0
  const losses = totalMatches - wins
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation isAdmin={!!admin} userName={profile?.name} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-2">
            Match History
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            View your match results and track your performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Total Matches
            </h3>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
              {totalMatches}
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="badge-success text-lg font-bold">
                {wins}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Wins
            </h3>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
              {wins} matches
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="badge-danger text-lg font-bold">
                {losses}
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Losses
            </h3>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
              {losses} matches
            </p>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-purple-soft flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="badge-primary text-lg font-bold">
                {winRate}%
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Win Rate
            </h3>
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
              {winRate}%
            </p>
          </div>
        </div>

        {/* Matches List */}
        <MatchesList
          matches={matches || []}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
