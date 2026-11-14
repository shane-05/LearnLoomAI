'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowUpRight, Bell, BookOpen, BriefcaseBusiness, Check, ChevronDown, CircleHelp, Compass, FileCheck2, GitCompareArrows, GraduationCap, LayoutDashboard, LogOut, Moon, MoreHorizontal, PanelLeft, PanelLeftClose, Route, Search, Settings2, ShieldCheck, Sparkles, Sun, Target, TrendingUp, Waypoints, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import AuthPanel from '@/components/auth-panel'
import AssessmentPanel from '@/components/assessment-panel'
import AnalyticsPanel from '@/components/analytics-panel'
import OpportunitiesPanel from '@/components/opportunities-panel'
import ResourcesPanel from '@/components/resources-panel'
import CareerExplorer from '@/components/career-explorer'
import MentorPanel from '@/components/mentor-panel'
import RoadmapPanel from '@/components/roadmap-panel'
import SkillsPanel from '@/components/skills-panel'

type User = { id: string; email: string } | null
type Profile = { id: string; display_name: string; target_career: string | null } | null
type Skill = { id: string; name: string; category: string; proficiency: number | null; evidence: string | null; verification_status: string; created_at: string }
type Task = { id: string; roadmap_id: string | null; title: string; description: string | null; stage: string; position: number; estimated_minutes: number; completed_at: string | null; due_at: string | null; created_at: string }
type Career = { id: string; title: string; category: string; description: string; required_skills: string[] | null }
type Roadmap = { id: string; career_id: string | null; title: string; status: string; created_at: string; updated_at: string }
type Requirement = { career_id: string; skill_name: string; required_proficiency: number; weight: number }
type Attempt = { id: string; topic: string; difficulty: string; score: number; total_questions: number; correct_answers: number; completed_at: string }
type ProgressLog = { id: string; event_type: string; entity_id: string | null; details: Record<string, unknown>; created_at: string }
type Resource = { id: string; title: string; description: string | null; url: string; resource_type: string; verified: boolean; created_at: string }
type Opportunity = { id: string; title: string; organization: string; category: string; description: string | null; application_url: string; deadline: string | null; eligibility: string | null; verified: boolean; created_at: string }
type InitialData = { profile: Profile; skills: Skill[]; tasks: Task[]; roadmaps: Roadmap[]; careers: Career[]; requirements: Requirement[]; resources: Resource[]; opportunities: Opportunity[]; attempts: Attempt[]; progress: ProgressLog[]; loadError: string | null }
type Section = 'dashboard' | 'careers' | 'compare' | 'gaps' | 'skills' | 'roadmap' | 'resources' | 'assessments' | 'mentor' | 'opportunities' | 'analytics' | 'settings'

const navigation = [
  { title: 'OVERVIEW', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  { title: 'DISCOVER', items: [{ id: 'careers', label: 'Career explorer', icon: Compass }, { id: 'compare', label: 'Compare careers', icon: GitCompareArrows }, { id: 'gaps', label: 'Skill gap analysis', icon: Target }] },
  { title: 'LEARN', items: [{ id: 'skills', label: 'My skills', icon: Waypoints }, { id: 'roadmap', label: 'Learning roadmap', icon: Route }, { id: 'resources', label: 'Resources', icon: BookOpen }, { id: 'assessments', label: 'Assessments', icon: FileCheck2 }] },
  { title: 'GROW', items: [{ id: 'mentor', label: 'AI Mentor', icon: Sparkles }, { id: 'opportunities', label: 'Opportunities', icon: BriefcaseBusiness }, { id: 'analytics', label: 'Progress analytics', icon: TrendingUp }] },
]

function Brand() {
  return <div className="brand-lockup"><span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span><span className="brand-name">learnloom<span>AI</span></span></div>
}

function EmptyContent({ icon: Icon, title, description, action }: { icon: typeof BookOpen; title: string; description: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={21} /></span><h2>{title}</h2><p>{description}</p>{action}</div>
}

export default function LearnLoomApp({ user, initialData, isAdmin = false, isBootstrapAdmin = false }: { user: User; initialData: InitialData; isAdmin?: boolean; isBootstrapAdmin?: boolean }) {
  const [section, setSection] = useState<Section>('dashboard')
  const [authOpen, setAuthOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [notice, setNotice] = useState('')
  const [bootstrapBusy, setBootstrapBusy] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [careerChoice, setCareerChoice] = useState<string | null>(initialData.profile?.target_career ?? null)
  const [comparison, setComparison] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)')
    const updateViewport = () => {
      setIsMobile(media.matches)
      if (!media.matches) setMobileNav(false)
    }
    updateViewport()
    media.addEventListener('change', updateViewport)
    return () => media.removeEventListener('change', updateViewport)
  }, [])
  useEffect(() => {
    if (!isMobile || !mobileNav) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNav(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [isMobile, mobileNav])
  const profile = initialData.profile
  const skills = initialData.skills
  const tasks = initialData.tasks
  const careers = initialData.careers
  const completedTasks = tasks.filter((task) => Boolean(task.completed_at)).length
  const percentComplete = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : null
  const selectedCareer = careers.find((career) => career.title === (careerChoice ?? profile?.target_career)) ?? null
  const firstName = profile?.display_name?.trim().split(/\s+/)[0] || (user?.email ? user.email.split('@')[0] : '')
  const firstNameCapitalized = firstName ? `${firstName[0].toUpperCase()}${firstName.slice(1)}` : ''
  const readiness = useMemo(() => {
    const required = initialData.requirements.filter((requirement) => requirement.career_id === selectedCareer?.id)
    if (!required.length) return null
    const totalWeight = required.reduce((sum, requirement) => sum + Number(requirement.weight), 0)
    const reportedWeight = required.reduce((sum, requirement) => {
      const skill = skills.find((item) => item.name.toLowerCase() === requirement.skill_name.toLowerCase())
      return skill?.proficiency == null ? sum : sum + Number(requirement.weight)
    }, 0)
    return reportedWeight ? Math.round((reportedWeight / totalWeight) * 100) : null
  }, [selectedCareer, skills, initialData.requirements])

  function refresh() { router.refresh() }
  function inform(text: string) {
    setNotice(text)
    window.setTimeout(() => setNotice(''), 3200)
  }
  async function signOut() {
    await supabase.auth.signOut()
    window.location.reload()
  }
  async function bootstrapAdmin() {
    setBootstrapBusy(true)
    try {
      const response = await fetch('/api/admin/bootstrap', { method: 'POST' })
      const body = await response.json()
      if (!response.ok) { inform(body.error || 'Administrator setup could not be completed.'); return }
      inform('Administrator access is ready.')
      refresh()
    } catch {
      inform('Administrator setup could not be completed. Please try again.')
    } finally {
      setBootstrapBusy(false)
    }
  }
  async function selectCareer(title: string) {
    setCareerChoice(title)
    if (!user) { inform('Sign in to save your career direction.'); return }
    const { error } = await supabase.from('profiles').update({ target_career: title }).eq('id', user.id)
    if (error) inform('Your direction could not be saved yet. Please try again.')
    else { refresh(); inform(`${title} saved as your direction.`) }
  }
  function navigate(id: string) { setSection(id as Section); setMobileNav(false) }
  function toggleSidebar() {
    if (isMobile) setMobileNav((open) => !open)
    else setSidebarOpen((open) => !open)
  }
  const displayTitle: Record<Section, string> = { dashboard: 'Dashboard', careers: 'Career explorer', compare: 'Compare careers', gaps: 'Skill gap analysis', skills: 'My skills', roadmap: 'Learning roadmap', resources: 'Resources', assessments: 'Assessments', mentor: 'AI Mentor', opportunities: 'Opportunities', analytics: 'Progress analytics', settings: 'Settings' }

  async function updateName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!user) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get('display_name') ?? '').trim()
    const direction = String(form.get('target_career') ?? '').trim() || null
    const { error } = await supabase.from('profiles').update({ display_name: name, target_career: direction }).eq('id', user.id)
    if (error) { inform('We couldn’t save your profile. Please try again.'); return }
    setCareerChoice(direction)
    refresh()
    inform('Your profile has been updated.')
  }

  function renderSection() {
    if (section === 'careers') return <CareerExplorer careers={careers} selectedCareer={selectedCareer?.title ?? null} onSelectCareer={selectCareer} />
    if (section === 'skills') return <SkillsPanel userId={user?.id ?? null} skills={skills} onRefresh={refresh} onNotice={inform} />
    if (section === 'roadmap') return <RoadmapPanel userId={user?.id ?? null} tasks={tasks} roadmaps={initialData.roadmaps} career={selectedCareer?.title ?? null} careerId={selectedCareer?.id ?? null} onRefresh={refresh} onNotice={inform} />
    if (section === 'gaps') return <section className="page-stack"><div className="page-heading-row"><div><p className="eyebrow">MAKE YOUR NEXT MOVE COUNT</p><h1>Skill gap analysis</h1><p className="muted">A clear view of what’s known, and what still needs exploring.</p></div></div><div className="surface gap-panel"><div className="section-heading"><div><h2>{selectedCareer?.title ?? 'Choose a career direction'}</h2><p>Based on skills you have added to your profile.</p></div>{readiness !== null ? <span className="coverage-score">{readiness}%<small>reported coverage</small></span> : <span className="unreported-chip">Not enough data</span>}</div>{!selectedCareer ? <EmptyContent icon={Target} title="Start with a direction" description="Explore the career catalogue and choose a path to see its skill requirements." action={<button className="text-action" onClick={() => navigate('careers')}>Explore careers <ArrowRight size={15} /></button>} /> : <div className="gap-rows">{initialData.requirements.filter((requirement) => requirement.career_id === selectedCareer.id).map((requirement) => { const needed = requirement.skill_name; const own = skills.find((skill) => skill.name.toLowerCase() === needed.toLowerCase()); const source = own?.verification_status === 'verified' ? 'Assessment verified' : 'Self-reported'; const status = own?.proficiency == null ? 'Not reported' : own.proficiency >= requirement.required_proficiency ? `Meets level ${requirement.required_proficiency} · ${source}` : `Needs improvement · ${source}`; return <div className="gap-row" key={needed}><div><strong>{needed}</strong><span>{status}</span></div>{own?.proficiency != null ? <div className="mini-rating" aria-label={`${own.proficiency} of 5; required ${requirement.required_proficiency}`}>{Array.from({ length: 5 }, (_, index) => <i className={index < own.proficiency! ? 'filled' : ''} key={index} />)}</div> : <span className="unreported-chip">Not reported</span>}</div> })}{!initialData.requirements.some((requirement) => requirement.career_id === selectedCareer.id) && <p className="muted">Requirements haven’t been added for this role yet.</p>}</div>}</div></section>
    if (section === 'compare') return <ComparePanel careers={careers} selection={comparison} onChange={setComparison} />
    if (section === 'settings') return <section className="page-stack"><div className="page-heading-row"><div><p className="eyebrow">MAKE IT YOURS</p><h1>Profile & settings</h1><p className="muted">Your account details and learning direction.</p></div></div>{user ? <><form className="profile-form surface" onSubmit={updateName}><h2>Your profile</h2><p>Only you can view and change your personal learning details.</p><label className="field"><span>Display name</span><input name="display_name" defaultValue={profile?.display_name ?? firstNameCapitalized} autoComplete="name" /></label><label className="field"><span>Career direction</span><select name="target_career" defaultValue={profile?.target_career ?? ''}><option value="">Choose a direction</option>{careers.map((career) => <option key={career.id} value={career.title}>{career.title}</option>)}</select></label><button className="primary-button" type="submit">Save changes <ArrowRight size={15} /></button></form>{isBootstrapAdmin && !isAdmin && <div className="bootstrap-box"><span className="eyebrow">ONE-TIME ADMIN SETUP</span><p>This verified account matches the secure initial admin email configured for this project.</p><button className="primary-button" type="button" disabled={bootstrapBusy} onClick={() => void bootstrapAdmin()}>{bootstrapBusy ? 'Setting up…' : 'Set up first administrator'}<ShieldCheck size={15} /></button></div>}</> : <SignInNotice onSignIn={() => setAuthOpen(true)} />}</section>
    if (section === 'mentor') return <MentorPanel userId={user?.id ?? null} onSignIn={() => setAuthOpen(true)} onNotice={inform} />
    if (section === 'resources') return <ResourcesPanel />
    if (section === 'assessments') return <AssessmentPanel userId={user?.id ?? null} onSignIn={() => setAuthOpen(true)} />
    if (section === 'opportunities') return <OpportunitiesPanel userId={user?.id ?? null} onSignIn={() => setAuthOpen(true)} onNotice={inform} />
    if (section === 'analytics') return <AnalyticsPanel skills={skills} tasks={tasks} attempts={initialData.attempts} userId={user?.id ?? null} onSignIn={() => setAuthOpen(true)} />
    return <DashboardOverview user={user} profile={profile} greeting={firstNameCapitalized} skills={skills} tasks={tasks} progress={initialData.progress} careers={careers} selectedCareer={selectedCareer} readiness={readiness} percentComplete={percentComplete} completedTasks={completedTasks} onNavigate={navigate} onSignIn={() => setAuthOpen(true)} onToggleTask={(task) => toggleTask(task, user, supabase, refresh, inform)} />
  }

  return <main className={`dashboard-shell ${theme === 'dark' ? 'dark' : ''} ${!isMobile && !sidebarOpen ? 'sidebar-collapsed' : ''}`} data-theme={theme}><aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`} aria-hidden={isMobile ? !mobileNav : !sidebarOpen} inert={isMobile ? !mobileNav : !sidebarOpen}><div className="sidebar-brand"><Brand /><button className="icon-button mobile-close" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18} /></button></div><nav id="primary-navigation" className="sidebar-nav" aria-label="Main navigation">{navigation.map((group) => <div className="nav-group" key={group.title}><p className="nav-label">{group.title}</p>{group.items.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${section === id ? 'active' : ''}`} onClick={() => navigate(id as Section)} aria-current={section === id ? 'page' : undefined}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{id === 'mentor' && <span className="new-pill">NEW</span>}</button>)}</div>)}</nav><div className="sidebar-bottom">{isAdmin && <a className="nav-item" href="/admin"><ShieldCheck size={17} /><span>Admin dashboard</span></a>}<button className={`nav-item ${section === 'settings' ? 'active' : ''}`} onClick={() => navigate('settings')}><Settings2 size={17} /><span>Settings</span></button><a href="mailto:hello@learnloom.ai" className="nav-item"><CircleHelp size={17} /><span>Help & feedback</span></a><div className="sidebar-profile"><span className="avatar">{user ? firstNameCapitalized.slice(0, 1) || 'L' : 'L'}</span><div className="profile-summary"><strong>{user ? firstNameCapitalized || 'Learner' : 'Your learning space'}</strong><span>{user?.email ?? 'Sign in to save your progress'}</span></div>{user ? <button className="icon-button sidebar-more" onClick={signOut} aria-label="Sign out"><LogOut size={16} /></button> : <button className="icon-button sidebar-more" onClick={() => setAuthOpen(true)} aria-label="Sign in"><ArrowUpRight size={16} /></button>}</div></div></aside>
    {mobileNav && <button className="mobile-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation overlay" />}
    <div className="main-area"><header className="topbar"><div className="topbar-left"><button className="icon-button sidebar-toggle" onClick={toggleSidebar} aria-label={(isMobile ? mobileNav : sidebarOpen) ? 'Close sidebar' : 'Open sidebar'} aria-controls="primary-navigation" aria-expanded={isMobile ? mobileNav : sidebarOpen}>{(isMobile ? mobileNav : sidebarOpen) ? <PanelLeftClose size={19} /> : <PanelLeft size={19} />}</button><span className="breadcrumb-root">LearnLoom</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{displayTitle[section]}</span></div><div className="topbar-actions"><span className="date-label">YOUR LEARNING. YOUR DIRECTION.</span><button className="icon-button theme-toggle" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>{user ? <button className="top-avatar" aria-label="Open settings" onClick={() => navigate('settings')}>{firstNameCapitalized.slice(0, 1) || 'L'}</button> : <button className="top-signin" onClick={() => setAuthOpen(true)}>Sign in <ArrowUpRight size={15} /></button>}</div></header><div className="content-area">{initialData.loadError && <div className="data-warning" role="alert"><CircleHelp size={16} />{initialData.loadError}</div>}{renderSection()}</div><footer className="app-footer"><span>LEARNLOOM AI</span><span>Your learning. Your direction. Your future.</span><button onClick={() => navigate('settings')}>Profile & privacy <ArrowUpRight size={13} /></button></footer></div>
    {authOpen && <AuthPanel onClose={() => setAuthOpen(false)} />}{notice && <div className="toast-message" role="status"><Check size={16} />{notice}</div>}
  </main>
}

async function toggleTask(task: Task, user: User, supabase: ReturnType<typeof createClient>, refresh: () => void, inform: (text: string) => void) {
  if (!user) { inform('Sign in to save your learning progress.'); return }
  const completedAt = task.completed_at ? null : new Date().toISOString()
    const { error } = await supabase.from('roadmap_tasks').update({ completed_at: completedAt }).eq('id', task.id).eq('user_id', user.id)
  if (error) { inform('We couldn’t update that step. Please try again.'); return }
  refresh()
}

function SignInNotice({ onSignIn }: { onSignIn: () => void }) { return <div className="surface sign-in-notice"><span className="empty-icon"><ShieldCheck size={21} /></span><h2>Your profile, protected</h2><p>Sign in to edit your name and choose a learning direction. Personal details stay private to your account.</p><button className="primary-button" onClick={onSignIn}>Sign in <ArrowRight size={15} /></button></div> }

function DashboardOverview({ user, profile, greeting, skills, tasks, progress, careers, selectedCareer, readiness, percentComplete, completedTasks, onNavigate, onSignIn, onToggleTask }: { user: User; profile: Profile; greeting: string; skills: Skill[]; tasks: Task[]; progress: ProgressLog[]; careers: Career[]; selectedCareer: Career | null; readiness: number | null; percentComplete: number | null; completedTasks: number; onNavigate: (section: string) => void; onSignIn: () => void; onToggleTask: (task: Task) => void }) {
  const today = new Date()
  const salutation = today.getUTCHours() < 12 ? 'Good morning' : today.getUTCHours() < 18 ? 'Good afternoon' : 'Good evening'
  const nextTasks = tasks.filter((task) => !task.completed_at).slice(0, 3)
  const recentActivity = [
    ...skills.map((skill) => ({ id: `skill-${skill.id}`, label: `Added ${skill.name}`, date: skill.created_at })),
    ...tasks.map((task) => ({ id: `task-${task.id}`, label: task.completed_at ? `Completed ${task.title}` : `Added ${task.title}`, date: task.completed_at ?? task.created_at })),
    ...progress.map((item) => ({ id: `progress-${item.id}`, label: item.event_type === 'assessment_completed' ? `Completed ${String(item.details.topic ?? 'an')} assessment` : item.event_type === 'mentor_message' ? 'Asked the AI Mentor' : 'Learning activity recorded', date: item.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3)
  return <section className="page-stack dashboard-view"><div className="welcome-heading"><div><p className="eyebrow">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).toUpperCase()}</p><h1>{salutation}{greeting ? `, ${greeting}` : ''}.</h1><p className="muted">{user ? 'Here’s a little space to make your next move.' : 'Build skills. Discover direction. Shape your future.'}</p></div><button className="journey-button" onClick={() => user ? onNavigate('roadmap') : onSignIn()}>{user ? 'Continue learning' : 'Start your journey'}<ArrowRight size={15} /></button></div>
    {!user && <div className="welcome-banner"><div className="welcome-banner-copy"><span className="eyebrow">A PERSONAL PATH, BUILT AROUND YOU</span><h2>Your future isn’t one-size-fits-all.</h2><p>Discover career paths, make sense of the skills you already have, and grow toward what comes next.</p><button className="primary-button" onClick={() => onNavigate('careers')}>Explore career paths <ArrowRight size={15} /></button></div><div className="woven-art" aria-hidden="true"><span /><span /><span /><span /><i /><i /><i /></div></div>}
    {user ? <><div className="dashboard-grid"><section className="direction-card surface"><div className="card-overline"><span className="eyebrow">CAREER DIRECTION</span><Compass size={17} /></div>{selectedCareer ? <><span className="direction-kicker">YOUR NORTH STAR</span><h2>{selectedCareer.title}</h2><p>{selectedCareer.description}</p><div className="direction-metric"><div><span>Reported skill coverage</span><strong>{readiness === null ? '—' : `${readiness}%`}</strong></div><div className="direction-progress"><div className="progress-track"><div className="progress-fill" style={{ width: `${readiness ?? 0}%` }} /></div><span>{readiness === null ? 'Add relevant skills to calculate' : 'Based only on skills with reported proficiency'}</span></div></div><button className="inline-link" onClick={() => onNavigate('gaps')}>View skill gaps <ArrowUpRight size={15} /></button></> : <><div className="no-direction-mark"><Compass size={22} /></div><h2>Find a direction that feels like yours.</h2><p>Explore possibilities, then choose a path to see where your skills fit.</p><button className="inline-link" onClick={() => onNavigate('careers')}>Explore careers <ArrowUpRight size={15} /></button></>}</section>
      <section className="progress-card surface"><div className="card-overline"><span className="eyebrow">LEARNING PROGRESS</span><Route size={17} /></div><div className="progress-ring-row"><div className="progress-ring" style={{ '--progress': `${percentComplete ?? 0}%` } as React.CSSProperties}><div><strong>{percentComplete === null ? '—' : `${percentComplete}%`}</strong><span>complete</span></div></div><div className="progress-copy"><h2>{tasks.length ? 'Keep your momentum.' : 'Your path starts here.'}</h2><p>{tasks.length ? `${completedTasks} of ${tasks.length} learning steps finished.` : 'Build a roadmap with small, meaningful steps.'}</p><button className="inline-link" onClick={() => onNavigate('roadmap')}>{tasks.length ? 'Open roadmap' : 'Create your roadmap'} <ArrowUpRight size={15} /></button></div></div><div className="progress-card-bottom"><span>{tasks.length ? `${tasks.length} steps in your roadmap` : 'No learning steps yet'}</span><span className="status-dot" />{tasks.length ? 'In progress' : 'Ready when you are'}</div></section>
    </div><div className="dashboard-lower"><section className="today-section"><div className="section-heading"><div><span className="eyebrow">YOUR NEXT STEPS</span><h2>Today’s learning</h2></div><button className="icon-button" onClick={() => onNavigate('roadmap')} aria-label="Open your full roadmap"><ArrowUpRight size={17} /></button></div>{nextTasks.length ? <div className="today-list">{nextTasks.map((task, index) => <article className="today-task" key={task.id}><button className="task-check" onClick={() => onToggleTask(task)} aria-label={`Complete ${task.title}`}><Check size={14} /></button><div className="today-task-copy"><h3>{task.title}</h3><p>{task.stage} <span>·</span> {task.estimated_minutes} min</p></div><span className={`priority-tag priority-${index}`}>{index === 0 ? 'UP NEXT' : 'IN QUEUE'}</span></article>)}</div> : <div className="empty-inline"><span className="task-empty-icon"><BookOpen size={16} /></span><span>No learning steps planned yet. Add one to make today count.</span><button className="text-action" onClick={() => onNavigate('roadmap')}>Add a step <ArrowRight size={14} /></button></div>}</section>
      <aside className="mentor-card"><div className="mentor-topline"><span className="mentor-symbol"><Sparkles size={17} /></span><span className="mentor-label">YOUR AI MENTOR</span><MoreHorizontal size={17} /></div><h2>A little help goes a long way.</h2><p>Get unstuck, explore an idea, or find your next learning step.</p><button className="mentor-cta" onClick={() => onNavigate('mentor')}>Ask your mentor <ArrowUpRight size={15} /></button><div className="mentor-decoration" aria-hidden="true"><span /><span /><span /></div></aside></div>
      <div className="dashboard-bottom-row"><section className="skill-snapshot surface"><div className="section-heading"><div><span className="eyebrow">YOUR FOUNDATION</span><h2>Skills at a glance</h2></div><button className="inline-link" onClick={() => onNavigate('skills')}>Manage skills <ArrowUpRight size={14} /></button></div>{skills.length ? <div className="snapshot-skills">{skills.slice(0, 5).map((skill) => <div className="snapshot-skill" key={skill.id}><span>{skill.name}</span><span className="snapshot-level">{skill.proficiency == null ? 'Not rated' : `${skill.proficiency}/5`}</span></div>)}</div> : <p className="muted empty-snapshot">Skills you add will appear here. Unreported skills are never counted as zero.</p>}</section><section className="activity-card"><div className="section-heading"><div><span className="eyebrow">YOUR JOURNEY</span><h2>Recent activity</h2></div><span className="activity-count">{String(recentActivity.length).padStart(2, '0')}</span></div>{recentActivity.length ? <div className="activity-list">{recentActivity.map((activity) => <div className="activity-row" key={activity.id}><span className="activity-dot" /><span>{activity.label}</span><time dateTime={activity.date}>{new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</time></div>)}</div> : <p>Your recent skills and completed steps will appear here as you learn.</p>}<button className="inline-link" onClick={() => onNavigate(profile ? 'settings' : 'skills')}>{profile ? 'Update your profile' : 'Add your first skill'} <ArrowUpRight size={14} /></button></section></div></> : <section className="guest-explore"><div className="section-heading"><div><span className="eyebrow">A FEW PLACES TO BEGIN</span><h2>Explore what could be next</h2></div><button className="inline-link" onClick={() => onNavigate('careers')}>All career paths <ArrowUpRight size={14} /></button></div>{careers.length ? <div className="guest-careers">{careers.slice(0, 3).map((career) => <button className="guest-career" key={career.id} onClick={() => onNavigate('careers')}><span className="category-pill">{career.category}</span><strong>{career.title}</strong><span>{career.description}</span><ArrowUpRight size={15} /></button>)}</div> : <p className="muted">The career catalogue is loading from your connected account.</p>}</section>}
    </section>
}

function ComparePanel({ careers, selection, onChange }: { careers: Career[]; selection: string[]; onChange: (next: string[]) => void }) {
  const selected = careers.filter((career) => selection.includes(career.id))
  function toggle(id: string) { onChange(selection.includes(id) ? selection.filter((item) => item !== id) : selection.length < 2 ? [...selection, id] : [selection[1], id]) }
  const allSkills = Array.from(new Set(selected.flatMap((career) => career.required_skills ?? [])))
  return <section className="page-stack"><div className="page-heading-row"><div><p className="eyebrow">SEE THE DIFFERENCES</p><h1>Compare careers</h1><p className="muted">Compare real role requirements and choose a direction that fits.</p></div><span className="result-count">Select up to 2</span></div><div className="compare-selectors">{careers.map((career) => <button className={`compare-option ${selection.includes(career.id) ? 'chosen' : ''}`} onClick={() => toggle(career.id)} key={career.id}><span className="compare-check">{selection.includes(career.id) ? <Check size={13} /> : '+'}</span><span><strong>{career.title}</strong><small>{career.category}</small></span></button>)}</div>{selected.length ? <div className="surface comparison-table"><div className="comparison-header"><span>CAREER REQUIREMENTS</span>{selected.map((career) => <strong key={career.id}>{career.title}</strong>)}</div>{allSkills.map((skill) => <div className="comparison-row" key={skill}><span>{skill}</span>{selected.map((career) => <span key={career.id}>{career.required_skills?.includes(skill) ? <span className="requirement-tag">Required</span> : <span className="not-required">—</span>}</span>)}</div>)}{!allSkills.length && <p className="muted">Requirements have not been added to these roles yet.</p>}</div> : <div className="surface compare-hint"><GitCompareArrows size={19} /><p>Choose two careers to see where their skill requirements overlap.</p></div>}</section>
}
