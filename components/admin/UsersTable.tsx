'use client'

import { useState } from 'react'
import AdminToggle from './AdminToggle'
import { Search } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  whatsapp_number: string | null
  created_at: string
}

interface UsersTableProps {
  users: User[]
  currentUserId: string
  ladderPositions: Record<string, number>
  adminUserIds: Set<string>
}

export default function UsersTable({
  users,
  currentUserId,
  ladderPositions,
  adminUserIds
}: UsersTableProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'in-ladder' | 'not-in-ladder' | 'admins'>('all')

  // Filter users based on search and filter
  const filteredUsers = users.filter(user => {
    // Search filter
    const searchLower = search.toLowerCase()
    const matchesSearch = !search ||
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)

    if (!matchesSearch) return false

    // Status filter
    if (filter === 'in-ladder' && !ladderPositions[user.id]) return false
    if (filter === 'not-in-ladder' && ladderPositions[user.id]) return false
    if (filter === 'admins' && !adminUserIds.has(user.id)) return false

    return true
  })

  return (
    <>
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="Search users"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as typeof filter)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          aria-label="Filter users"
        >
          <option value="all">All Users ({users.length})</option>
          <option value="in-ladder">In Ladder ({Object.keys(ladderPositions).length})</option>
          <option value="not-in-ladder">Not in Ladder</option>
          <option value="admins">Admins Only ({adminUserIds.size})</option>
        </select>
      </div>

      {/* Results count */}
      {(search || filter !== 'all') && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <caption className="sr-only">List of all users</caption>
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  WhatsApp
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ladder Position
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Admin
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.whatsapp_number || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {ladderPositions[user.id] ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        #{ladderPositions[user.id]}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-600">Not in ladder</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {adminUserIds.has(user.id) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                        Admin
                      </span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Player</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center">
                      <AdminToggle
                        userId={user.id}
                        userName={user.name}
                        isAdmin={adminUserIds.has(user.id)}
                        isCurrentUser={user.id === currentUserId}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              {search || filter !== 'all' ? 'No users match your search criteria.' : 'No users found.'}
            </p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="card p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                {user.whatsapp_number && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    WhatsApp: {user.whatsapp_number}
                  </p>
                )}
              </div>
              <AdminToggle
                userId={user.id}
                userName={user.name}
                isAdmin={adminUserIds.has(user.id)}
                isCurrentUser={user.id === currentUserId}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {ladderPositions[user.id] && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Ladder: #{ladderPositions[user.id]}
                </span>
              )}
              {adminUserIds.has(user.id) && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  Admin
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 card">
            <p className="text-gray-500 dark:text-gray-400">
              {search || filter !== 'all' ? 'No users match your search criteria.' : 'No users found.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
