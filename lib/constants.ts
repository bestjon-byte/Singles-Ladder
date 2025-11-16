export const APP_NAME = 'Tennis Singles Ladder'

// Challenge rules
export const MAX_POSITIONS_TO_CHALLENGE = 2
export const FORFEIT_DAYS = 14
export const FORFEIT_WARNING_DAYS = 10

// Notification settings
export const MATCH_REMINDER_DAYS_BEFORE = 1

// Pagination
export const ITEMS_PER_PAGE = 20

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  RESET_PASSWORD: '/auth/reset-password',
  DASHBOARD: '/dashboard',
  LADDER: '/dashboard',
  CHALLENGES: '/dashboard/challenges',
  MATCHES: '/dashboard/matches',
  STATS: '/dashboard/stats',
  PROFILE: '/dashboard/profile',
  NOTIFICATIONS: '/dashboard/notifications',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_SEASONS: '/admin/seasons',
  ADMIN_USERS: '/admin/users',
  ADMIN_DISPUTES: '/admin/disputes',
  ADMIN_PLAYOFFS: '/admin/playoffs',
} as const
