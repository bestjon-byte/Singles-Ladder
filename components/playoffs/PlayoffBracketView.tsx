'use client'

import { Trophy } from 'lucide-react'
import type { PlayoffBracket, User } from '@/types'
import PlayoffMatchCard from './PlayoffMatchCard'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface PlayoffBracketViewProps {
  bracket: PlayoffBracket
  currentUserId?: string
}

export default function PlayoffBracketView({
  bracket,
  currentUserId,
}: PlayoffBracketViewProps) {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMatches()
  }, [bracket.season_id])

  const fetchMatches = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('season_id', bracket.season_id)
      .in('match_type', ['quarterfinal', 'semifinal', 'final'])

    setMatches(data || [])
    setLoading(false)
  }

  const bracketData = bracket.bracket_data
  const isComplete = !!bracketData.winnerId

  const getFormatTitle = () => {
    if (bracketData.format === 'final') return 'Final'
    if (bracketData.format === 'semis') return 'Semi Finals • Final'
    return 'Quarter Finals • Semi Finals • Final'
  }

  const canUserEnterScore = (matchData: any) => {
    if (!currentUserId || !matchData.player1Id || !matchData.player2Id) return false
    return matchData.player1Id === currentUserId || matchData.player2Id === currentUserId
  }

  const getMatchDbId = (bracketMatchId: string) => {
    const match = matches.find(m => m.id === bracketMatchId)
    return match?.id
  }

  return (
    <div className="playoff-bracket-view">
      {/* Trophy Header */}
      <div className={`rounded-lg p-6 md:p-8 mb-6 text-center ${
        isComplete
          ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500'
          : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600'
      } text-white shadow-2xl`}>
        <div className="flex items-center justify-center gap-3 mb-3">
          <Trophy className={`w-12 h-12 md:w-16 md:h-16 ${isComplete ? 'animate-pulse' : ''}`} />
          <h1 className="text-3xl md:text-4xl font-bold">
            {isComplete ? 'Championship Complete!' : 'Knockout Championship'}
          </h1>
        </div>
        <p className="text-lg md:text-xl opacity-90">
          {getFormatTitle()}
        </p>
        {isComplete && bracketData.winnerId && (
          <div className="mt-4 text-2xl md:text-3xl font-bold">
            🏆 Champion: {
              bracketData.rounds[bracketData.rounds.length - 1]
                .matches[0]
                .winnerId === bracketData.rounds[bracketData.rounds.length - 1].matches[0].player1Id
                ? bracketData.rounds[bracketData.rounds.length - 1].matches[0].player1Name
                : bracketData.rounds[bracketData.rounds.length - 1].matches[0].player2Name
            } 🏆
          </div>
        )}
      </div>

      {/* Round Progress Indicator */}
      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {bracketData.rounds.map((round, idx) => (
          <div
            key={idx}
            className={`rounded-full px-4 py-2 font-medium transition-all text-sm md:text-base ${
              round.isComplete
                ? 'bg-green-500 text-white'
                : bracketData.rounds.slice(0, idx).every(r => r.isComplete)
                ? 'bg-primary-500 text-white ring-2 ring-primary-300'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
          >
            {round.roundName}
          </div>
        ))}
      </div>

      {/* Mobile: Vertical Rounds */}
      <div className="md:hidden space-y-8">
        {bracketData.rounds.map((round, roundIdx) => (
          <div key={roundIdx}>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
              {round.roundName}
            </h2>
            <div className="space-y-4">
              {round.matches.map((match, matchIdx) => (
                <PlayoffMatchCard
                  key={matchIdx}
                  match={match}
                  matchDbId={getMatchDbId(match.matchId)}
                  roundName={round.roundName}
                  canEnterScore={canUserEnterScore(match)}
                  userId={currentUserId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Horizontal Bracket (Grid) */}
      <div className="hidden md:block">
        <div className="flex justify-center gap-8">
          {bracketData.rounds.map((round, roundIdx) => (
            <div key={roundIdx} className="flex flex-col justify-around min-w-[280px]">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {round.roundName}
                </h2>
              </div>
              <div className="space-y-8 flex-1 flex flex-col justify-around">
                {round.matches.map((match, matchIdx) => (
                  <PlayoffMatchCard
                    key={matchIdx}
                    match={match}
                    matchDbId={getMatchDbId(match.matchId)}
                    roundName={round.roundName}
                    canEnterScore={canUserEnterScore(match)}
                    userId={currentUserId}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Championship Statistics (if complete) */}
      {isComplete && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Championship Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {bracketData.rounds.reduce((sum, r) => sum + r.matches.length, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Matches</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {bracketData.format === 'final' ? '2' : bracketData.format === 'semis' ? '4' : '8'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Participants</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {bracketData.rounds.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rounds</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                ✓
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Complete</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
