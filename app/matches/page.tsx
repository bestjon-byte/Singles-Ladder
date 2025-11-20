import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import MatchesList from '@/components/matches/MatchesList'
import MatchesHeader from '@/components/matches/MatchesHeader'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import PlayoffBracketView from '@/components/playoffs/PlayoffBracketView'
import { getActivePlayoffBracket } from '@/lib/actions/playoffs'
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
    .select('*')
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

  // Check for active playoffs
  const activePlayoffBracket = await getActivePlayoffBracket(activeSeason.id)

  // If playoffs are active, show playoff bracket view
  if (activePlayoffBracket && (activeSeason.status === 'playoffs' || activeSeason.status === 'completed')) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation isAdmin={!!admin} userName={profile?.name} />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <PlayoffBracketView bracket={activePlayoffBracket} currentUserId={user.id} />
        </main>
      </div>
    )
  }

  // Get user's ladder position
  const { data: ladderEntry } = await supabase
    .from('ladder_positions')
    .select('position, season_id')
    .eq('user_id', user.id)
    .eq('season_id', activeSeason.id)
    .eq('is_active', true)
    .maybeSingle()

  // Get all ladder players
  const { data: rawLadderPlayers } = await supabase
    .from('ladder_positions')
    .select(`
      id,
      position,
      user_id,
      user:users!ladder_positions_user_id_fkey(id, name, email)
    `)
    .eq('season_id', activeSeason.id)
    .eq('is_active', true)
    .order('position', { ascending: true })

  const ladderPlayers = rawLadderPlayers?.map((player: any) => ({
    id: player.id,
    position: player.position,
    user_id: player.user_id,
    user: Array.isArray(player.user) ? player.user[0] : player.user
  })) || []

  // Get wildcards remaining
  const { data: wildcardsUsed } = ladderEntry ? await supabase
    .from('wildcard_usage')
    .select('id')
    .eq('season_id', activeSeason.id)
    .eq('user_id', user.id)
    : { data: [] }

  const availableWildcards = ladderEntry
    ? (activeSeason.wildcards_per_player - (wildcardsUsed?.length || 0))
    : 0

  // Get pending challenges (show all challenges)
  const { data: pendingChallengesData } = await supabase
    .from('challenges')
    .select(`
      *,
      challenger:users!challenges_challenger_id_fkey(id, name),
      challenged:users!challenges_challenged_id_fkey(id, name)
    `)
    .eq('season_id', activeSeason.id)
    .in('status', ['pending', 'accepted'])

  const challengesToAccept = pendingChallengesData?.filter(c =>
    c.challenged_id === user.id && c.status === 'pending'
  ) || []

  // Get all matches (show all matches to all users)
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      player1:users!matches_player1_id_fkey(id, name, email),
      player2:users!matches_player2_id_fkey(id, name, email),
      winner:users!matches_winner_id_fkey(id, name),
      challenge:challenges(id, is_wildcard),
      is_disputed,
      disputed_by_user_id
    `)
    .eq('season_id', activeSeason.id)
    .order('match_date', { ascending: false })

  // Calculate stats (only for user's own matches that are completed)
  const userMatches = matches?.filter(m =>
    (m.player1_id === user.id || m.player2_id === user.id) && m.winner_id !== null
  ) || []
  const totalMatches = userMatches.length
  const wins = userMatches.filter(m => m.winner_id === user.id).length
  const losses = totalMatches - wins
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation isAdmin={!!admin} userName={profile?.name} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header with Challenge Player Button */}
        <MatchesHeader
          seasonId={activeSeason.id}
          currentUserId={user.id}
          currentUserPosition={ladderEntry?.position || null}
          ladderPlayers={ladderPlayers}
          availableWildcards={availableWildcards}
          pendingChallenges={challengesToAccept}
        />

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

        {/* All Challenges Section */}
        {pendingChallengesData && pendingChallengesData.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
              All Active Challenges
            </h2>
            <div className="space-y-4">
              {pendingChallengesData.map((challenge) => (
                <div key={challenge.id} className={
                  challenge.challenger_id === user.id || challenge.challenged_id === user.id
                    ? 'ring-2 ring-primary-200 dark:ring-primary-800 rounded-lg'
                    : ''
                }>
                  <ChallengeCard
                    challenge={challenge as any}
                    currentUserId={user.id}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Matches List */}
        <MatchesList
          matches={matches || []}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
