'use client'

import MatchCard from './MatchCard'

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
  is_disputed: boolean
  disputed_by_user_id: string | null
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

interface MatchesListProps {
  matches: Match[]
  currentUserId: string
}

export default function MatchesList({ matches, currentUserId }: MatchesListProps) {
  const pendingMatches = matches.filter(m => !m.winner_id)
  const completedMatches = matches.filter(m => m.winner_id)

  return (
    <div className="space-y-6">
      {/* Pending Matches */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Pending Matches ({pendingMatches.length})
        </h3>
        {pendingMatches.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No pending matches. Accept a challenge to create a match!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Completed Matches ({completedMatches.length})
          </h3>
          <div className="space-y-4">
            {completedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
