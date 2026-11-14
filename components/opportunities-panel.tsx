'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { Bookmark, BookmarkCheck, BriefcaseBusiness, ExternalLink, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Opportunity = { id: string; title: string; organization: string; category: string; description: string | null; application_url: string; deadline: string | null; eligibility: string | null; verified: boolean }
type OpportunityData = { items: Opportunity[]; bookmarks: string[] }
export default function OpportunitiesPanel({ userId, onSignIn, onNotice }: { userId: string | null; onSignIn: () => void; onNotice: (message: string) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All opportunities')
  const [busy, setBusy] = useState<string | null>(null)
  const supabase = createClient()
  const { data, error, isLoading, mutate } = useSWR<OpportunityData>('learnloom-opportunities', async () => {
    const { data: items, error: itemsError } = await supabase.from('opportunities').select('id, title, organization, category, description, application_url, deadline, eligibility, verified').order('deadline', { ascending: true })
    if (itemsError) throw new Error(['42P01', 'PGRST205', 'PGRST204'].includes(itemsError.code) ? 'Opportunity listings are not installed yet. Apply the LearnLoom schema migration to continue.' : 'Opportunity listings could not be loaded.')
    if (!userId) return { items: items as Opportunity[], bookmarks: [] }
    const { data: saved, error: savedError } = await supabase.from('opportunity_bookmarks').select('opportunity_id').eq('user_id', userId)
    if (savedError) throw new Error('Saved opportunities could not be loaded.')
    return { items: items as Opportunity[], bookmarks: saved.map((item) => item.opportunity_id) }
  })
  const categories = ['All opportunities', ...Array.from(new Set((data?.items ?? []).map((item) => item.category)))]
  const visible = useMemo(() => (data?.items ?? []).filter((item) => (category === 'All opportunities' || item.category === category) && `${item.title} ${item.organization} ${item.category} ${item.description ?? ''}`.toLowerCase().includes(query.toLowerCase())), [data, category, query])
  async function toggleBookmark(item: Opportunity) {
    if (!userId) { onSignIn(); return }
    setBusy(item.id)
    const isSaved = data?.bookmarks.includes(item.id)
    const result = isSaved ? await supabase.from('opportunity_bookmarks').delete().eq('user_id', userId).eq('opportunity_id', item.id) : await supabase.from('opportunity_bookmarks').insert({ user_id: userId, opportunity_id: item.id })
    setBusy(null)
    if (result.error) { onNotice('That opportunity could not be saved. Please try again.'); return }
    await mutate()
    onNotice(isSaved ? 'Bookmark removed.' : 'Opportunity saved to your bookmarks.')
  }
  return <section className="page-stack"><div className="page-heading-row"><div><p className="eyebrow">FIND YOUR NEXT OPPORTUNITY</p><h1>Opportunities</h1><p className="muted">Internships, programs, and hackathons that help you put skills to work.</p></div><span className="result-count">{data?.items.length ?? 0} listings</span></div><div className="opportunity-tools"><label className="search-box"><Search size={16} /><span className="sr-only">Search opportunities</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles and organizations" /></label><select className="opportunity-select" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>{isLoading ? <div className="empty-state"><p>Loading opportunities…</p></div> : error ? <div className="data-warning" role="alert">{error.message}</div> : visible.length ? <div className="opportunity-list">{visible.map((item, index) => <article className="opportunity-card surface" key={item.id}><div className="opportunity-mark">{item.category.slice(0, 1).toUpperCase()}</div><div className="opportunity-copy"><div className="resource-tags"><span className="category-pill">{item.category}</span><span className={`verification-label ${item.verified ? 'verified' : ''}`}>{item.verified ? 'Verified' : 'Not verified'}</span></div><h2>{item.title}</h2><p className="opportunity-org">{item.organization}</p><p>{item.description || 'No description has been added.'}</p><div className="opportunity-meta">{item.deadline && <span>Deadline {new Date(item.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>}{item.eligibility && <span>{item.eligibility}</span>}</div><a href={item.application_url} target="_blank" rel="noopener noreferrer">View application <ExternalLink size={13} /></a></div><button className="icon-button bookmark-button" disabled={busy === item.id} onClick={() => void toggleBookmark(item)} aria-label={`${data?.bookmarks.includes(item.id) ? 'Remove bookmark for' : 'Bookmark'} ${item.title}`}>{data?.bookmarks.includes(item.id) ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}</button></article>)}</div> : <div className="empty-state"><span className="empty-icon"><BriefcaseBusiness size={20} /></span><h2>{data?.items.length ? 'No listings match' : 'No verified listings yet'}</h2><p>{data?.items.length ? 'Try a different search or category.' : 'Listings will appear after they are added and reviewed. LearnLoom does not invent opportunities.'}</p></div>}</section>
}
