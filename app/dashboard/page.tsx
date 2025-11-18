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

  // Get all active challenges for the season (to show who is locked)
  const { data: allActiveChallenges } = season ? await supabase
    .from('challenges')
    .select('id, challenger_id, challenged_id, status')
    .eq('season_id', season.id)
    .in('status', ['pending', 'accepted'])
    : { data: [] }

  const winRate = totalMatches ? Math.round(((wins || 0) / totalMatches) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation isAdmin={!!admin} userName={profile?.name} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Ladder Header with Wildcards Badge */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-1">
              Ladder
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {season ? season.name : 'No active season'}
            </p>
          </div>
          {ladderEntry && (
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Wildcards</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{availableWildcards}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pending Challenges Alert */}
        {challengesToAccept.length > 0 && (
          <Link href="/matches" className="block mb-6">
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

        {/* Interactive Ladder */}
        <InteractiveLadder
          players={ladderPlayers || []}
          currentUserId={user.id}
          currentUserPosition={ladderEntry?.position || null}
          seasonId={season?.id || ''}
          availableWildcards={availableWildcards}
          activeChallenges={allActiveChallenges || []}
        />
      </div>
    </div>
  )
}
