'use client'

import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { ArrowLeft, ShieldCheck, UserRound } from 'lucide-react'

type AdminUser = { id: string; display_name: string; role: 'student' | 'admin'; target_career: string | null; created_at: string }
type UserList = { users: AdminUser[]; admin_id: string }
type ErrorResponse = { error: string }
const fetchUsers = async (url: string): Promise<UserList> => { const response = await fetch(url); const body = await response.json(); if (!response.ok) throw new Error((body as ErrorResponse).error || 'User records could not be loaded.'); return body as UserList }

export default function AdminUsers() {
  const { data, error, isLoading, mutate } = useSWR<UserList>('/api/admin/users', fetchUsers)
  const { mutate: globalMutate } = useSWRConfig()
  async function changeRole(user: AdminUser, role: 'student' | 'admin') {
    if (user.role === role) return
    const action = role === 'admin' ? 'grant administrator access to' : 'remove administrator access from'
    if (!window.confirm(`Are you sure you want to ${action} ${user.display_name || 'this learner'}?`)) return
    const response = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, role }) })
    const body = await response.json()
    if (!response.ok) { window.alert((body as ErrorResponse).error || 'The role could not be updated.'); return }
    await Promise.all([mutate(), globalMutate('learnloom-admin-catalogue')])
  }

  return <main className="admin-shell"><header className="admin-topbar"><a className="admin-back" href="/admin"><ArrowLeft size={16} />Admin dashboard</a><span className="admin-label"><ShieldCheck size={15} />User management</span></header><div className="admin-content"><div className="page-heading-row"><div><p className="eyebrow">LEARNLOOM AI · ACCESS CONTROL</p><h1>User management</h1><p className="muted">Student and administrator roles are enforced in the database and server routes.</p></div><span className="result-count">{data?.users.length ?? 0} accounts</span></div>{error && <div className="data-warning" role="alert">{error.message}</div>}{isLoading ? <p className="muted">Loading learner accounts…</p> : <section className="surface admin-user-list"><div className="admin-user-row admin-user-header"><span>LEARNER</span><span>CAREER DIRECTION</span><span>ROLE</span><span>JOINED</span></div>{data?.users.map((user) => <article className="admin-user-row" key={user.id}><div className="admin-user-name"><span className="admin-user-avatar"><UserRound size={15} /></span><span><strong>{user.display_name || 'Learner'}</strong><small>{user.id.slice(0, 8)}…{user.id.slice(-4)}</small></span></div><span className="admin-career-cell">{user.target_career || 'No direction selected'}</span><label className="role-select"><span className="sr-only">Role for {user.display_name || 'learner'}</span><select aria-label={`Role for ${user.display_name || 'learner'}`} value={user.role} disabled={user.id === data.admin_id} onChange={(event) => void changeRole(user, event.target.value as 'student' | 'admin')}><option value="student">Student</option><option value="admin">Admin</option></select></label><time dateTime={user.created_at}>{new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</time></article>)}{!data?.users.length && <div className="empty-state"><span className="empty-icon"><UserRound size={20} /></span><h2>No learner accounts yet</h2><p>Accounts appear after students register and verify their email address.</p></div>}</section>}</div></main>
}
