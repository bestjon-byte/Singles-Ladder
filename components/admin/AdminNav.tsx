'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'

interface AdminNavProps {
  disputeCount?: number
}

export default function AdminNav({ disputeCount = 0 }: AdminNavProps) {
  const pathname = usePathname()

  const links = [
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/seasons', label: 'Seasons', icon: Calendar },
    { href: '/admin/ladder', label: 'Ladder', icon: TrendingUp },
    { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle, badge: disputeCount },
  ]

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-1 py-2 overflow-x-auto" aria-label="Admin navigation">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href

            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap
                  ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {link.label}
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold text-white bg-red-600 rounded-full">
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
