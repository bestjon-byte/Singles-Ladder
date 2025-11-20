'use client'

import * as Popover from '@radix-ui/react-popover'
import { Clock } from 'lucide-react'
import { AvailabilityData } from '@/types/availability'
import AvailabilityGrid from '@/components/shared/AvailabilityGrid'

interface AvailabilityPopoverProps {
  playerName: string
  availability: AvailabilityData | null
}

export default function AvailabilityPopover({ playerName, availability }: AvailabilityPopoverProps) {
  if (!availability) return null

  const firstName = playerName.split(' ')[0]

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="
            w-7 h-7 sm:w-8 sm:h-8 rounded-full
            bg-green-100 dark:bg-green-900/30
            border-2 border-green-500 dark:border-green-400
            flex items-center justify-center
            hover:bg-green-200 dark:hover:bg-green-800
            transition-all duration-200 hover:scale-110
            focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          "
          aria-label={`View ${playerName}'s availability`}
        >
          <Clock className="w-4 h-4 text-green-700 dark:text-green-300" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="
            bg-white dark:bg-gray-800 rounded-lg
            shadow-lg border-2 border-primary-200 dark:border-primary-700
            p-5 w-80 sm:w-96 z-50
            animate-in fade-in-0 zoom-in-95
            data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
          "
          sideOffset={8}
          align="end"
        >
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {firstName}'s Availability
            </h3>
            <div className="h-px bg-gray-200 dark:bg-gray-700 mt-2" />
          </div>

          {/* Grid */}
          <AvailabilityGrid availability={availability} />

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
              <span>💡</span>
              <span>This is typical availability. Confirm specific times when challenging.</span>
            </p>
          </div>

          <Popover.Arrow className="fill-primary-200 dark:fill-primary-700" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
