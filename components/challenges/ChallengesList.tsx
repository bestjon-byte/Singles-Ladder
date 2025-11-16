'use client'

import ChallengeCard from './ChallengeCard'

interface Challenge {
  id: string
  status: string
  is_wildcard: boolean
  proposed_date: string
  proposed_location: string
  accepted_date: string | null
  accepted_location: string | null
  created_at: string
  challenger: {
    id: string
    name: string
    email: string
  }
  challenged: {
    id: string
    name: string
    email: string
  }
}

interface ChallengesListProps {
  challenges: Challenge[]
  currentUserId: string
}

export default function ChallengesList({ challenges, currentUserId }: ChallengesListProps) {
  const activeChallenges = challenges.filter(c => ['pending', 'accepted'].includes(c.status))
  const pastChallenges = challenges.filter(c => !['pending', 'accepted'].includes(c.status))

  return (
    <div className="space-y-6">
      {/* Active Challenges */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Active Challenges ({activeChallenges.length})
        </h3>
        {activeChallenges.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No active challenges. Create a challenge to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Past Challenges */}
      {pastChallenges.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Past Challenges ({pastChallenges.length})
          </h3>
          <div className="space-y-4">
            {pastChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
