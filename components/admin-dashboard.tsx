'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { ArrowLeft, BookOpen, BriefcaseBusiness, Plus, ShieldCheck, Trash2, Waypoints } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Career = { id: string; title: string; category: string; description: string; required_skills: string[] }
type Skill = { id: string; name: string; category: string; description: string | null }
type Resource = { id: string; title: string; url: string; resource_type: string; verified: boolean }
type Tab = 'careers' | 'skills' | 'resources'

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('careers')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const { mutate } = useSWRConfig()
  const supabase = createClient()
  const { data, error, isLoading } = useSWR('learnloom-admin-catalogue', async () => {
    const [careerResult, skillResult, resourceResult] = await Promise.all([
      supabase.from('career_roles').select('id, title, category, description, required_skills').order('title'),
      supabase.from('skills').select('id, name, category, description').order('name'),
      supabase.from('learning_resources').select('id, title, url, resource_type, verified').order('title'),
    ])
    const failure = careerResult.error || skillResult.error || resourceResult.error
    if (failure) throw new Error(failure.message)
    return { careers: careerResult.data as Career[], skills: skillResult.data as Skill[], resources: resourceResult.data as Resource[] }
  })

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setNotice('')
    const form = new FormData(event.currentTarget)
    let result
    if (tab === 'careers') {
      const title = String(form.get('title') ?? '').trim()
      const category = String(form.get('category') ?? '').trim()
      const description = String(form.get('description') ?? '').trim()
      const required = String(form.get('required_skills') ?? '').split(',').map((value) => value.trim()).filter(Boolean)
      result = await supabase.from('career_roles').insert({ title, category, description, required_skills: required })
    } else if (tab === 'skills') {
      result = await supabase.from('skills').insert({ name: String(form.get('title') ?? '').trim(), category: String(form.get('category') ?? '').trim(), description: String(form.get('description') ?? '').trim() || null })
    } else {
      result = await supabase.from('learning_resources').insert({ title: String(form.get('title') ?? '').trim(), url: String(form.get('url') ?? '').trim(), description: String(form.get('description') ?? '').trim() || null, resource_type: String(form.get('category') ?? 'article'), verified: form.get('verified') === 'on' })
    }
    setBusy(false)
    if (result.error) { setNotice(result.error.code === '23505' ? 'That item already exists.' : 'The catalogue change could not be saved. Check your administrator permissions and try again.'); return }
    event.currentTarget.reset()
    setNotice('Catalogue updated.')
    await mutate('learnloom-admin-catalogue')
  }

  async function removeItem(table: 'career_roles' | 'skills' | 'learning_resources', id: string) {
    if (!window.confirm('Remove this catalogue item? Existing learning records may reference it.')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { setNotice('The item could not be removed. It may still be referenced by existing records.'); return }
    setNotice('Catalogue item removed.')
    await mutate('learnloom-admin-catalogue')
  }

  const tabs: { id: Tab; label: string; icon: typeof BriefcaseBusiness }[] = [{ id: 'careers', label: 'Career roles', icon: BriefcaseBusiness }, { id: 'skills', label: 'Skills', icon: Waypoints }, { id: 'resources', label: 'Resources', icon: BookOpen }]
  return <main className="admin-shell"><header className="admin-topbar"><a className="admin-back" href="/"><ArrowLeft size={16} />Learning space</a><span className="admin-label"><ShieldCheck size={15} />Administrator workspace</span><a className="admin-back" href="/admin/users">Manage users</a></header><div className="admin-content"><div className="page-heading-row"><div><p className="eyebrow">LEARNLOOM AI · CATALOGUE MANAGEMENT</p><h1>Administrator dashboard</h1><p className="muted">Manage shared learning content. Every change is checked against your database role.</p></div></div><nav className="admin-tabs" aria-label="Admin catalogue sections">{tabs.map(({ id, label, icon: Icon }) => <button className={tab === id ? 'selected' : ''} key={id} onClick={() => setTab(id)}><Icon size={15} />{label}</button>)}</nav>{notice && <p className="form-message" role="status">{notice}</p>}{error && <div className="data-warning" role="alert">{error.message}</div>}{isLoading ? <p className="muted">Loading catalogue…</p> : <div className="admin-grid"><form className="admin-create-form surface" onSubmit={createItem}><span className="form-icon"><Plus size={16} /></span><h2>Add {tab === 'careers' ? 'a career role' : tab === 'skills' ? 'a skill' : 'a resource'}</h2><label className="field"><span>{tab === 'careers' ? 'Career title' : tab === 'skills' ? 'Skill name' : 'Resource title'}</span><input name="title" required maxLength={120} /></label><label className="field"><span>{tab === 'resources' ? 'Type' : 'Category'}</span>{tab === 'resources' ? <select name="category"><option value="article">Article</option><option value="course">Course</option><option value="video">Video</option><option value="documentation">Documentation</option></select> : <input name="category" required maxLength={60} />}</label>{tab === 'resources' && <label className="field"><span>External URL</span><input name="url" type="url" required maxLength={1000} /></label>}{tab === 'careers' && <label className="field"><span>Required skills · comma separated</span><input name="required_skills" placeholder="Research, prototyping" maxLength={500} /></label>}{tab !== 'resources' && <label className="field"><span>Description</span><textarea name="description" rows={3} maxLength={1000} required={tab === 'careers'} /></label>}{tab === 'resources' && <><label className="field"><span>Description</span><textarea name="description" rows={3} maxLength={1000} /></label><label className="admin-checkbox"><input name="verified" type="checkbox" />Mark as verified</label></>}<button className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Add to catalogue'}<Plus size={14} /></button></form><section className="admin-list surface"><div className="section-heading"><div><span className="eyebrow">SHARED CATALOGUE</span><h2>{tabs.find((item) => item.id === tab)?.label}</h2></div><span className="result-count">{data?.[tab]?.length ?? 0} items</span></div>{tab === 'careers' && data?.careers.map((item) => <article className="admin-item" key={item.id}><div><strong>{item.title}</strong><span>{item.category} · {(item.required_skills ?? []).length} required skills</span></div><button className="icon-button danger-action" onClick={() => removeItem('career_roles', item.id)} aria-label={`Remove ${item.title}`}><Trash2 size={15} /></button></article>)}{tab === 'skills' && data?.skills.map((item) => <article className="admin-item" key={item.id}><div><strong>{item.name}</strong><span>{item.category}{item.description ? ` · ${item.description}` : ''}</span></div><button className="icon-button danger-action" onClick={() => removeItem('skills', item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={15} /></button></article>)}{tab === 'resources' && data?.resources.map((item) => <article className="admin-item" key={item.id}><div><strong>{item.title}</strong><span>{item.resource_type} · {item.verified ? 'Verified' : 'Unverified'}</span></div><button className="icon-button danger-action" onClick={() => removeItem('learning_resources', item.id)} aria-label={`Remove ${item.title}`}><Trash2 size={15} /></button></article>)}</section></div>}</div></main>
}
