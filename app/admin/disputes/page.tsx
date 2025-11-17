import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import DisputedMatchCard from '@/components/admin/DisputedMatchCard'
import { AlertTriangle, Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DisputesPage() {
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

  if (!admin) {
    redirect('/dashboard')
  }

  // Get all disputed matches
  const { data: disputes } = await supabase
    .from('matches')
    .select(`
      *,
      player1:users!matches_player1_id_fkey(id, name, email),
      player2:users!matches_player2_id_fkey(id, name, email),
      winner:users!matches_winner_id_fkey(id, name),
      disputed_by:users!matches_disputed_by_user_id_fkey(id, name),
      challenge:challenges(id, is_wildcard, challenger_id, challenged_id),
      season:seasons(id, name)
    `)
    .eq('is_disputed', true)
    .order('updated_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation isAdmin={true} userName={profile?.name} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white">
                Disputed Matches
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Review and resolve match score disputes
              </p>
            </div>
          </div>
        </div>

        {/* Admin Notice */}
        <div className="mb-8 card p-6 border-l-4 border-amber-500">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Admin Responsibilities
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Review each dispute carefully. You can confirm the original score or reverse it with a corrected score.
                If you reverse a challenge match result, ladder positions will be automatically updated.
              </p>
            </div>
          </div>
        </div>

        {/* Disputes List */}
        {!disputes || disputes.length === 0 ? (
          <div className="card p-12 text-center">
            <AlertTriangle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-3">
              No Disputed Matches
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              All match results have been accepted. Disputed matches will appear here for admin review.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{disputes.length}</span> disputed {disputes.length === 1 ? 'match' : 'matches'} pending resolution
              </p>
            </div>

            {disputes.map((dispute) => (
              <DisputedMatchCard key={dispute.id} match={dispute} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
