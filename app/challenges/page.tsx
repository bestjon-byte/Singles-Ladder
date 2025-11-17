import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ChallengesList from '@/components/challenges/ChallengesList'
import CreateChallengeButton from '@/components/challenges/CreateChallengeButton'
import { Target, Trophy, Zap, AlertCircle } from 'lucide-react'

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

  // Check if user is admin
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Get active season
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id, name, wildcards_per_player')
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
              Challenges will be available once a season starts. Contact an admin for more information.
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation isAdmin={!!admin} userName={profile?.name} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-2">
            Challenges
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {ladderPosition ? 'Manage your active challenges and create new ones' : 'Join the ladder to start challenging players'}
          </p>
        </div>

        {/* Stats Cards */}
        {ladderPosition && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-purple-soft flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="badge-primary text-lg font-bold">
                  #{ladderPosition.position}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Your Position
              </h3>
              <p className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                Rank #{ladderPosition.position}
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="badge bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-lg font-bold">
                  {wildcardsRemaining}
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Wildcards Available
              </h3>
              <p className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                {wildcardsRemaining} / {activeSeason.wildcards_per_player}
              </p>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Target className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Current Season
              </h3>
              <p className="text-xl font-heading font-bold text-gray-900 dark:text-white truncate">
                {activeSeason.name}
              </p>
            </div>
          </div>
        )}

        {/* Create Challenge Button */}
        {ladderPosition && (
          <div className="mb-6">
            <CreateChallengeButton
              seasonId={activeSeason.id}
              userPosition={ladderPosition.position}
              wildcardsRemaining={wildcardsRemaining}
            />
          </div>
        )}

        {/* Challenges List */}
        {!ladderPosition ? (
          <div className="card p-12 text-center">
            <Trophy className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-3">
              Join the Ladder First
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              You must be added to the ladder by an admin before you can create or receive challenges.
            </p>
          </div>
        ) : (
          <ChallengesList
            challenges={challenges || []}
            currentUserId={user.id}
          />
        )}
      </main>
    </div>
  )
}
