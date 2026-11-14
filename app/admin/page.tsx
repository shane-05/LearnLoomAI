import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminDashboard from '@/components/admin-dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (error || profile?.role !== 'admin') {
    return <main className="admin-denied"><div className="surface"><span className="eyebrow">LEARNLOOM AI · ADMIN</span><h1>Administrator access required</h1><p>This area is limited to accounts with an administrator role. Student access cannot assign or change that role.</p><a href="/">Return to your learning space</a></div></main>
  }
  return <AdminDashboard />
}
