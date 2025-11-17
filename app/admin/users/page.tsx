import { createClient } from '@/lib/supabase/server'
import UsersTable from '@/components/admin/UsersTable'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Get all users with their ladder status
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  // Get active season
  const { data: activeSeason } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .single()

  // Get ladder positions for active season
  let ladderPositions: Record<string, number> = {}
  if (activeSeason) {
    const { data: positions } = await supabase
      .from('ladder_positions')
      .select('user_id, position')
      .eq('season_id', activeSeason.id)
      .eq('is_active', true)

    if (positions) {
      ladderPositions = positions.reduce((acc, pos) => {
        acc[pos.user_id] = pos.position
        return acc
      }, {} as Record<string, number>)
    }
  }

  // Check which users are admins
  const { data: adminUsers } = await supabase
    .from('admins')
    .select('user_id')

  const adminUserIds = new Set(adminUsers?.map(a => a.user_id) || [])

  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-8">
        Manage Users
      </h1>

      <UsersTable
        users={users || []}
        currentUserId={user?.id || ''}
        ladderPositions={ladderPositions}
        adminUserIds={adminUserIds}
      />
    </div>
  )
}
