import { AvailabilityData, DAYS_OF_WEEK, DAY_LABELS, DayOfWeek, TimeSlot } from '@/types/availability'

interface AvailabilityGridProps {
  availability: AvailabilityData
  className?: string
}

export default function AvailabilityGrid({ availability, className = '' }: AvailabilityGridProps) {
  const isAvailable = (day: DayOfWeek, slot: TimeSlot) => {
    return availability[day]?.includes(slot) || false
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="grid grid-cols-4 gap-2 mb-2">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400"></div>
        <div className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">AM</div>
        <div className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">PM</div>
        <div className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">Eve</div>
      </div>

      {/* Grid */}
      <div className="space-y-1" role="grid" aria-label="Weekly availability schedule">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="grid grid-cols-4 gap-2 items-center" role="row">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300" role="rowheader">
              {DAY_LABELS[day]}
            </div>
            {(['morning', 'afternoon', 'evening'] as TimeSlot[]).map((slot) => (
              <div
                key={slot}
                className="flex items-center justify-center h-8"
                role="gridcell"
                aria-label={`${day} ${slot} - ${isAvailable(day, slot) ? 'available' : 'not available'}`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    isAvailable(day, slot)
                      ? 'bg-green-600 dark:bg-green-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-600 dark:bg-green-400" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span>Not available</span>
        </div>
      </div>
    </div>
  )
}
