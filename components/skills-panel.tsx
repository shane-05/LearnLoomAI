'use client'

import { useState } from 'react'
import { ArrowUpRight, Check, CircleHelp, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Skill = { id: string; name: string; category: string; proficiency: number | null; evidence: string | null; verification_status: string }

export default function SkillsPanel({ userId, skills, onRefresh, onNotice }: { userId: string | null; skills: Skill[]; onRefresh: () => void; onNotice: (message: string) => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Technical')
  const [proficiency, setProficiency] = useState('3')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function addSkill(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId || !name.trim()) return
    setSaving(true)
    const form = new FormData(event.currentTarget)
    const evidence = String(form.get('evidence') ?? '').trim()
    const { error } = await supabase.from('user_skills').insert({ user_id: userId, name: name.trim(), category, proficiency: Number(proficiency), evidence: evidence || null, verification_status: 'self-reported' })
    setSaving(false)
    if (error) { onNotice(error.code === '23505' ? 'That skill is already on your list.' : 'We couldn’t save that skill. Please try again.'); return }
    setName('')
    onRefresh()
    onNotice('Skill added to your profile.')
  }

  async function updateProficiency(id: string, value: string) {
    if (!userId) return
    const { error } = await supabase.from('user_skills').update({ proficiency: value ? Number(value) : null }).eq('id', id).eq('user_id', userId)
    if (error) { onNotice('We couldn’t update that skill. Please try again.'); return }
    onRefresh()
    onNotice('Skill proficiency updated.')
  }

  async function removeSkill(id: string) {
    const { error } = await supabase.from('user_skills').delete().eq('id', id).eq('user_id', userId ?? '')
    if (error) { onNotice('We couldn’t remove that skill. Please try again.'); return }
    onRefresh()
    onNotice('Skill removed.')
  }

  return <section className="page-stack"><div className="page-heading-row"><div><p className="eyebrow">YOUR FOUNDATION</p><h1>My skills</h1><p className="muted">A clearer picture of what you already know.</p></div><span className="result-count">{skills.length} {skills.length === 1 ? 'skill' : 'skills'}</span></div>
    <div className="skills-layout"><div className="skills-list surface"><div className="section-heading"><div><h2>Your skill library</h2><p>Only skills you add appear in your profile.</p></div><span className="privacy-chip"><Check size={13} />Private</span></div>
      {skills.length === 0 ? <div className="empty-inline"><CircleHelp size={18} /><span>Your skills will show up here once you add them. We won’t infer proficiency for skills you haven’t reported.</span></div> : <div className="skill-rows">{skills.map((skill) => <article className="skill-row" key={skill.id}><div className="skill-symbol">{skill.name.slice(0, 1).toUpperCase()}</div><div className="skill-info"><h3>{skill.name}</h3><p>{skill.category} <span>·</span> {skill.verification_status === 'verified' ? 'Assessment verified' : 'Self-reported'}</p></div><label className="skill-proficiency"><span className="sr-only">Update {skill.name} proficiency</span><select aria-label={`Update ${skill.name} proficiency`} value={skill.proficiency ?? ''} onChange={(event) => void updateProficiency(skill.id, event.target.value)}><option value="">Unreported</option><option value="1">1 · Exploring</option><option value="2">2 · Learning</option><option value="3">3 · Practicing</option><option value="4">4 · Confident</option><option value="5">5 · Advanced</option></select></label><button className="icon-button danger-action" aria-label={`Remove ${skill.name}`} onClick={() => removeSkill(skill.id)}><Trash2 size={16} /></button></article>)}</div>}
    </div><form className="add-skill-form surface" onSubmit={addSkill}><div className="form-icon"><Plus size={17} /></div><h2>Add a skill</h2><p>Start with something you’ve practiced or learned.</p><label className="field"><span>Skill name</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Data visualization" /></label><div className="form-row"><label className="field"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option>Technical</option><option>Design</option><option>Data</option><option>Communication</option><option>Other</option></select></label><label className="field"><span>Self-rating</span><select value={proficiency} onChange={(event) => setProficiency(event.target.value)}><option value="1">1 · Exploring</option><option value="2">2 · Learning</option><option value="3">3 · Practicing</option><option value="4">4 · Confident</option><option value="5">5 · Advanced</option></select></label></div><label className="field"><span>Evidence (optional)</span><input name="evidence" maxLength={500} placeholder="A project, course, or practice example" /></label><button className="primary-button full-button" type="submit" disabled={saving || !userId}>{saving ? 'Saving…' : 'Add to my skills'}<ArrowUpRight size={15} /></button></form></div>
  </section>
}
