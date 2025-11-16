export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Tennis Singles Ladder
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Manage your tennis club ladder with ease. Challenge players, track results, and climb the rankings.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <a
            href="/auth/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </a>
          <a
            href="/auth/signup"
            className="px-6 py-3 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Sign Up
          </a>
        </div>
      </div>
    </main>
  )
}
