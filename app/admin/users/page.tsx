import { redirect } from 'next/navigation'
import AdminUsers from '@/components/admin-users'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (error || profile?.role !== 'admin') redirect('/admin')
  return <AdminUsers />
}
