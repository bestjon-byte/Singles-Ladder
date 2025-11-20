'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createChallenge } from '@/lib/actions/challenges'
import { createClient } from '@/lib/supabase/client'
import AvailabilityGrid from '@/components/shared/AvailabilityGrid'
import { AvailabilityData } from '@/types/availability'

interface Player {
  id: string
  position: number
  user_id: string
  user: {
    id: string
    name: string
    email: string
    availability?: AvailabilityData | null
  }
}

interface CreateChallengeModalProps {
  seasonId: string
  userPosition: number
  wildcardsRemaining: number
  onClose: () => void
  preselectedPlayerId?: string
  preselectedIsWildcard?: boolean
}

export default function CreateChallengeModal({
  seasonId,
  userPosition,
  wildcardsRemaining,
  onClose,
  preselectedPlayerId,
  preselectedIsWildcard = false,
}: CreateChallengeModalProps) {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState(preselectedPlayerId || '')
  const [isWildcard, setIsWildcard] = useState(preselectedIsWildcard)
  const [proposedDate, setProposedDate] = useState('')
  const [proposedLocation, setProposedLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetchingPlayers, setFetchingPlayers] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayers = useCallback(async () => {
    setFetchingPlayers(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('ladder_positions')
      .select(`
        id,
        position,
        user_id,
        user:users!ladder_positions_user_id_fkey(id, name, email, availability)
      `)
      .eq('season_id', seasonId)
      .eq('is_active', true)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching players:', error)
      setError('Failed to fetch players')
    } else {
      setPlayers((data as unknown as Player[]) || [])
    }

    setFetchingPlayers(false)
  }, [seasonId])

  useEffect(() => {
    fetchPlayers()
  }, [fetchPlayers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createChallenge({
      challengedId: selectedPlayerId,
      proposedDate,
      proposedLocation,
      isWildcard,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
      onClose()
    }
  }

  const getEligiblePlayers = () => {
    if (isWildcard) {
      // Wildcard: can challenge anyone except yourself
      return players.filter(p => p.position !== userPosition)
    } else {
      // Normal: can challenge players 1-2 positions above
      return players.filter(p => {
        const diff = userPosition - p.position
        return diff > 0 && diff <= 2
      })
    }
  }

  const eligiblePlayers = getEligiblePlayers()
  const canUseWildcard = wildcardsRemaining > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create Challenge
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {fetchingPlayers ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Loading players...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Challenge Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Challenge Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!isWildcard}
                      onChange={() => setIsWildcard(false)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-900 dark:text-white">
                      Normal Challenge (players 1-2 positions above)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={isWildcard}
                      onChange={() => setIsWildcard(true)}
                      disabled={!canUseWildcard}
                      className="mr-2"
                    />
                    <span className={`text-sm ${canUseWildcard ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                      Wildcard Challenge (any player) - {wildcardsRemaining} remaining
                    </span>
                  </label>
                </div>
              </div>

              {/* Player Selection */}
              <div>
                <label htmlFor="player" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Player to Challenge
                </label>
                {eligiblePlayers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                    {isWildcard
                      ? 'No eligible players available'
                      : 'No players available to challenge within 2 positions above you'}
                  </p>
                ) : (
                  <select
                    id="player"
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Choose a player...</option>
                    {eligiblePlayers.map((player) => (
                      <option key={player.user_id} value={player.user_id}>
                        #{player.position} - {player.user.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Player Availability Display */}
              {selectedPlayerId && (() => {
                const selectedPlayer = players.find(p => p.user_id === selectedPlayerId)
                const availability = selectedPlayer?.user?.availability

                return (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"/>
                      </svg>
                      {selectedPlayer?.user?.name}&apos;s Availability
                    </h3>
                    {availability ? (
                      <>
                        <AvailabilityGrid availability={availability} />
                        <p className="mt-3 text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-2">
                          💡 <strong>Tip:</strong> Consider proposing a time when they&apos;re typically available.
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        This player hasn&apos;t set their availability yet. You can still propose any time.
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Proposed Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Proposed Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Proposed Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Proposed Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={proposedLocation}
                  onChange={(e) => setProposedLocation(e.target.value)}
                  placeholder="e.g., Club courts, Court 1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || eligiblePlayers.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Challenge'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
