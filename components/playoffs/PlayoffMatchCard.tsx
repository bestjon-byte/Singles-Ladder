'use client'

import { useState } from 'react'
import { Trophy, CheckCircle2, Edit3, Eye } from 'lucide-react'
import type { PlayoffBracketMatch } from '@/types'
import { submitMatchScore } from '@/lib/actions/matches'
import { useRouter } from 'next/navigation'

interface PlayoffMatchCardProps {
  match: PlayoffBracketMatch
  matchDbId?: string
  roundName: string
  canEnterScore: boolean
  userId?: string
}

export default function PlayoffMatchCard({
  match,
  matchDbId,
  roundName,
  canEnterScore,
  userId,
}: PlayoffMatchCardProps) {
  const router = useRouter()
  const [showScoreEntry, setShowScoreEntry] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Score entry state
  const [set1Player1, setSet1Player1] = useState<number | ''>('')
  const [set1Player2, setSet1Player2] = useState<number | ''>('')
  const [set2Player1, setSet2Player1] = useState<number | ''>('')
  const [set2Player2, setSet2Player2] = useState<number | ''>('')
  const [hasThirdSet, setHasThirdSet] = useState(false)
  const [set3Player1, setSet3Player1] = useState<number | ''>('')
  const [set3Player2, setSet3Player2] = useState<number | ''>('')
  const [finalSetType, setFinalSetType] = useState<'tiebreak' | 'full_set'>('tiebreak')

  const player1IsWinner = match.winnerId === match.player1Id
  const player2IsWinner = match.winnerId === match.player2Id

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matchDbId) return

    setLoading(true)
    setError(null)

    const result = await submitMatchScore({
      matchId: matchDbId,
      set1Player1: Number(set1Player1),
      set1Player2: Number(set1Player2),
      set2Player1: Number(set2Player1),
      set2Player2: Number(set2Player2),
      set3Player1: hasThirdSet ? Number(set3Player1) : undefined,
      set3Player2: hasThirdSet ? Number(set3Player2) : undefined,
      finalSetType: hasThirdSet ? finalSetType : null,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
      setShowScoreEntry(false)
    }
  }

  // If match doesn't have both players yet (future rounds)
  if (!match.player1Id || !match.player2Id) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          <div className="font-medium mb-1">{roundName}</div>
          <div>Awaiting previous round results</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 px-4 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs font-bold uppercase text-primary-700 dark:text-primary-300">
          {roundName}
        </span>
        {match.isComplete && (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        )}
      </div>

      {/* Players */}
      <div className="p-4 space-y-2">
        {/* Player 1 */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg transition-all ${
            player1IsWinner
              ? 'bg-green-500 text-white ring-2 ring-green-400 shadow-lg scale-105'
              : 'bg-gray-50 dark:bg-gray-900'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Seed */}
            <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {match.player1Seed}
            </div>
            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${player1IsWinner ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {match.player1Name}
              </p>
              {player1IsWinner && (
                <p className="text-xs flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Winner
                </p>
              )}
            </div>
          </div>
          {/* Score */}
          {match.isComplete && match.scores && (
            <div className={`text-2xl font-bold ml-2 ${player1IsWinner ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {match.scores.set1Player1}-{match.scores.set2Player1}
              {match.scores.set3Player1 !== undefined && match.scores.set3Player1 !== null && `-${match.scores.set3Player1}`}
            </div>
          )}
        </div>

        {/* VS Divider */}
        <div className="flex justify-center my-1">
          <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400">
            VS
          </span>
        </div>

        {/* Player 2 */}
        <div
          className={`flex items-center justify-between p-3 rounded-lg transition-all ${
            player2IsWinner
              ? 'bg-green-500 text-white ring-2 ring-green-400 shadow-lg scale-105'
              : 'bg-gray-50 dark:bg-gray-900'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Seed */}
            <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {match.player2Seed}
            </div>
            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${player2IsWinner ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {match.player2Name}
              </p>
              {player2IsWinner && (
                <p className="text-xs flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Winner
                </p>
              )}
            </div>
          </div>
          {/* Score */}
          {match.isComplete && match.scores && (
            <div className={`text-2xl font-bold ml-2 ${player2IsWinner ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
              {match.scores.set1Player2}-{match.scores.set2Player2}
              {match.scores.set3Player2 !== undefined && match.scores.set3Player2 !== null && `-${match.scores.set3Player2}`}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4">
        {!match.isComplete && canEnterScore && !showScoreEntry && (
          <button
            onClick={() => setShowScoreEntry(true)}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Edit3 className="w-4 h-4" />
            Enter Score
          </button>
        )}

        {match.isComplete && (
          <button
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        )}
      </div>

      {/* Score Entry Form */}
      {showScoreEntry && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
          <form onSubmit={handleScoreSubmit} className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Enter Match Score
            </h4>

            {/* Set 1 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Set 1
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={set1Player1}
                  onChange={(e) => setSet1Player1(e.target.value ? Number(e.target.value) : '')}
                  placeholder={`${match.player1Name?.split(' ')[0]}`}
                  required
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-center"
                />
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={set1Player2}
                  onChange={(e) => setSet1Player2(e.target.value ? Number(e.target.value) : '')}
                  placeholder={`${match.player2Name?.split(' ')[0]}`}
                  required
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-center"
                />
              </div>
            </div>

            {/* Set 2 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Set 2
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={set2Player1}
                  onChange={(e) => setSet2Player1(e.target.value ? Number(e.target.value) : '')}
                  placeholder={`${match.player1Name?.split(' ')[0]}`}
                  required
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-center"
                />
                <input
                  type="number"
                  min="0"
                  max="7"
                  value={set2Player2}
                  onChange={(e) => setSet2Player2(e.target.value ? Number(e.target.value) : '')}
                  placeholder={`${match.player2Name?.split(' ')[0]}`}
                  required
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-center"
                />
              </div>
            </div>

            {/* Third Set Toggle */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={hasThirdSet}
                onChange={(e) => setHasThirdSet(e.target.checked)}
                className="w-4 h-4 text-primary-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Match went to third set
              </span>
            </label>

            {/* Set 3 */}
            {hasThirdSet && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Set 3
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set3Player1}
                      onChange={(e) => setSet3Player1(e.target.value ? Number(e.target.value) : '')}
                      placeholder={`${match.player1Name?.split(' ')[0]}`}
                      required={hasThirdSet}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-center"
                    />
                    <input
                      type="number"
                      min="0"
                      max="7"
                      value={set3Player2}
                      onChange={(e) => setSet3Player2(e.target.value ? Number(e.target.value) : '')}
                      placeholder={`${match.player2Name?.split(' ')[0]}`}
                      required={hasThirdSet}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-center"
                    />
                  </div>
                </div>

                {/* Final Set Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Third Set Type
                  </label>
                  <select
                    value={finalSetType}
                    onChange={(e) => setFinalSetType(e.target.value as 'tiebreak' | 'full_set')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
                  >
                    <option value="tiebreak">Tiebreak</option>
                    <option value="full_set">Full Set</option>
                  </select>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowScoreEntry(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? 'Submitting...' : 'Submit Score'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
