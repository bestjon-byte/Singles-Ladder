import Image from 'next/image'
import Link from 'next/link'
import { Trophy, Target, Award, TrendingUp, Users, Calendar } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-primary-50/30 to-white dark:from-gray-900 dark:via-primary-900/10 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Decorative tennis ball */}
        <div className="absolute top-20 right-10 w-32 h-32 opacity-20 animate-bounce-subtle hidden lg:block">
          <Image
            src="/images/apple-touch-icon.png"
            alt="Tennis Ball"
            width={128}
            height={128}
            className="object-contain"
          />
        </div>

        <div className="absolute top-60 left-10 w-24 h-24 opacity-10 animate-bounce-subtle hidden lg:block" style={{ animationDelay: '1s' }}>
          <Image
            src="/images/apple-touch-icon.png"
            alt="Tennis Ball"
            width={96}
            height={96}
            className="object-contain"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gradient-purple shadow-soft-lg">
              <Image
                src="/images/R-T-C.png"
                alt="Riccall Tennis Club"
                width={96}
                height={96}
                className="object-cover"
              />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-bold text-gray-900 dark:text-white mb-6 animate-slide-up">
            <span className="bg-gradient-purple bg-clip-text text-transparent">
              Singles Ladder
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-4 max-w-3xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Riccall Tennis Club
          </p>

          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Challenge players, track your matches, and climb the rankings.
            Your journey to the top starts here.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Link
              href="/auth/signup"
              className="btn-primary text-lg"
            >
              <Trophy className="w-5 h-5 inline mr-2" />
              Join the Ladder
            </Link>
            <Link
              href="/auth/login"
              className="btn-secondary text-lg"
            >
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-heading font-bold text-primary-600 dark:text-primary-400">
                24/7
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Challenge Anytime
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-heading font-bold text-primary-600 dark:text-primary-400">
                Live
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Rankings
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-heading font-bold text-primary-600 dark:text-primary-400">
                Easy
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Match Tracking
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-center text-gray-900 dark:text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Powerful features to manage your tennis ladder and track your progress
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card p-8 text-center group hover:border-primary-200 dark:hover:border-primary-800">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-purple-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                <Target className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-2">
                Challenge Players
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Challenge opponents within range and schedule your matches with ease
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card p-8 text-center group hover:border-primary-200 dark:hover:border-primary-800">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-purple-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                <Award className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-2">
                Track Matches
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Record scores, view match history, and track your performance over time
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card p-8 text-center group hover:border-primary-200 dark:hover:border-primary-800">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-purple-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-2">
                Climb Rankings
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Win matches to improve your position and reach the top of the ladder
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card p-8 text-center group hover:border-primary-200 dark:hover:border-primary-800">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-purple-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-2">
                Flexible Scheduling
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Propose match times and locations that work for both players
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card p-8 text-center group hover:border-primary-200 dark:hover:border-primary-800">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-purple-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-2">
                Community
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Connect with fellow club members and build lasting friendships
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card p-8 text-center group hover:border-primary-200 dark:hover:border-primary-800">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-purple-soft flex items-center justify-center group-hover:scale-110 transition-transform">
                <Trophy className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-2">
                Seasonal Play
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Compete in seasonal ladders with fresh starts and new challenges
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="card p-12 gradient-purple">
            <h2 className="text-3xl sm:text-4xl font-heading font-bold text-white mb-4">
              Ready to Join?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Start your journey up the ladder today. Create your account and challenge your first opponent.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              <Trophy className="w-5 h-5" />
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600 dark:text-gray-400 text-sm">
          <p>&copy; 2024 Riccall Tennis Club Singles Ladder. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
