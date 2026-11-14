import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in with the designated administrator email to continue.' }, { status: 401 })
  if (!user.email || !user.email_confirmed_at) return NextResponse.json({ error: 'Confirm your email before setting up administrator access.' }, { status: 403 })

  const configuredEmail = process.env.LEARNLOOM_INITIAL_ADMIN_EMAIL?.trim().toLowerCase()
  if (!configuredEmail) return NextResponse.json({ error: 'The initial administrator email is not configured yet.' }, { status: 503 })
  if (user.email.trim().toLowerCase() !== configuredEmail) return NextResponse.json({ error: 'This account is not authorized for initial administrator setup.' }, { status: 403 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) return NextResponse.json({ error: 'Secure administrator setup is not configured.' }, { status: 503 })
  const admin = createAdminClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { count, error: countError } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
  if (countError) return NextResponse.json({ error: 'Administrator status could not be checked.' }, { status: 500 })

  if (count === 0) {
    const { error } = await admin.from('profiles').upsert({ id: user.id, display_name: user.user_metadata?.display_name ?? user.email.split('@')[0], role: 'admin' }, { onConflict: 'id' })
    if (error) return NextResponse.json({ error: 'Administrator access could not be assigned.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
