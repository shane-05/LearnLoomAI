import LearnLoomApp from '@/components/learnloom-app'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const emptyData = {
    profile: null,
    skills: [],
    tasks: [],
    roadmaps: [],
    careers: [],
    requirements: [],
    resources: [],
    opportunities: [],
    attempts: [],
    progress: [],
    loadError: null as string | null,
  }

  if (!user) {
    const { data: careers, error } = await supabase.from('career_roles').select('id, title, category, description, required_skills').order('title')
    return <LearnLoomApp user={null} initialData={{ ...emptyData, careers: careers ?? [], loadError: error ? 'Career paths could not be loaded. Please refresh to retry.' : null }} />
  }

  const [profileResult, skillsResult, tasksResult, careersResult, roadmapsResult, requirementsResult, attemptsResult, progressResult, resourcesResult, opportunitiesResult] = await Promise.all([
    supabase.from('profiles').select('id, display_name, target_career').eq('id', user.id).maybeSingle(),
    supabase.from('user_skills').select('id, name, category, proficiency, evidence, verification_status, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('roadmap_tasks').select('id, roadmap_id, title, description, stage, position, estimated_minutes, completed_at, due_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('career_roles').select('id, title, category, description, required_skills').order('title'),
    supabase.from('learning_roadmaps').select('id, career_id, title, status, created_at, updated_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('career_requirements').select('career_id, skill_name, required_proficiency, weight').order('career_id'),
    supabase.from('assessment_attempts').select('id, topic, difficulty, score, total_questions, correct_answers, completed_at').eq('user_id', user.id).order('completed_at', { ascending: false }),
    supabase.from('progress_logs').select('id, event_type, entity_id, details, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12),
    supabase.from('learning_resources').select('id, title, description, url, resource_type, skill_id, verified, created_at').order('created_at', { ascending: false }).limit(4),
    supabase.from('opportunities').select('id, title, organization, category, description, application_url, deadline, eligibility, verified, created_at').order('deadline', { ascending: true }).limit(30),
  ])
  let profile = profileResult.data
  let profileProvisionFailed = false
  if (!profile && !profileResult.error && process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const result = await admin.from('profiles').upsert({ id: user.id, display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '' }, { onConflict: 'id' }).select('id, display_name, target_career').single()
    profile = result.data
    profileProvisionFailed = Boolean(result.error)
  }
  const { data: roleData } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  const errors = [profileResult.error, skillsResult.error, tasksResult.error, careersResult.error, roadmapsResult.error, requirementsResult.error, attemptsResult.error, progressResult.error, resourcesResult.error, opportunitiesResult.error].filter(Boolean)

  return (
    <LearnLoomApp
      user={{ id: user.id, email: user.email ?? '' }}
      isAdmin={roleData?.role === 'admin'}
      isBootstrapAdmin={Boolean(user.email_confirmed_at && process.env.LEARNLOOM_INITIAL_ADMIN_EMAIL?.trim().toLowerCase() === user.email?.trim().toLowerCase())}
      initialData={{
        profile,
        skills: skillsResult.data ?? [],
        tasks: tasksResult.data ?? [],
        roadmaps: roadmapsResult.data ?? [],
        careers: careersResult.data ?? [],
        requirements: requirementsResult.data ?? [],
        resources: resourcesResult.data ?? [],
        opportunities: opportunitiesResult.data ?? [],
        attempts: attemptsResult.data ?? [],
        progress: progressResult.data ?? [],
        loadError: errors.length || profileProvisionFailed ? 'Some learning data could not be loaded. Please refresh to retry.' : null,
      }}
    />
  )
}
