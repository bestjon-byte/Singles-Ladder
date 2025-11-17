import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/utils/admin'
import { createClient } from '@/lib/supabase/server'
import Navigation from '@/components/Navigation'
import AdminNav from '@/components/admin/AdminNav'
import { Trophy } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { error } = await requireAdmin()

  if (error) {
    redirect('/dashboard')
  }

  const supabase = await createClient()

  // Get dispute count for badge
  const { count: disputeCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('is_disputed', true)

  // Get active season for context banner
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .single()

  // Calculate days until season ends
  let daysUntilEnd: number | null = null
  if (activeSeason) {
    daysUntilEnd = Math.ceil(
      (new Date(activeSeason.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation isAdmin={true} />
      <AdminNav disputeCount={disputeCount || 0} />

      {/* Active Season Context Banner */}
      {activeSeason && (
        <div className="bg-gradient-purple-soft border-b border-primary-200 dark:border-primary-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="font-medium text-primary-900 dark:text-primary-100">
                Active Season: {activeSeason.name}
              </span>
              <span className="text-primary-700 dark:text-primary-300 hidden sm:inline">
                ({new Date(activeSeason.start_date).toLocaleDateString()} - {new Date(activeSeason.end_date).toLocaleDateString()})
              </span>
            </div>
            {daysUntilEnd !== null && daysUntilEnd <= 7 && daysUntilEnd > 0 && (
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                Ends in {daysUntilEnd} {daysUntilEnd === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
        </div>
      )}

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-20 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <main id="main-content" className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
