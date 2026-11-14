'use client'

import { useState } from 'react'
import { Check, Circle, Clock3, Plus, Route, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Task = { id: string; roadmap_id: string | null; title: string; stage: string; position: number; estimated_minutes: number; completed_at: string | null }
type Roadmap = { id: string; career_id: string | null; title: string; status: string }
const stages = ['Fundamentals', 'Core skills', 'Practical projects', 'Career preparation']

export default function RoadmapPanel({ userId, tasks: allTasks, roadmaps, career, careerId, onRefresh, onNotice }: { userId: string | null; tasks: Task[]; roadmaps: Roadmap[]; career: string | null; careerId: string | null; onRefresh: () => void; onNotice: (message: string) => void }) {
  const roadmap = roadmaps.find((item) => item.career_id === careerId) ?? null
  const tasks = allTasks.filter((task) => roadmap ? task.roadmap_id === roadmap.id : task.roadmap_id == null)
  const [title, setTitle] = useState('')
  const [stage, setStage] = useState(stages[0])
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const completed = tasks.filter((task) => task.completed_at).length
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0

  async function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!userId || !title.trim()) return
    setSaving(true)
    let roadmapId = roadmap?.id
    let createdRoadmapId: string | null = null
    if (!roadmapId) {
      const { data: createdRoadmap, error: roadmapError } = await supabase.from('learning_roadmaps').insert({ user_id: userId, career_id: careerId, title: career ? `${career} learning roadmap` : 'My learning roadmap' }).select('id').single()
      if (roadmapError || !createdRoadmap) { setSaving(false); onNotice('We couldn’t create your roadmap. Please try again.'); return }
      roadmapId = createdRoadmap.id
      createdRoadmapId = createdRoadmap.id
    }
    const position = allTasks.filter((task) => task.roadmap_id === roadmapId).length
    const { error } = await supabase.from('roadmap_tasks').insert({ user_id: userId, roadmap_id: roadmapId, position, title: title.trim(), stage, estimated_minutes: 30 })
    if (error && createdRoadmapId) await supabase.from('learning_roadmaps').delete().eq('id', createdRoadmapId).eq('user_id', userId)
    setSaving(false)
    if (error) { onNotice('We couldn’t add that step. Please try again.'); return }
    if (roadmap?.status === 'completed') await supabase.from('learning_roadmaps').update({ status: 'active' }).eq('id', roadmap.id).eq('user_id', userId)
    setTitle('')
    onRefresh()
    onNotice('Learning step added.')
  }

  async function toggleTask(task: Task) {
    const completedAt = task.completed_at ? null : new Date().toISOString()
    const { error } = await supabase.from('roadmap_tasks').update({ completed_at: completedAt }).eq('id', task.id).eq('user_id', userId ?? '')
    if (error) { onNotice('We couldn’t update that step. Please try again.'); return }
    if (roadmap) {
      const allComplete = tasks.filter((item) => item.id !== task.id).every((item) => Boolean(item.completed_at)) && Boolean(completedAt)
      await supabase.from('learning_roadmaps').update({ status: allComplete ? 'completed' : 'active' }).eq('id', roadmap.id).eq('user_id', userId ?? '')
    }
    onRefresh()
  }

  return <section className="page-stack"><div className="page-heading-row"><div><p className="eyebrow">YOUR NEXT CHAPTER</p><h1>Learning roadmap</h1><p className="muted">A flexible path shaped by the direction you choose.</p></div><span className="result-count"><Route size={14} />{tasks.length} steps</span></div>
    <div className="roadmap-overview surface"><div className="roadmap-overview-copy"><span className="roadmap-orbit"><Route size={19} /></span><div><span className="eyebrow">CURRENT DIRECTION</span><h2>{career || 'Choose a career direction'}</h2><p>{tasks.length ? `${completed} of ${tasks.length} learning steps completed` : 'Add a few learning steps to begin shaping your journey.'}</p></div></div><div className="roadmap-progress"><strong>{tasks.length ? `${percent}%` : '—'}</strong><div className="progress-track"><div className="progress-fill" style={{ width: `${percent}%` }} /></div><span>roadmap progress</span></div></div>
    <div className="roadmap-body"><div className="timeline">{stages.map((currentStage, index) => { const items = tasks.filter((task) => task.stage === currentStage); return <section className="timeline-stage" key={currentStage}><div className={`stage-marker ${items.length ? 'has-items' : ''}`}>{items.every((task) => task.completed_at) && items.length ? <Check size={14} /> : <span>{String(index + 1).padStart(2, '0')}</span>}</div><div className="timeline-content"><div className="stage-title"><div><span className="eyebrow">STAGE {String(index + 1).padStart(2, '0')}</span><h2>{currentStage}</h2></div><span className="stage-count">{items.length || '—'} {items.length === 1 ? 'step' : 'steps'}</span></div>{items.length ? <div className="roadmap-tasks">{items.map((task) => <article className={`roadmap-task ${task.completed_at ? 'is-complete' : ''}`} key={task.id}><button className="task-check" onClick={() => toggleTask(task)} aria-label={`${task.completed_at ? 'Reopen' : 'Complete'} ${task.title}`}>{task.completed_at ? <Check size={14} /> : <Circle size={15} />}</button><div><h3>{task.title}</h3><p><Clock3 size={13} />{task.estimated_minutes} min <span>·</span> {task.completed_at ? 'Completed' : 'In progress'}</p></div></article>)}</div> : <p className="stage-empty">Your learning steps for this stage will appear here.</p>}</div></section> })}</div>
      <form className="add-step-form" onSubmit={addTask}><span className="form-icon"><Plus size={16} /></span><h2>Add a learning step</h2><p>Keep your next move small and specific.</p><label className="field"><span>What will you work on?</span><input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Build a responsive landing page" /></label><label className="field"><span>Stage</span><select value={stage} onChange={(event) => setStage(event.target.value)}>{stages.map((item) => <option key={item}>{item}</option>)}</select></label><button className="primary-button full-button" disabled={saving || !userId}>{saving ? 'Saving…' : 'Add to my roadmap'}<Sparkles size={15} /></button></form>
    </div>
  </section>
}
