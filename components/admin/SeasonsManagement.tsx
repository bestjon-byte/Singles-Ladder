'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSeason, toggleSeasonActive } from '@/lib/actions/seasons-admin'

interface Season {
  id: string
  name: string
  start_date: string
  end_date: string | null
  is_active: boolean
  wildcards_allowed: number
  created_at: string
}

interface SeasonsManagementProps {
  initialSeasons: Season[]
}

export default function SeasonsManagement({ initialSeasons }: SeasonsManagementProps) {
  const router = useRouter()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    wildcardsAllowed: '2',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const result = await createSeason({
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        wildcardsAllowed: parseInt(formData.wildcardsAllowed),
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Season created successfully')
        setFormData({
          name: '',
          startDate: '',
          endDate: '',
          wildcardsAllowed: '2',
        })
        setShowCreateForm(false)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create season')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (seasonId: string, currentStatus: boolean) => {
    setError(null)
    setSuccess(null)

    const action = currentStatus ? 'deactivate' : 'activate'
    if (!confirm(`Are you sure you want to ${action} this season?`)) {
      return
    }

    try {
      const result = await toggleSeasonActive(seasonId, !currentStatus)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(`Season ${action}d successfully`)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update season')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Create Season Button/Form */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Season
          </button>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Create New Season
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSeason} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Season Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Spring 2025"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="wildcardsAllowed" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Wildcards Allowed
                  </label>
                  <input
                    type="number"
                    id="wildcardsAllowed"
                    name="wildcardsAllowed"
                    min="0"
                    value={formData.wildcardsAllowed}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Season'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Seasons List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            All Seasons ({initialSeasons.length})
          </h2>
        </div>

        {initialSeasons.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No seasons yet. Create your first season to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {initialSeasons.map((season) => (
              <div key={season.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {season.name}
                      </h3>
                      {season.is_active && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <p>
                        Start: {new Date(season.start_date).toLocaleDateString()}
                        {season.end_date && ` • End: ${new Date(season.end_date).toLocaleDateString()}`}
                      </p>
                      <p>Wildcards: {season.wildcards_allowed} per player</p>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleToggleActive(season.id, season.is_active)}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        season.is_active
                          ? 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                          : 'text-white bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      {season.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
