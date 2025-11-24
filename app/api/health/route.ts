import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This endpoint keeps the Supabase project active by making a simple query
// Called by Vercel Cron Job every 3 days
export async function GET(request: Request) {
  try {
    // Verify this is coming from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Simple query to keep the database connection active
    const { data, error } = await supabase
      .from('seasons')
      .select('id')
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is fine
      console.error('Health check query failed:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    console.log('Health check successful at', new Date().toISOString())

    return NextResponse.json({
      success: true,
      message: 'Database connection active',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
