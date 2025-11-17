import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { getNotificationsForUser, getUnreadCount } from '@/lib/actions/notifications'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Fetch notifications and unread count
  const { notifications } = await getNotificationsForUser()
  const { count } = await getUnreadCount()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <NotificationCenter
        initialNotifications={notifications}
        unreadCount={count}
      />
    </div>
  )
}
