import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import UserGuideContent from '@/components/UserGuideContent'

export const metadata = {
  title: 'User Guide - Tennis Singles Ladder',
  description: 'Learn how to use the Tennis Singles Ladder',
}

export default async function GuidePage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  // Check if user is admin
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation isAdmin={!!admin} userName={profile?.name} />

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <UserGuideContent />
      </main>
    </div>
  )
}
