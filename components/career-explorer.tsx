'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, BriefcaseBusiness, Search, SlidersHorizontal } from 'lucide-react'

type Career = { id: string; title: string; category: string; description: string; required_skills: string[] | null }

export default function CareerExplorer({ careers, selectedCareer, onSelectCareer }: { careers: Career[]; selectedCareer: string | null; onSelectCareer: (title: string) => void }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All paths')
  const categories = ['All paths', ...Array.from(new Set(careers.map((career) => career.category)))]
  const visible = useMemo(() => careers.filter((career) => (category === 'All paths' || career.category === category) && `${career.title} ${career.description} ${(career.required_skills ?? []).join(' ')}`.toLowerCase().includes(query.toLowerCase())), [careers, category, query])

  return <section className="page-stack">
    <div className="page-heading-row"><div><p className="eyebrow">FIND YOUR DIRECTION</p><h1>Career explorer</h1><p className="muted">Explore paths that connect your interests to what’s next.</p></div><span className="result-count">{careers.length} career paths</span></div>
    <div className="career-tools"><label className="search-box"><Search size={17} /><span className="sr-only">Search careers</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search roles, skills, or interests" /></label><label className="filter-box"><SlidersHorizontal size={16} /><span className="sr-only">Filter by career category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
    {visible.length === 0 ? <div className="empty-state"><BriefcaseBusiness size={22} /><h2>{careers.length ? 'No paths found' : 'Career paths are being prepared'}</h2><p>{careers.length ? 'Try a different search or category.' : 'The career catalogue will appear here as soon as it is available.'}</p></div> : <div className="career-grid">{visible.map((career, index) => <article className={`career-card career-accent-${index % 4}`} key={career.id}><div className="career-card-top"><span className="category-pill">{career.category}</span><span className="career-number">0{index + 1}</span></div><h2>{career.title}</h2><p className="career-description">{career.description}</p><div className="tag-list">{(career.required_skills ?? []).slice(0, 4).map((skill) => <span className="skill-tag" key={skill}>{skill}</span>)}{(career.required_skills ?? []).length > 4 && <span className="skill-tag">+{(career.required_skills ?? []).length - 4}</span>}</div><button className={`career-link ${selectedCareer === career.title ? 'selected' : ''}`} onClick={() => onSelectCareer(career.title)}>{selectedCareer === career.title ? 'Selected direction' : 'Explore this path'}<ArrowUpRight size={16} /></button></article>)}</div>}
  </section>
}
