export default function UsersLoading() {
  return (
    <div className="px-4 sm:px-0">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>

        {/* Search and filter skeleton */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="w-40 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>

        {/* Table skeleton */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="space-y-3 p-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
