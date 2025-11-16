import { createClient } from '@/lib/supabase/server'

export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', userId)
    .single()

  return !!data
}

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', isAdmin: false }
  }

  const adminStatus = await isAdmin(user.id)

  if (!adminStatus) {
    return { error: 'Not authorized', isAdmin: false }
  }

  return { isAdmin: true, user }
}
