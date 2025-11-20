'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptChallenge, withdrawChallenge, rejectChallenge } from '@/lib/actions/challenges'
import { WhatsAppShareDialog } from './WhatsAppShareDialog'

interface Challenge {
  id: string
  status: string
  is_wildcard: boolean
  proposed_date: string
  proposed_location: string
  accepted_date: string | null
  accepted_location: string | null
  created_at: string
  challenger: {
    id: string
    name: string
    email: string
  }
  challenged: {
    id: string
    name: string
    email: string
  }
}

interface ChallengeCardProps {
  challenge: Challenge
  currentUserId: string
}

export default function ChallengeCard({ challenge, currentUserId }: ChallengeCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isChallenger = challenge.challenger.id === currentUserId
  const isChallenged = challenge.challenged.id === currentUserId
  const isInvolved = isChallenger || isChallenged
  const opponent = isChallenger ? challenge.challenged : challenge.challenger

  const handleAccept = async () => {
    setLoading(true)
    setError(null)

    const result = await acceptChallenge(challenge.id)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }

    setLoading(false)
  }

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject this challenge?')) {
      return
    }

    setLoading(true)
    setError(null)

    const result = await rejectChallenge(challenge.id)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }

    setLoading(false)
  }

  const handleWithdraw = async () => {
    if (!confirm('Are you sure you want to withdraw this challenge?')) {
      return
    }

    setLoading(true)
    setError(null)

    const result = await withdrawChallenge(challenge.id)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }

    setLoading(false)
  }

  const getStatusBadge = () => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      accepted: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      withdrawn: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      forfeited: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[challenge.status as keyof typeof statusClasses] || statusClasses.pending}`}>
        {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              {isInvolved
                ? (isChallenger ? `Challenge to ${opponent.name}` : `Challenge from ${opponent.name}`)
                : `${challenge.challenger.name} challenges ${challenge.challenged.name}`
              }
            </h4>
            {challenge.is_wildcard && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 rounded-full">
                Wildcard
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Created {formatDate(challenge.created_at)}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Challenge Details - Only show to involved users */}
      {isInvolved && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Proposed Date & Time</p>
            <p className="text-sm text-gray-900 dark:text-white">
              {formatDate(challenge.proposed_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Proposed Location</p>
            <p className="text-sm text-gray-900 dark:text-white">{challenge.proposed_location}</p>
          </div>

          {challenge.status === 'accepted' && challenge.accepted_date && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
              <p className="text-sm font-medium text-green-800 dark:text-green-400 mb-1">
                Challenge Accepted!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Date: {formatDate(challenge.accepted_date)}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Location: {challenge.accepted_location}
              </p>
            </div>
          )}

          {/* WhatsApp Share Button (for both pending and accepted challenges) */}
          {(challenge.status === 'pending' || challenge.status === 'accepted') && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <WhatsAppShareDialog
                challengerName={challenge.challenger.name}
                challengedName={challenge.challenged.name}
                proposedDate={challenge.proposed_date}
                proposedLocation={challenge.proposed_location}
                isWildcard={challenge.is_wildcard}
              />
            </div>
          )}
        </div>
      )}

      {/* Error Message - Only for involved users */}
      {isInvolved && error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Actions - Only for involved users */}
      {isInvolved && challenge.status === 'pending' && (
        <div className="mt-6 space-y-3">
          {isChallenged && (
            <div className="flex space-x-3">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Accept'}
              </button>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Reject'}
              </button>
            </div>
          )}

          {isChallenger && (
            <button
              onClick={handleWithdraw}
              disabled={loading}
              className="w-full px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              {loading ? 'Processing...' : 'Withdraw Challenge'}
            </button>
          )}
        </div>
      )}

      {isInvolved && challenge.status === 'accepted' && isChallenger && (
        <div className="mt-6">
          <button
            onClick={handleWithdraw}
            disabled={loading}
            className="w-full px-4 py-2 border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            {loading ? 'Processing...' : 'Withdraw Challenge'}
          </button>
        </div>
      )}
    </div>
  )
}
