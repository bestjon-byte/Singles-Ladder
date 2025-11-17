export default function AdminLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-0">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  )
}
