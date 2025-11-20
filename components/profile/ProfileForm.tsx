'use client'

import { useState } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import AvailabilitySelector from './AvailabilitySelector'
import { AvailabilityData } from '@/types/availability'

interface ProfileFormProps {
  profile: {
    name: string
    whatsapp_number: string | null
    email_notifications_enabled: boolean
    whatsapp_notifications_enabled: boolean
    availability?: AvailabilityData | null
  }
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [name, setName] = useState(profile.name)
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsapp_number || '')
  const [emailNotifications, setEmailNotifications] = useState(profile.email_notifications_enabled)
  const [whatsappNotifications, setWhatsappNotifications] = useState(profile.whatsapp_notifications_enabled)
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    profile.availability || null
  )
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const result = await updateProfile({
      name,
      whatsapp_number: whatsappNumber,
      email_notifications_enabled: emailNotifications,
      whatsapp_notifications_enabled: whatsappNotifications,
      availability: availability,
    })

    setLoading(false)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* WhatsApp Number */}
      <div>
        <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          WhatsApp Number (Optional)
        </label>
        <input
          type="tel"
          id="whatsapp"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          placeholder="+1234567890"
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Used for match notifications and communication
        </p>
      </div>

      {/* Notification Preferences */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Notification Preferences
        </h3>
        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="email-notifications"
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="email-notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Notifications
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Receive notifications about challenges, matches, and updates via email
              </p>
            </div>
          </div>

          {/* WhatsApp Notifications */}
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="whatsapp-notifications"
                type="checkbox"
                checked={whatsappNotifications}
                onChange={(e) => setWhatsappNotifications(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="whatsapp-notifications" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                WhatsApp Notifications
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable WhatsApp message templates for quick sharing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Settings */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Availability Settings
        </h3>
        <AvailabilitySelector
          value={availability}
          onChange={setAvailability}
        />
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
