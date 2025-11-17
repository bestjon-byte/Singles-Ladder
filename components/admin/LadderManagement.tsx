'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { addPlayerToLadder, removePlayerFromLadder, movePlayerPosition } from '@/lib/actions/ladder-admin'

interface User {
  id: string
  name: string
  email: string
}

interface LadderPosition {
  id: string
  position: number
  user_id: string
  user: User
}

interface LadderManagementProps {
  seasonId: string
  initialPositions: LadderPosition[]
  availableUsers: User[]
}

export default function LadderManagement({
  seasonId,
  initialPositions,
  availableUsers,
}: LadderManagementProps) {
  const router = useRouter()
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newPosition, setNewPosition] = useState((initialPositions.length + 1).toString())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!selectedUserId || !newPosition) {
      setError('Please select a user and position')
      return
    }

    const position = parseInt(newPosition)
    if (position < 1) {
      setError('Position must be at least 1')
      return
    }

    setLoading(true)

    try {
      const result = await addPlayerToLadder(seasonId, selectedUserId, position)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`Player added to position ${position}`)
        setSelectedUserId('')
        // Reset to bottom position (will be recalculated on refresh)
        router.refresh()
        // Delay to ensure state updates after refresh
        setTimeout(() => {
          setNewPosition((initialPositions.length + 2).toString())
        }, 100)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add player')
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePlayer = async (userId: string, userName: string) => {
    if (!confirm(`Remove ${userName} from the ladder?`)) {
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const result = await removePlayerFromLadder(seasonId, userId)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`${userName} removed from ladder`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove player')
    } finally {
      setLoading(false)
    }
  }

  const handleMoveUp = async (userId: string, userName: string, currentPosition: number) => {
    if (currentPosition === 1) return // Already at top

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await movePlayerPosition(seasonId, userId, currentPosition - 1)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`${userName} moved up to position ${currentPosition - 1}`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to move player')
    } finally {
      setLoading(false)
    }
  }

  const handleMoveDown = async (userId: string, userName: string, currentPosition: number) => {
    if (currentPosition === initialPositions.length) return // Already at bottom

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await movePlayerPosition(seasonId, userId, currentPosition + 1)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`${userName} moved down to position ${currentPosition + 1}`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to move player')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Add Player Form */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Add Player to Ladder
        </h2>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
          </div>
        )}

        {availableUsers.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            All registered users are already in the ladder.
          </p>
        ) : (
          <form onSubmit={handleAddPlayer} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="user" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Player
                </label>
                <select
                  id="user"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-900 dark:text-white"
                  required
                >
                  <option value="">Choose a player...</option>
                  {availableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Position
                </label>
                <select
                  id="position"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-900 dark:text-white"
                  required
                >
                  {Array.from({ length: initialPositions.length + 1 }, (_, i) => i + 1).map((pos) => (
                    <option key={pos} value={pos}>
                      Position {pos}{pos === initialPositions.length + 1 ? ' (Bottom - Default)' : ''}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {newPosition === (initialPositions.length + 1).toString()
                    ? 'Player will be added to the bottom of the ladder'
                    : 'Players at this position and below will shift down'}
                </p>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add to Ladder'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Current Ladder */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Current Ladder ({initialPositions.length} players)
          </h2>
        </div>

        {initialPositions.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No players in the ladder yet. Add some players to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Player
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {initialPositions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{pos.position}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {pos.user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleMoveUp(pos.user_id, pos.user.name, pos.position)}
                          disabled={loading || pos.position === 1}
                          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                          aria-label={`Move ${pos.user.name} up`}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(pos.user_id, pos.user.name, pos.position)}
                          disabled={loading || pos.position === initialPositions.length}
                          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                          aria-label={`Move ${pos.user.name} down`}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemovePlayer(pos.user_id, pos.user.name)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 text-sm"
                          aria-label={`Remove ${pos.user.name} from ladder`}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
