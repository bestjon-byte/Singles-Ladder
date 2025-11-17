'use client'

import { useState } from 'react'
import { Shield, ShieldOff } from 'lucide-react'
import { promoteToAdmin, demoteFromAdmin } from '@/lib/actions/admin-management'

interface AdminToggleProps {
  userId: string
  userName: string
  isAdmin: boolean
  isCurrentUser: boolean
}

export default function AdminToggle({ userId, userName, isAdmin, isCurrentUser }: AdminToggleProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async () => {
    if (isCurrentUser && isAdmin) {
      setError('You cannot demote yourself')
      return
    }

    const action = isAdmin ? 'demote' : 'promote'
    const confirmMessage = isAdmin
      ? `Remove admin privileges from ${userName}?`
      : `Grant admin privileges to ${userName}?`

    if (!confirm(confirmMessage)) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = isAdmin
        ? await demoteFromAdmin(userId)
        : await promoteToAdmin(userId)

      if (result.error) {
        setError(result.error)
      }
    } catch (err: any) {
      setError(err.message || `Failed to ${action} user`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleToggle}
        disabled={loading || (isCurrentUser && isAdmin)}
        className={`
          p-2 rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 focus:outline-none
          ${isAdmin
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isAdmin ? 'Remove admin' : 'Make admin'}
        aria-label={isAdmin ? `Remove admin privileges from ${userName}` : `Grant admin privileges to ${userName}`}
      >
        {isAdmin ? (
          <Shield className="w-5 h-5" />
        ) : (
          <ShieldOff className="w-5 h-5" />
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 max-w-[100px] text-center">
          {error}
        </p>
      )}
    </div>
  )
}
