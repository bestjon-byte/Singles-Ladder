'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Trophy, Target, Award, User, Settings, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { NotificationBell } from './notifications/NotificationBell'

interface NavigationProps {
  isAdmin?: boolean
  userName?: string
}

export default function Navigation({ isAdmin = false, userName }: NavigationProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { href: '/dashboard', label: 'Ladder', icon: Trophy },
    { href: '/matches', label: 'Matches', icon: Award },
    { href: '/profile', label: 'Profile', icon: User },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: Settings }] : []),
  ]

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-primary-500 flex items-center justify-center transition-transform group-hover:scale-110">
                <Image
                  src="/images/R-T-C.png"
                  alt="RTC Logo"
                  width={40}
                  height={40}
                  className="object-cover"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-heading font-bold text-gray-900 dark:text-white">
                  Singles Ladder
                </h1>
                <p className="text-xs text-primary-600 dark:text-primary-400 -mt-1">
                  Riccall Tennis Club
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${active
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}

            {/* User Guide Link */}
            <Link
              href="/guide"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
              title="User Guide"
            >
              <BookOpen className="w-4 h-4" />
            </Link>

            {/* Notification Bell */}
            <div className="ml-2">
              <NotificationBell />
            </div>

            {/* Sign out button */}
            <form action="/auth/signout" method="post" className="ml-2">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>

          {/* Mobile menu button and notification bell */}
          <div className="md:hidden flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {userName && (
              <div className="px-4 py-3 mb-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  {userName}
                </p>
              </div>
            )}

            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200
                    ${active
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              )
            })}

            {/* User Guide Link for Mobile */}
            <Link
              href="/guide"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <BookOpen className="w-5 h-5" />
              User Guide
            </Link>

            <form action="/auth/signout" method="post" className="pt-2">
              <button
                type="submit"
                className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  )
}
