'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitMatchScore } from '@/lib/actions/matches'

interface Match {
  id: string
  match_type: string
  match_date: string
  location: string
  set1_player1_score: number | null
  set1_player2_score: number | null
  set2_player1_score: number | null
  set2_player2_score: number | null
  set3_player1_score: number | null
  set3_player2_score: number | null
  final_set_type: string | null
  winner_id: string | null
  completed_at: string | null
  player1: {
    id: string
    name: string
    email: string
  }
  player2: {
    id: string
    name: string
    email: string
  }
  winner: {
    id: string
    name: string
  } | null
  challenge: {
    id: string
    is_wildcard: boolean
  } | null
}

interface MatchCardProps {
  match: Match
  currentUserId: string
}

export default function MatchCard({ match, currentUserId }: MatchCardProps) {
  const router = useRouter()
  const [showScoreForm, setShowScoreForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [set1P1, setSet1P1] = useState('')
  const [set1P2, setSet1P2] = useState('')
  const [set2P1, setSet2P1] = useState('')
  const [set2P2, setSet2P2] = useState('')
  const [set3P1, setSet3P1] = useState('')
  const [set3P2, setSet3P2] = useState('')
  const [finalSetType, setFinalSetType] = useState<'tiebreak' | 'full_set' | ''>('')
  const [needsSet3, setNeedsSet3] = useState(false)

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await submitMatchScore({
      matchId: match.id,
      set1Player1: parseInt(set1P1),
      set1Player2: parseInt(set1P2),
      set2Player1: parseInt(set2P1),
      set2Player2: parseInt(set2P2),
      set3Player1: needsSet3 && set3P1 ? parseInt(set3P1) : undefined,
      set3Player2: needsSet3 && set3P2 ? parseInt(set3P2) : undefined,
      finalSetType: needsSet3 && finalSetType ? finalSetType : null,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setShowScoreForm(false)
      router.refresh()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  const isPlayer1 = match.player1.id === currentUserId

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white">
              {match.player1.name} vs {match.player2.name}
            </h4>
            {match.challenge?.is_wildcard && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 rounded-full">
                Wildcard
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(match.match_date)} • {match.location}
          </p>
        </div>
        {match.winner_id ? (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
            Completed
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full">
            Pending
          </span>
        )}
      </div>

      {/* Score Display or Entry */}
      {match.winner_id ? (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${match.winner_id === match.player1.id ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {match.player1.name}
              </span>
              <div className="flex space-x-4 text-sm">
                <span className="font-medium">{match.set1_player1_score}</span>
                <span className="font-medium">{match.set2_player1_score}</span>
                {match.set3_player1_score !== null && (
                  <span className="font-medium">
                    {match.set3_player1_score}
                    {match.final_set_type === 'tiebreak' && '*'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${match.winner_id === match.player2.id ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {match.player2.name}
              </span>
              <div className="flex space-x-4 text-sm">
                <span className="font-medium">{match.set1_player2_score}</span>
                <span className="font-medium">{match.set2_player2_score}</span>
                {match.set3_player2_score !== null && (
                  <span className="font-medium">
                    {match.set3_player2_score}
                    {match.final_set_type === 'tiebreak' && '*'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            Winner: {match.winner?.name}
          </p>
          {match.final_set_type === 'tiebreak' && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              * Final set was a championship tiebreak
            </p>
          )}
        </div>
      ) : (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          {!showScoreForm ? (
            <button
              onClick={() => setShowScoreForm(true)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Enter Match Score
            </button>
          ) : (
            <form onSubmit={handleSubmitScore} className="space-y-4">
              {/* Set 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Set 1
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {match.player1.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set1P1}
                      onChange={(e) => setSet1P1(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {match.player2.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set1P2}
                      onChange={(e) => setSet1P2(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Set 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Set 2
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {match.player1.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set2P1}
                      onChange={(e) => setSet2P1(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {match.player2.name}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set2P2}
                      onChange={(e) => setSet2P2(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Third Set Toggle */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={needsSet3}
                    onChange={(e) => setNeedsSet3(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Match went to a third set
                  </span>
                </label>
              </div>

              {/* Set 3 */}
              {needsSet3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Final Set Type
                    </label>
                    <select
                      value={finalSetType}
                      onChange={(e) => setFinalSetType(e.target.value as 'tiebreak' | 'full_set')}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                    >
                      <option value="">Select type...</option>
                      <option value="tiebreak">Championship Tiebreak (first to 10)</option>
                      <option value="full_set">Full Set</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Set 3 {finalSetType === 'tiebreak' && '(Tiebreak)'}
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {match.player1.name}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={finalSetType === 'tiebreak' ? '15' : '7'}
                          value={set3P1}
                          onChange={(e) => setSet3P1(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {match.player2.name}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={finalSetType === 'tiebreak' ? '15' : '7'}
                          value={set3P2}
                          onChange={(e) => setSet3P2(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Score'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowScoreForm(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
