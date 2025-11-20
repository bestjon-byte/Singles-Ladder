'use client'

import { Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'

interface WinnerCelebrationProps {
  winnerName: string
  seasonName: string
  stats?: {
    matchesWon: number
    setsWon: number
    duration: string
  }
  onClose: () => void
}

export default function WinnerCelebration({
  winnerName,
  seasonName,
  stats,
  onClose,
}: WinnerCelebrationProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    // Trigger animations after mount
    setTimeout(() => setShowContent(true), 100)
  }, [])

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 animate-gradient-shift" />

      {/* Confetti-like elements (CSS-based) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}%`,
              backgroundColor: ['#FFD700', '#FFA500', '#FF6347', '#4169E1', '#9370DB'][Math.floor(Math.random() * 5)],
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center justify-center h-full p-6 text-center">
        {/* Trophy Icon */}
        <div
          className={`transition-all duration-1000 ${
            showContent ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-180 opacity-0'
          }`}
        >
          <Trophy className="w-32 h-32 md:w-48 md:h-48 text-yellow-300 drop-shadow-2xl animate-trophy-bounce" />
        </div>

        {/* Winner name */}
        <h1
          className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white mt-8 drop-shadow-lg transition-all duration-1000 delay-500 ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          🎉 {winnerName} 🎉
        </h1>

        <p
          className={`text-2xl md:text-3xl lg:text-4xl text-white mt-4 transition-all duration-1000 delay-700 ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
        >
          {seasonName} Champion!
        </p>

        {/* Stats */}
        {stats && (
          <div
            className={`mt-8 bg-white/20 backdrop-blur-md rounded-2xl p-6 max-w-md w-full transition-all duration-1000 delay-1000 ${
              showContent ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
            }`}
          >
            <div className="grid grid-cols-3 gap-4 text-white">
              <div>
                <p className="text-3xl md:text-4xl font-bold">{stats.matchesWon}</p>
                <p className="text-sm md:text-base">Wins</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold">{stats.setsWon}</p>
                <p className="text-sm md:text-base">Sets</p>
              </div>
              <div>
                <p className="text-3xl md:text-4xl font-bold">{stats.duration}</p>
                <p className="text-sm md:text-base">Days</p>
              </div>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className={`mt-8 px-8 py-3 bg-white text-orange-600 rounded-lg font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-xl ${
            showContent ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
          }`}
          style={{ transitionDelay: '1200ms' }}
        >
          View Final Bracket
        </button>
      </div>

      {/* Add keyframe animations to globals.css or as inline styles */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        @keyframes trophyBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-confetti {
          animation: confetti linear infinite;
        }

        .animate-trophy-bounce {
          animation: trophyBounce 2s ease-in-out infinite;
        }

        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradientShift 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
