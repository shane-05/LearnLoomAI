'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { ArrowUpRight, BookOpen, ExternalLink, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Resource = { id: string; title: string; description: string | null; url: string; resource_type: string; verified: boolean; created_at: string }
export default function ResourcesPanel() {
  const [query, setQuery] = useState('')
  const supabase = createClient()
  const { data, error, isLoading } = useSWR('learnloom-resources', async () => {
    const { data, error } = await supabase.from('learning_resources').select('id, title, description, url, resource_type, verified, created_at').order('created_at', { ascending: false })
    if (error) throw new Error(['42P01', 'PGRST205', 'PGRST204'].includes(error.code) ? 'The resources catalogue is not installed yet. Apply the LearnLoom schema migration to continue.' : 'Learning resources could not be loaded.')
    return data as Resource[]
  })
  const resources = useMemo(() => (data ?? []).filter((resource) => `${resource.title} ${resource.description ?? ''} ${resource.resource_type}`.toLowerCase().includes(query.toLowerCase())), [data, query])
  return <section className="page-stack"><div className="page-heading-row"><div><p className="eyebrow">CURATED FOR YOUR NEXT STEP</p><h1>Resources</h1><p className="muted">Learning material selected to help you keep moving forward.</p></div><span className="result-count">{data?.length ?? 0} resources</span></div><label className="search-box resource-search"><Search size={16} /><span className="sr-only">Search resources</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by topic or title" /></label>{isLoading ? <div className="empty-state"><p>Loading resources…</p></div> : error ? <div className="data-warning" role="alert">{error.message}</div> : resources.length ? <div className="resource-list">{resources.map((resource, index) => <article className="resource-card surface" key={resource.id}><span className="resource-index">0{index + 1}</span><div className="resource-copy"><div className="resource-tags"><span className="category-pill">{resource.resource_type}</span><span className={`verification-label ${resource.verified ? 'verified' : ''}`}>{resource.verified ? 'Verified resource' : 'Not verified'}</span></div><h2>{resource.title}</h2><p>{resource.description || 'No description has been added.'}</p><a href={resource.url} target="_blank" rel="noopener noreferrer">Open resource <ExternalLink size={13} /></a></div><span className="resource-icon"><BookOpen size={17} /></span></article>)}</div> : <div className="empty-state"><span className="empty-icon"><BookOpen size={20} /></span><h2>{data?.length ? 'No resources match' : 'The resource shelf is waiting'}</h2><p>{data?.length ? 'Try a broader search.' : 'Verified learning resources will appear here when an administrator adds them.'}</p>{data?.length ? null : <ArrowUpRight size={15} />}</div>}</section>
}
