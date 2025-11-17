import { createClient } from '@/lib/supabase/server'
import SeasonsManagement from '@/components/admin/SeasonsManagement'

export const dynamic = 'force-dynamic'

export default async function AdminSeasonsPage() {
  const supabase = await createClient()

  // Get all seasons
  const { data: seasons } = await supabase
    .from('seasons')
    .select('*')
    .order('start_date', { ascending: false })

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-8">
        Manage Seasons
      </h1>

      <SeasonsManagement initialSeasons={seasons || []} />
    </div>
  )
}
