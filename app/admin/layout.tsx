import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/utils/admin'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Users, Calendar, TrendingUp, LayoutDashboard, AlertTriangle } from 'lucide-react'
import Navigation from '@/components/Navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { error } = await requireAdmin()

  if (error) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation isAdmin={true} />

      {/* Admin Sub-navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Users className="w-4 h-4" />
              Users
            </Link>
            <Link
              href="/admin/seasons"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              Seasons
            </Link>
            <Link
              href="/admin/ladder"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              Ladder
            </Link>
            <Link
              href="/admin/disputes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              Disputes
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
