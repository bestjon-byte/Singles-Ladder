'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitMatchScore } from '@/lib/actions/matches'
import { ChevronDown, ChevronUp, MapPin, Calendar, Trophy, Star } from 'lucide-react'

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
  const [expanded, setExpanded] = useState(false)
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

    // Log debug info to browser console
    console.log('=== LADDER UPDATE DEBUG (Browser) ===')
    console.log('Full result:', result)
    if ('debug' in result && result.debug) {
      console.log('Ladder update status:', result.debug.ladderUpdateStatus)
      console.log('Ladder update details:', result.debug.ladderUpdateDetails)
    }
    console.log('=====================================')

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setShowScoreForm(false)
      // Refresh the page to show updated ladder positions
      console.log('Refreshing page...')
      router.refresh()
      // Force a hard refresh after a short delay to ensure cache is cleared
      setTimeout(() => {
        console.log('Forcing window reload...')
        window.location.reload()
      }, 500)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const isPlayer1 = match.player1.id === currentUserId
  const isCompleted = !!match.winner_id

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md">
      {/* Collapsed View */}
      <div
        className="p-4 cursor-pointer select-none"
        onClick={() => !showScoreForm && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {match.player1.name} vs {match.player2.name}
              </h4>
              {match.challenge?.is_wildcard && (
                <Star className="w-4 h-4 text-purple-500 flex-shrink-0" />
              )}
            </div>

            {/* Compact Score Display for Completed Matches */}
            {isCompleted ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {match.winner?.name}
                  </span>
                </div>
                <div className="flex gap-1 text-sm font-mono">
                  <span className={match.winner_id === match.player1.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                    {match.set1_player1_score}
                  </span>
                  <span className="text-gray-400">-</span>
                  <span className={match.winner_id === match.player2.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                    {match.set1_player2_score}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600 mx-1">•</span>
                  <span className={match.winner_id === match.player1.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                    {match.set2_player1_score}
                  </span>
                  <span className="text-gray-400">-</span>
                  <span className={match.winner_id === match.player2.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                    {match.set2_player2_score}
                  </span>
                  {match.set3_player1_score !== null && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600 mx-1">•</span>
                      <span className={match.winner_id === match.player1.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                        {match.set3_player1_score}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span className={match.winner_id === match.player2.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                        {match.set3_player2_score}
                      </span>
                      {match.final_set_type === 'tiebreak' && (
                        <span className="text-purple-500 text-xs">*</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 rounded">
                Awaiting Score
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            {!showScoreForm && (
              expanded ?
                <ChevronUp className="w-5 h-5 text-gray-400" /> :
                <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && !showScoreForm && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(match.match_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>{match.location}</span>
            </div>
          </div>

          {isCompleted ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">Match Details</h5>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${match.winner_id === match.player1.id ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <span className={`font-medium ${match.winner_id === match.player1.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {match.player1.name}
                    </span>
                  </div>
                  <div className="flex gap-3 font-mono text-base">
                    <span className={`w-8 text-center ${match.winner_id === match.player1.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                      {match.set1_player1_score}
                    </span>
                    <span className={`w-8 text-center ${match.winner_id === match.player1.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                      {match.set2_player1_score}
                    </span>
                    {match.set3_player1_score !== null && (
                      <span className={`w-8 text-center ${match.winner_id === match.player1.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                        {match.set3_player1_score}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${match.winner_id === match.player2.id ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                    <span className={`font-medium ${match.winner_id === match.player2.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                      {match.player2.name}
                    </span>
                  </div>
                  <div className="flex gap-3 font-mono text-base">
                    <span className={`w-8 text-center ${match.winner_id === match.player2.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                      {match.set1_player2_score}
                    </span>
                    <span className={`w-8 text-center ${match.winner_id === match.player2.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                      {match.set2_player2_score}
                    </span>
                    {match.set3_player2_score !== null && (
                      <span className={`w-8 text-center ${match.winner_id === match.player2.id ? 'text-green-600 dark:text-green-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                        {match.set3_player2_score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {match.final_set_type === 'tiebreak' && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-3 flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Final set was a championship tiebreak
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowScoreForm(true)
              }}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-colors"
            >
              Enter Match Score
            </button>
          )}
        </div>
      )}

      {/* Score Entry Form */}
      {showScoreForm && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-4">
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
        </div>
      )}
    </div>
  )
}
