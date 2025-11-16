import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import ProfileForm from '@/components/profile/ProfileForm'
import PasswordChangeForm from '@/components/profile/PasswordChangeForm'
import { User, Mail, Phone, Trophy, Shield } from 'lucide-react'

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

  // Check if user is admin
  const { data: admin } = await supabase
    .from('admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  // Check if user is on the ladder
  const { data: ladderPosition } = await supabase
    .from('ladder_positions')
    .select('position, season_id, seasons(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation isAdmin={!!admin} userName={profile?.name} />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-gray-900 dark:text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-purple flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-1">
                  {profile.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profile.email}
                </p>
              </div>

              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>

                {profile.whatsapp_number && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">WhatsApp</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {profile.whatsapp_number}
                      </p>
                    </div>
                  </div>
                )}

                {ladderPosition && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-purple-soft flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ladder Position</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        #{ladderPosition.position}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {(ladderPosition.seasons as any)?.name}
                      </p>
                    </div>
                  </div>
                )}

                {admin && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Role</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Administrator
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Account Status</span>
                    <span className={`badge ${profile.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Edit Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="card p-8">
              <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">
                Personal Information
              </h2>
              <ProfileForm profile={profile} />
            </div>

            {/* Password Change */}
            <div className="card p-8">
              <h2 className="text-2xl font-heading font-bold text-gray-900 dark:text-white mb-6">
                Change Password
              </h2>
              <PasswordChangeForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
