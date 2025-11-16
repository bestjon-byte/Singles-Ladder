'use client'

import { useState } from 'react'
import CreateChallengeModal from './CreateChallengeModal'

interface CreateChallengeButtonProps {
  seasonId: string
  userPosition: number
  wildcardsRemaining: number
}

export default function CreateChallengeButton({
  seasonId,
  userPosition,
  wildcardsRemaining,
}: CreateChallengeButtonProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Create Challenge
      </button>

      {showModal && (
        <CreateChallengeModal
          seasonId={seasonId}
          userPosition={userPosition}
          wildcardsRemaining={wildcardsRemaining}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
