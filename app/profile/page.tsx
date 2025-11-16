import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile/ProfileForm'
import PasswordChangeForm from '@/components/profile/PasswordChangeForm'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/dashboard')
  }

  // Check if user is on the ladder
  const { data: ladderPosition } = await supabase
    .from('ladder_positions')
    .select('position, season_id, seasons(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                My Profile
              </h1>
            </div>
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Profile Summary Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Profile Summary
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {profile.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {profile.name}
                    </p>
                  </div>
                  {profile.whatsapp_number && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">WhatsApp</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile.whatsapp_number}
                      </p>
                    </div>
                  )}
                  {ladderPosition && (
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Ladder Position</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        #{ladderPosition.position}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {(ladderPosition.seasons as any)?.name}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Edit Form */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Personal Information
                  </h2>
                  <ProfileForm profile={profile} />
                </div>

                {/* Password Change */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Change Password
                  </h2>
                  <PasswordChangeForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
