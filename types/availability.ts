export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type TimeSlot =
  | 'morning'    // 8am-12pm
  | 'afternoon'  // 12pm-5pm
  | 'evening'    // 5pm-9pm

// New structure: each day maps to an array of time slots
// Example: { monday: ['morning', 'evening'], saturday: ['morning', 'afternoon', 'evening'] }
export type AvailabilityData = Partial<Record<DayOfWeek, TimeSlot[]>>

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
]

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

export const TIME_SLOTS: TimeSlot[] = ['morning', 'afternoon', 'evening']

export const TIME_SLOT_CONFIG = {
  morning: {
    label: 'Morning',
    time: '8am-12pm',
    icon: 'Sunrise',
  },
  afternoon: {
    label: 'Afternoon',
    time: '12pm-5pm',
    icon: 'Sun',
  },
  evening: {
    label: 'Evening',
    time: '5pm-9pm',
    icon: 'Moon',
  },
} as const
