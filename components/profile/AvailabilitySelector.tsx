'use client'

import { Sunrise, Sun, Moon, Info } from 'lucide-react'
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
  const selectedDays = value?.days || []
  const selectedTimeSlots = value?.timeSlots || []

  const toggleDay = (day: DayOfWeek) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day]

    // If no days selected, clear everything
    if (newDays.length === 0) {
      onChange(null)
    } else {
      onChange({ days: newDays, timeSlots: selectedTimeSlots })
    }
  }

  const toggleTimeSlot = (slot: TimeSlot) => {
    const newSlots = selectedTimeSlots.includes(slot)
      ? selectedTimeSlots.filter(s => s !== slot)
      : [...selectedTimeSlots, slot]

    onChange({ days: selectedDays, timeSlots: newSlots })
  }

  const hasWarning = selectedDays.length > 0 && selectedTimeSlots.length === 0

  return (
    <div className="space-y-6">
      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          Set your typical availability for tennis matches. Other players will see this when choosing opponents on the ladder.
        </p>
      </div>

      {/* Days selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
          Days Available
        </label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = selectedDays.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={`
                  px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200
                  hover:scale-105 active:scale-95
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                  min-w-[56px]
                  ${isSelected
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-2 border-primary-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
                aria-pressed={isSelected}
              >
                {DAY_LABELS[day]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots selector */}
      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
          Time Slots {selectedDays.length > 0 && '(for selected days)'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TIME_SLOTS.map((slot) => {
            const config = TIME_SLOT_CONFIG[slot]
            const Icon = ICON_MAP[config.icon as keyof typeof ICON_MAP]
            const isSelected = selectedTimeSlots.includes(slot)
            const isDisabled = selectedDays.length === 0

            return (
              <button
                key={slot}
                type="button"
                onClick={() => !isDisabled && toggleTimeSlot(slot)}
                disabled={isDisabled}
                className={`
                  p-4 rounded-lg border-2
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                  ${isDisabled
                    ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700'
                    : isSelected
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-500 hover:bg-green-200 dark:hover:bg-green-900/40'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
                aria-pressed={isSelected}
                aria-disabled={isDisabled}
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className="w-6 h-6" />
                  <div className="text-center">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs opacity-75">{config.time}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Warning message */}
        {hasWarning && (
          <div className="mt-3 flex items-start gap-2 text-amber-700 dark:text-amber-400 text-sm">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>Please select at least one time slot for your available days.</p>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Tip:</strong> This is your general availability. Specific match times are agreed when creating challenges.
        </p>
      </div>
    </div>
  )
}
