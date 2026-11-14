import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const roleChangeSchema = z.object({ user_id: z.string().uuid(), role: z.enum(['student', 'admin']) }).strict()

async function getAdminContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Sign in to manage users.' }, { status: 401 }), userId: null, admin: null }
  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (error || profile?.role !== 'admin') return { error: NextResponse.json({ error: 'Administrator access is required.' }, { status: 403 }), userId: user.id, admin: null }
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !url) return { error: NextResponse.json({ error: 'Secure user management is not configured.' }, { status: 503 }), userId: user.id, admin: null }
  return { error: null, userId: user.id, admin: createAdminClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } }) }
}

export async function GET() {
  const context = await getAdminContext()
  if (context.error) return context.error
  if (!context.admin) return NextResponse.json({ error: 'Administrator service is unavailable.' }, { status: 503 })
  const { data, error } = await context.admin.from('profiles').select('id, display_name, role, target_career, created_at').order('created_at', { ascending: false }).limit(200)
  if (error) return NextResponse.json({ error: ['42703', 'PGRST204', 'PGRST205'].includes(error.code) ? 'Apply the LearnLoom role migration before managing users.' : 'User records could not be loaded.' }, { status: ['42703', 'PGRST204', 'PGRST205'].includes(error.code) ? 503 : 500 })
  return NextResponse.json({ users: data, admin_id: context.userId })
}

export async function PATCH(request: Request) {
  const context = await getAdminContext()
  if (context.error) return context.error
  if (!context.admin || !context.userId) return NextResponse.json({ error: 'Administrator service is unavailable.' }, { status: 503 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }) }
  const parsed = roleChangeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Select a valid account role.' }, { status: 400 })
  if (parsed.data.user_id === context.userId) return NextResponse.json({ error: 'Use another administrator to change your own role.' }, { status: 400 })
  if (parsed.data.role === 'student') {
    const { count, error } = await context.admin.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
    if (error) return NextResponse.json({ error: 'Administrator roles could not be verified.' }, { status: 500 })
    if ((count ?? 0) <= 1) return NextResponse.json({ error: 'At least one administrator account must remain.' }, { status: 409 })
  }
  const { data, error } = await context.admin.from('profiles').update({ role: parsed.data.role }).eq('id', parsed.data.user_id).select('id, display_name, role, target_career, created_at').maybeSingle()
  if (error) return NextResponse.json({ error: error.code === '42703' ? 'Apply the LearnLoom role migration before managing users.' : 'The user role could not be updated.' }, { status: ['42703', 'PGRST204', 'PGRST205'].includes(error.code) ? 503 : 500 })
  if (!data) return NextResponse.json({ error: 'That learner profile was not found.' }, { status: 404 })
  return NextResponse.json({ user: data })
}
