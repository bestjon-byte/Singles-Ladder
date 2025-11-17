'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resolveDispute } from '@/lib/actions/disputes'
import { AlertTriangle, Check, X, Edit, Calendar, MapPin, Trophy, Star } from 'lucide-react'

interface DisputedMatch {
  id: string
  match_type: string
  match_date: string
  location: string
  set1_player1_score: number
  set1_player2_score: number
  set2_player1_score: number
  set2_player2_score: number
  set3_player1_score: number | null
  set3_player2_score: number | null
  final_set_type: string | null
  winner_id: string
  player1_id: string
  player2_id: string
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
  }
  disputed_by: {
    id: string
    name: string
  }
  challenge: {
    id: string
    is_wildcard: boolean
    challenger_id: string
    challenged_id: string
  } | null
  season: {
    id: string
    name: string
  }
}

interface DisputedMatchCardProps {
  match: DisputedMatch
}

export default function DisputedMatchCard({ match }: DisputedMatchCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReverseForm, setShowReverseForm] = useState(false)

  const [set1P1, setSet1P1] = useState(match.set1_player1_score.toString())
  const [set1P2, setSet1P2] = useState(match.set1_player2_score.toString())
  const [set2P1, setSet2P1] = useState(match.set2_player1_score.toString())
  const [set2P2, setSet2P2] = useState(match.set2_player2_score.toString())
  const [set3P1, setSet3P1] = useState(match.set3_player1_score?.toString() || '')
  const [set3P2, setSet3P2] = useState(match.set3_player2_score?.toString() || '')
  const [finalSetType, setFinalSetType] = useState<'tiebreak' | 'full_set' | ''>(match.final_set_type as any || '')
  const [needsSet3, setNeedsSet3] = useState(!!match.set3_player1_score)

  const handleConfirm = async () => {
    if (!confirm('Confirm the original score is correct? This will close the dispute.')) {
      return
    }

    setLoading(true)
    setError(null)

    const result = await resolveDispute({
      matchId: match.id,
      action: 'confirm',
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  const handleReverse = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!confirm('Are you sure you want to reverse this match result? The ladder will be updated if this is a challenge match.')) {
      return
    }

    setLoading(true)
    setError(null)

    // Calculate new winner
    let player1Sets = 0
    let player2Sets = 0

    if (parseInt(set1P1) > parseInt(set1P2)) player1Sets++
    else player2Sets++

    if (parseInt(set2P1) > parseInt(set2P2)) player1Sets++
    else player2Sets++

    if (needsSet3 && set3P1 && set3P2) {
      if (parseInt(set3P1) > parseInt(set3P2)) player1Sets++
      else player2Sets++
    }

    const newWinnerId = player1Sets >= 2 ? match.player1_id : match.player2_id

    const result = await resolveDispute({
      matchId: match.id,
      action: 'reverse',
      newWinnerId,
      set1Player1: parseInt(set1P1),
      set1Player2: parseInt(set1P2),
      set2Player1: parseInt(set2P1),
      set2Player2: parseInt(set2P2),
      set3Player1: needsSet3 && set3P1 ? parseInt(set3P1) : undefined,
      set3Player2: needsSet3 && set3P2 ? parseInt(set3P2) : undefined,
      finalSetType: needsSet3 && finalSetType ? finalSetType : null,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="card border-l-4 border-red-500">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                {match.player1.name} vs {match.player2.name}
              </h3>
              {match.challenge?.is_wildcard && (
                <Star className="w-5 h-5 text-purple-500" />
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(match.match_date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{match.location}</span>
              </div>
              <span className="badge-info">{match.season.name}</span>
            </div>
          </div>
        </div>

        {/* Dispute Info */}
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">
            Disputed by: <span className="font-bold">{match.disputed_by.name}</span>
          </p>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
            This player believes the recorded score is incorrect
          </p>
        </div>

        {/* Current Score */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Recorded Score:</h4>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${match.winner_id === match.player1.id ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <span className={`font-medium ${match.winner_id === match.player1.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {match.player1.name}
                    {match.winner_id === match.player1.id && (
                      <Trophy className="w-4 h-4 inline ml-2 text-yellow-500" />
                    )}
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
                    {match.winner_id === match.player2.id && (
                      <Trophy className="w-4 h-4 inline ml-2 text-yellow-500" />
                    )}
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
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Reverse Score Form */}
        {showReverseForm && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-blue-300 dark:border-blue-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Enter Corrected Score
            </h4>
            <form onSubmit={handleReverse} className="space-y-4">
              {/* Set 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Set 1</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{match.player1.name}</label>
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
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{match.player2.name}</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Set 2</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{match.player1.name}</label>
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
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{match.player2.name}</label>
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">Match went to a third set</span>
                </label>
              </div>

              {/* Set 3 */}
              {needsSet3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Final Set Type</label>
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
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{match.player1.name}</label>
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
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{match.player2.name}</label>
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

              {/* Form Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Reversing...' : 'Reverse & Update Score'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReverseForm(false)}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Action Buttons */}
        {!showReverseForm && (
          <div className="flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {loading ? 'Confirming...' : 'Confirm Score is Correct'}
            </button>
            <button
              onClick={() => setShowReverseForm(true)}
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <Edit className="w-5 h-5" />
              Reverse & Correct Score
            </button>
          </div>
        )}

        {/* Ladder Warning */}
        {match.match_type === 'challenge' && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-400">
              ⚠️ <strong>Challenge Match:</strong> Reversing this result will automatically update ladder positions
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
