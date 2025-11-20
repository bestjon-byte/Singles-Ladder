'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { startPlayoffs } from '@/lib/actions/playoffs'
import { createClient } from '@/lib/supabase/client'
import type { PlayoffFormat, User } from '@/types'
import { Trophy, Medal, Award } from 'lucide-react'

interface StartPlayoffsModalProps {
  seasonId: string
  seasonName: string
  onClose: () => void
}

export default function StartPlayoffsModal({
  seasonId,
  seasonName,
  onClose,
}: StartPlayoffsModalProps) {
  const router = useRouter()
  const [format, setFormat] = useState<PlayoffFormat>('semis')
  const [topPlayers, setTopPlayers] = useState<Array<User & { position: number }>>([])
  const [loading, setLoading] = useState(false)
  const [fetchingPlayers, setFetchingPlayers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState('')

  useEffect(() => {
    fetchTopPlayers()
  }, [seasonId])

  const fetchTopPlayers = async () => {
    setFetchingPlayers(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from('ladder_positions')
      .select('position, user:users(*)')
      .eq('season_id', seasonId)
      .eq('is_active', true)
      .order('position', { ascending: true })
      .limit(8)

    if (error) {
      console.error('Error fetching players:', error)
      setError('Failed to fetch ladder players')
    } else if (data) {
      setTopPlayers(data.map((d: any) => ({
        ...d.user,
        position: d.position
      })))
    }

    setFetchingPlayers(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (confirmation !== 'START PLAYOFFS') {
      setError('Please type "START PLAYOFFS" to confirm')
      return
    }

    setLoading(true)
    setError(null)

    const result = await startPlayoffs(seasonId, format)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
      onClose()
    }
  }

  const getPlayerCount = (fmt: PlayoffFormat) => {
    return fmt === 'final' ? 2 : fmt === 'semis' ? 4 : 8
  }

  const getPlayersForFormat = () => {
    const count = getPlayerCount(format)
    return topPlayers.slice(0, count)
  }

  const getMatchupsPreview = () => {
    const players = getPlayersForFormat()

    if (format === 'final') {
      return [
        { match: 'Final', player1: players[0], player2: players[1] }
      ]
    } else if (format === 'semis') {
      return [
        { match: 'Semi Final 1', player1: players[0], player2: players[3] },
        { match: 'Semi Final 2', player1: players[1], player2: players[2] }
      ]
    } else {
      return [
        { match: 'Quarter Final 1', player1: players[0], player2: players[7] },
        { match: 'Quarter Final 2', player1: players[3], player2: players[4] },
        { match: 'Quarter Final 3', player1: players[1], player2: players[6] },
        { match: 'Quarter Final 4', player1: players[2], player2: players[5] }
      ]
    }
  }

  const playerCount = getPlayerCount(format)
  const hasEnoughPlayers = topPlayers.length >= playerCount

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full my-8">
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="text-center flex-1">
              <div className="flex justify-center mb-4">
                <Trophy className="w-16 h-16 text-yellow-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Start Knockout Playoffs
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {seasonName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {fetchingPlayers ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Loading ladder rankings...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Playoff Format
                </label>
                <div className="space-y-3">
                  {/* Final Only */}
                  <button
                    type="button"
                    onClick={() => setFormat('final')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      format === 'final'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Final Only
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Top 2 players compete for the championship
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-gray-400">2</span>
                    </div>
                  </button>

                  {/* Semis + Final */}
                  <button
                    type="button"
                    onClick={() => setFormat('semis')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      format === 'semis'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Medal className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Semi Finals + Final
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Top 4 players: Semis then Final
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-gray-400">4</span>
                    </div>
                  </button>

                  {/* Quarters + Semis + Final */}
                  <button
                    type="button"
                    onClick={() => setFormat('quarters')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      format === 'quarters'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Award className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Quarter Finals + Semi Finals + Final
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Top 8 players: Full tournament bracket
                        </p>
                      </div>
                      <span className="text-2xl font-bold text-gray-400">8</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Preview Matchups */}
              {hasEnoughPlayers && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    First Round Matchups
                  </h3>
                  <div className="space-y-2">
                    {getMatchupsPreview().map((matchup, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-gray-800 rounded p-3 text-sm"
                      >
                        <div className="font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {matchup.match}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">
                              {matchup.player1?.position}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {matchup.player1?.name || 'TBD'}
                            </span>
                          </div>
                          <span className="text-gray-400 font-bold px-2">VS</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {matchup.player2?.name || 'TBD'}
                            </span>
                            <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">
                              {matchup.player2?.position}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {!hasEnoughPlayers && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    ⚠️ Not enough players on the ladder. Need {playerCount} players but only {topPlayers.length} available.
                  </p>
                </div>
              )}

              {hasEnoughPlayers && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>This will end the active ladder.</strong> No new challenges can be made.
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Players not in the top {playerCount} will be excluded from playoffs.
                  </p>
                </div>
              )}

              {/* Confirmation */}
              {hasEnoughPlayers && (
                <div>
                  <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type <strong>"START PLAYOFFS"</strong> to confirm
                  </label>
                  <input
                    id="confirmation"
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="START PLAYOFFS"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !hasEnoughPlayers || confirmation !== 'START PLAYOFFS'}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  {loading ? 'Starting...' : '🏆 Start Playoffs'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
