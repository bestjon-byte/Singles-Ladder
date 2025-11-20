'use client'

import { Sunrise, Sun, Moon } from 'lucide-react'
import {
  AvailabilityData,
  DayOfWeek,
  TimeSlot,
  DAYS_OF_WEEK,
  DAY_LABELS,
  TIME_SLOTS,
  TIME_SLOT_CONFIG
} from '@/types/availability'

interface AvailabilitySelectorProps {
  value: AvailabilityData | null
  onChange: (value: AvailabilityData | null) => void
}

const ICON_MAP = {
  Sunrise,
  Sun,
  Moon
}

export default function AvailabilitySelector({ value, onChange }: AvailabilitySelectorProps) {
  const availability = value || {}

  const isSlotSelected = (day: DayOfWeek, slot: TimeSlot): boolean => {
    return availability[day]?.includes(slot) || false
  }

  const toggleSlot = (day: DayOfWeek, slot: TimeSlot) => {
    const daySlots = availability[day] || []

    let newDaySlots: TimeSlot[]
    if (daySlots.includes(slot)) {
      // Remove the slot
      newDaySlots = daySlots.filter(s => s !== slot)
    } else {
      // Add the slot
      newDaySlots = [...daySlots, slot]
    }

    // Create new availability object
    const newAvailability: AvailabilityData = { ...availability }

    if (newDaySlots.length === 0) {
      // If no slots for this day, remove the day entirely
      delete newAvailability[day]
    } else {
      // Otherwise, update the day's slots
      newAvailability[day] = newDaySlots
    }

    // If the entire object is empty, set to null
    if (Object.keys(newAvailability).length === 0) {
      onChange(null)
    } else {
      onChange(newAvailability)
    }
  }

  const isDaySelected = (day: DayOfWeek): boolean => {
    return Boolean(availability[day] && availability[day]!.length > 0)
  }

  const hasAnyAvailability = Object.keys(availability).length > 0

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Select your typical availability for tennis matches. Click individual time slots for each day. Other players will see this when choosing opponents on the ladder.
        </p>
      </div>

      {/* Availability Grid */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header Row */}
          <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Day
            </div>
            {TIME_SLOTS.map((slot) => {
              const config = TIME_SLOT_CONFIG[slot]
              const Icon = ICON_MAP[config.icon as keyof typeof ICON_MAP]
              return (
                <div
                  key={slot}
                  className="flex flex-col items-center justify-center text-center"
                >
                  <Icon className="w-5 h-5 mb-1 text-gray-600 dark:text-gray-400" />
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {config.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {config.time}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Day Rows */}
          <div className="space-y-2">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className={`
                  grid grid-cols-4 gap-2 items-center p-2 rounded-lg transition-colors
                  ${isDaySelected(day) ? 'bg-primary-50 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                `}
              >
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {DAY_LABELS[day]}
                </div>
                {TIME_SLOTS.map((slot) => {
                  const isSelected = isSlotSelected(day, slot)
                  return (
                    <div key={slot} className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggleSlot(day, slot)}
                        className={`
                          w-14 h-14 rounded-lg border-2 transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                          hover:scale-105 active:scale-95
                          ${isSelected
                            ? 'bg-green-100 dark:bg-green-900/30 border-green-500 dark:border-green-400 shadow-sm'
                            : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }
                        `}
                        aria-label={`${DAY_LABELS[day]} ${TIME_SLOT_CONFIG[slot].label} - ${isSelected ? 'selected' : 'not selected'}`}
                        aria-pressed={isSelected}
                      >
                        {isSelected && (
                          <div className="flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-green-600 dark:bg-green-400 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-white dark:text-gray-900"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </button>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status message */}
      {hasAnyAvailability ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          <p className="text-sm text-green-900 dark:text-green-100">
            ✓ You have set your availability for {Object.keys(availability).length} day{Object.keys(availability).length !== 1 ? 's' : ''}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click time slots above to set your availability
          </p>
        </div>
      )}

      {/* Help text */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 <strong>Tip:</strong> This is your general availability. Specific match times are agreed when creating challenges.
        </p>
      </div>
    </div>
  )
}
