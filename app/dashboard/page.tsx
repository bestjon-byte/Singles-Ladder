import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import InteractiveLadder from '@/components/ladder/InteractiveLadder'
import { Trophy, Target, TrendingUp, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

  // Get all ladder players for the interactive ladder
  const { data: rawLadderPlayers } = season ? await supabase
    .from('ladder_positions')
    .select(`
      id,
      position,
      user_id,
      user:users!ladder_positions_user_id_fkey(id, name, email)
    `)
    .eq('season_id', season.id)
    .eq('is_active', true)
    .order('position', { ascending: true })
    : { data: [] }

  // Transform the data to match the expected type
  const ladderPlayers = rawLadderPlayers?.map((player: any) => ({
    id: player.id,
    position: player.position,
    user_id: player.user_id,
    user: Array.isArray(player.user) ? player.user[0] : player.user
  })) || []

  // Get user's match stats (only count completed matches with a winner)
  const { count: wins } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('winner_id', user.id)
    .not('winner_id', 'is', null)

  const { count: totalMatches } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .not('winner_id', 'is', null)

  // Get pending challenges with full details
  const { data: pendingChallengesData } = await supabase
    .from('challenges')
    .select(`
      *,
      challenger:users!challenges_challenger_id_fkey(id, name),
      challenged:users!challenges_challenged_id_fkey(id, name)
    `)
    .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
    .eq('status', 'pending')

  const pendingChallenges = pendingChallengesData?.length || 0
  const challengesToAccept = pendingChallengesData?.filter(c => c.challenged_id === user.id) || []

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

        {/* Pending Challenges Alert */}
        {challengesToAccept.length > 0 && (
          <Link href="/challenges" className="block mb-8">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-6 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-heading font-bold text-white mb-1">
                    {challengesToAccept.length === 1 ? 'Challenge Waiting!' : `${challengesToAccept.length} Challenges Waiting!`}
                  </h3>
                  <p className="text-white/90 text-lg">
                    {challengesToAccept.length === 1
                      ? `${(challengesToAccept[0].challenger as any)?.name} has challenged you`
                      : `You have ${challengesToAccept.length} challenges waiting to be accepted`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="px-6 py-3 bg-white text-orange-600 rounded-lg font-semibold hover:bg-white/90 transition-colors">
                    View Now
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

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

          {/* Win Rate & Match History */}
          <Link href="/matches" className="card p-6 group hover:border-primary-200 dark:hover:border-primary-800 cursor-pointer transition-all hover:shadow-lg">
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
            <p className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-2">
              {wins || 0} / {totalMatches || 0} wins
            </p>
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium group-hover:underline">
              View Match History →
            </p>
          </Link>

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

        {/* Interactive Ladder */}
        <InteractiveLadder
          players={ladderPlayers || []}
          currentUserId={user.id}
          currentUserPosition={ladderEntry?.position || null}
          seasonId={season?.id || ''}
          availableWildcards={availableWildcards}
        />
      </div>
    </div>
  )
}
