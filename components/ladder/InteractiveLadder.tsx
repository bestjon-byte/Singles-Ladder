'use client'

import { useState } from 'react'
import { Trophy, Zap, User, Lock } from 'lucide-react'
import CreateChallengeModal from '@/components/challenges/CreateChallengeModal'
import AvailabilityPopover from './AvailabilityPopover'
import { AvailabilityData } from '@/types/availability'

interface LadderPlayer {
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

interface ActiveChallenge {
  id: string
  challenger_id: string
  challenged_id: string
  status: string
}

interface InteractiveLadderProps {
  players: LadderPlayer[]
  currentUserId: string
  currentUserPosition: number | null
  seasonId: string
  availableWildcards: number
  activeChallenges: ActiveChallenge[]
}

export default function InteractiveLadder({
  players,
  currentUserId,
  currentUserPosition,
  seasonId,
  availableWildcards,
  activeChallenges,
}: InteractiveLadderProps) {
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState<LadderPlayer | null>(null)
  const [showWildcardWarning, setShowWildcardWarning] = useState(false)

  // Helper function to check if a player is locked (has an active challenge)
  const isPlayerLocked = (userId: string) => {
    return activeChallenges.some(
      challenge => challenge.challenger_id === userId || challenge.challenged_id === userId
    )
  }

  const canChallengeWithoutWildcard = (playerPosition: number) => {
    if (!currentUserPosition) return false
    const diff = currentUserPosition - playerPosition
    return diff > 0 && diff <= 2
  }

  const isPlayerAbove = (playerPosition: number) => {
    if (!currentUserPosition) return false
    // Lower position number means higher on ladder
    return playerPosition < currentUserPosition
  }

  const handlePlayerClick = (player: LadderPlayer) => {
    // Can't challenge yourself
    if (player.user_id === currentUserId) return

    // Can't challenge if not on ladder
    if (!currentUserPosition) return

    // Can't challenge players below you
    if (!isPlayerAbove(player.position)) return

    const needsWildcard = !canChallengeWithoutWildcard(player.position)

    if (needsWildcard) {
      if (availableWildcards > 0) {
        setSelectedPlayer(player)
        setShowWildcardWarning(true)
      } else {
        // No wildcards available
        return
      }
    } else {
      setSelectedPlayer(player)
      setShowChallengeModal(true)
    }
  }

  const confirmWildcardChallenge = () => {
    setShowWildcardWarning(false)
    setShowChallengeModal(true)
  }

  const getPlayerStatus = (player: LadderPlayer) => {
    if (player.user_id === currentUserId) return 'current'
    if (!currentUserPosition) return 'disabled'

    // Can't challenge players at or below you
    if (!isPlayerAbove(player.position)) return 'disabled'

    if (canChallengeWithoutWildcard(player.position)) return 'challengeable'
    if (availableWildcards > 0) return 'wildcard'
    return 'disabled'
  }

  if (!currentUserPosition) {
    return (
      <div className="card p-8">
        <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-4">
          Current Ladder
        </h2>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <p className="text-amber-800 dark:text-amber-200">
            You must be on the ladder to create challenges. Contact an admin to join.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="card p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 dark:text-white">
            Current Ladder
          </h2>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            {players.length} players
          </div>
        </div>

        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-200">
            <strong>Click a player</strong> to challenge. Challenge 1-2 above, or use a wildcard ({availableWildcards} left). Players with <Lock className="w-3 h-3 inline" /> are in active challenges.
          </p>
        </div>

        <div className="space-y-1.5 sm:space-y-2">
          {players.map((player) => {
            const status = getPlayerStatus(player)
            const isCurrent = player.user_id === currentUserId
            const isChallengeable = status === 'challengeable'
            const needsWildcard = status === 'wildcard'
            const isDisabled = status === 'disabled'
            const locked = isPlayerLocked(player.user_id)

            return (
              <div
                key={player.id}
                onClick={() => !isDisabled && !isCurrent && !locked && handlePlayerClick(player)}
                className={`
                  relative flex items-center justify-between p-2.5 sm:p-3 md:p-4 rounded-lg border-2 transition-all
                  ${isCurrent
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700'
                    : locked
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 opacity-70'
                    : isChallengeable
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 cursor-pointer hover:border-green-400 dark:hover:border-green-600 hover:shadow-md'
                    : needsWildcard
                    ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 cursor-pointer hover:border-purple-400 dark:hover:border-purple-600 hover:shadow-md'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                  }
                `}
              >
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                  <div className={`
                    w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base md:text-lg flex-shrink-0
                    ${isCurrent
                      ? 'bg-blue-600 dark:bg-blue-500 text-white'
                      : locked
                      ? 'bg-red-200 dark:bg-red-700 text-red-900 dark:text-red-100'
                      : isChallengeable
                      ? 'bg-green-200 dark:bg-green-700 text-green-900 dark:text-green-100'
                      : needsWildcard
                      ? 'bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  `}>
                    #{player.position}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className={`font-semibold text-sm sm:text-base truncate ${isCurrent ? 'text-primary-900 dark:text-primary-100' : 'text-gray-900 dark:text-white'}`}>
                        {player.user.name}
                      </span>
                      {isCurrent && (
                        <span className="badge-primary text-xs flex-shrink-0">You</span>
                      )}
                      {locked && !isCurrent && (
                        <span className="badge bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs flex items-center gap-1 flex-shrink-0">
                          <Lock className="w-3 h-3" />
                          <span className="hidden sm:inline">In Challenge</span>
                        </span>
                      )}
                      {isChallengeable && !isCurrent && !locked && (
                        <span className="badge-success text-xs hidden sm:inline-flex flex-shrink-0">Can Challenge</span>
                      )}
                      {needsWildcard && !locked && (
                        <span className="badge bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs flex items-center gap-1 flex-shrink-0">
                          <Zap className="w-3 h-3" />
                          <span className="hidden sm:inline">Wildcard</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                      {player.user.email}
                    </p>
                  </div>
                </div>

                {!isCurrent && !isDisabled && !locked && (
                  <div className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 hidden md:block flex-shrink-0 ml-2">
                    Click to challenge →
                  </div>
                )}
                {locked && !isCurrent && (
                  <div className="text-xs sm:text-sm font-medium text-red-600 dark:text-red-400 hidden md:block flex-shrink-0 ml-2">
                    In active challenge
                  </div>
                )}

                {/* Availability indicator */}
                {player.user.availability && (
                  <div
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AvailabilityPopover
                      playerName={player.user.name}
                      availability={player.user.availability}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Wildcard Warning Modal */}
      {showWildcardWarning && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Use Wildcard?
              </h3>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Challenging <strong>{selectedPlayer.user.name}</strong> (#{selectedPlayer.position})
              will use one of your wildcards. You have <strong>{availableWildcards}</strong> wildcard
              {availableWildcards === 1 ? '' : 's'} remaining.
            </p>

            <div className="flex gap-3">
              <button
                onClick={confirmWildcardChallenge}
                className="flex-1 btn-primary"
              >
                Use Wildcard
              </button>
              <button
                onClick={() => {
                  setShowWildcardWarning(false)
                  setSelectedPlayer(null)
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {showChallengeModal && selectedPlayer && currentUserPosition && (
        <CreateChallengeModal
          seasonId={seasonId}
          userPosition={currentUserPosition}
          wildcardsRemaining={availableWildcards}
          preselectedPlayerId={selectedPlayer.user_id}
          preselectedIsWildcard={!canChallengeWithoutWildcard(selectedPlayer.position)}
          onClose={() => {
            setShowChallengeModal(false)
            setSelectedPlayer(null)
          }}
        />
      )}
    </>
  )
}
