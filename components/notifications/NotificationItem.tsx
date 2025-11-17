'use client'

import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCircle, X, Calendar, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { markNotificationAsRead, deleteNotification } from '@/lib/actions/notifications'
import { Notification } from '@/lib/actions/notifications'

interface NotificationItemProps {
  notification: Notification
  onUpdate?: () => void
}

export function NotificationItem({ notification, onUpdate }: NotificationItemProps) {
  const router = useRouter()

  const handleClick = async () => {
    // Mark as read if unread
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id)
    }

    // Navigate to relevant page
    if (notification.related_challenge_id) {
      router.push('/challenges')
    } else if (notification.related_match_id) {
      router.push('/matches')
    }

    if (onUpdate) {
      onUpdate()
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteNotification(notification.id)
    if (onUpdate) {
      onUpdate()
    }
  }

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'challenge_received':
        return <Bell className="h-5 w-5 text-blue-600" />
      case 'challenge_accepted':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'score_submitted':
        return <Trophy className="h-5 w-5 text-yellow-600" />
      case 'match_reminder':
        return <Calendar className="h-5 w-5 text-purple-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`
        group relative p-4 border-b border-gray-200 cursor-pointer transition-colors
        ${notification.is_read ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium text-sm ${notification.is_read ? 'text-gray-900' : 'text-gray-900 font-semibold'}`}>
              {notification.title}
            </p>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
              aria-label="Delete notification"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>

          <p className="text-xs text-gray-500 mt-2">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Unread indicator */}
        {!notification.is_read && (
          <div className="flex-shrink-0">
            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
          </div>
        )}
      </div>
    </div>
  )
}
