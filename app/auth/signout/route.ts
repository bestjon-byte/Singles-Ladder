import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  await supabase.auth.signOut()

  // Use 303 status for POST-redirect-GET pattern to prevent blank screen
  return NextResponse.redirect(new URL('/auth/login', request.url), 303)
}
