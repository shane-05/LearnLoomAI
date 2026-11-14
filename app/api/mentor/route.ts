import { createClient as createAdminClient } from '@supabase/supabase-js'
import { Output, generateText } from 'ai'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { chooseSpecialist } from '@/lib/ai/orchestrator'

const mentorResponseSchema = z.object({
  reply: z.string().min(1).max(8000),
  suggestedQuestions: z.array(z.string().min(1).max(120)).max(3),
})
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('create') }).strict(),
  z.object({ action: z.literal('message'), conversation_id: z.string().uuid().nullable(), message: z.string().trim().min(1).max(4000) }).strict(),
])

function isMissingSchema(error: { code?: string }) {
  return ['42P01', 'PGRST205', 'PGRST204'].includes(error.code ?? '')
}

function unavailable() {
  return NextResponse.json({ error: 'Mentor storage is not available. Apply the LearnLoom database migration before starting a conversation.' }, { status: 503 })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to access your conversations.' }, { status: 401 })
  const url = new URL(request.url)
  const conversationId = url.searchParams.get('conversation_id')

  if (conversationId) {
    const parsed = z.string().uuid().safeParse(conversationId)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid conversation.' }, { status: 400 })
    const { data, error } = await supabase.from('mentor_messages').select('id, role, content, agent_type, created_at').eq('conversation_id', conversationId).eq('user_id', user.id).order('created_at', { ascending: true }).limit(80)
    if (error) return isMissingSchema(error) ? unavailable() : NextResponse.json({ error: 'Conversation history could not be loaded.' }, { status: 500 })
    return NextResponse.json({ messages: data })
  }

  const { data, error } = await supabase.from('mentor_conversations').select('id, title, created_at, updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(30)
  if (error) return isMissingSchema(error) ? unavailable() : NextResponse.json({ error: 'Conversations could not be loaded.' }, { status: 500 })
  return NextResponse.json({ conversations: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to start a conversation.' }, { status: 401 })

  let rawBody: unknown
  try { rawBody = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }) }
  const parsed = actionSchema.safeParse(rawBody)
  if (!parsed.success) return NextResponse.json({ error: 'Enter a message up to 4,000 characters.' }, { status: 400 })

  if (parsed.data.action === 'create') {
    const { data, error } = await supabase.from('mentor_conversations').insert({ user_id: user.id }).select('id, title, created_at, updated_at').single()
    if (error) return isMissingSchema(error) ? unavailable() : NextResponse.json({ error: 'A new conversation could not be created.' }, { status: 500 })
    return NextResponse.json({ conversation: data }, { status: 201 })
  }

  const { conversation_id: requestedConversationId, message } = parsed.data
  let conversationId = requestedConversationId
  let shouldSetConversationTitle = false
  if (conversationId) {
    const { data, error } = await supabase.from('mentor_conversations').select('id, title').eq('id', conversationId).eq('user_id', user.id).maybeSingle()
    if (error) return isMissingSchema(error) ? unavailable() : NextResponse.json({ error: 'Conversation could not be verified.' }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'That conversation was not found.' }, { status: 404 })
    shouldSetConversationTitle = data.title === 'New conversation'
  } else {
    const { data, error } = await supabase.from('mentor_conversations').insert({ user_id: user.id, title: message.slice(0, 68) }).select('id').single()
    if (error) return isMissingSchema(error) ? unavailable() : NextResponse.json({ error: 'A conversation could not be created.' }, { status: 500 })
    conversationId = data.id
  }

  const { error: saveUserMessageError } = await supabase.from('mentor_messages').insert({ conversation_id: conversationId, user_id: user.id, role: 'user', content: message })
  if (saveUserMessageError) return isMissingSchema(saveUserMessageError) ? unavailable() : NextResponse.json({ error: 'Your message could not be saved.' }, { status: 500 })

  const [{ data: profile }, { data: skills }, { data: tasks }, { data: messages }] = await Promise.all([
    supabase.from('profiles').select('display_name, target_career').eq('id', user.id).maybeSingle(),
    supabase.from('user_skills').select('name, proficiency, verification_status').eq('user_id', user.id).limit(25),
    supabase.from('roadmap_tasks').select('title, stage, completed_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(12),
    supabase.from('mentor_messages').select('role, content').eq('conversation_id', conversationId).eq('user_id', user.id).order('created_at', { ascending: false }).limit(13),
  ])
  const specialist = chooseSpecialist(message)
  const context = [
    profile?.display_name ? `Learner name: ${profile.display_name}` : '',
    profile?.target_career ? `Chosen career direction: ${profile.target_career}` : '',
    skills?.length ? `Learner-reported skills: ${skills.map((skill) => `${skill.name}${skill.proficiency == null ? '' : ` (${skill.proficiency}/5, ${skill.verification_status})`}`).join(', ')}` : '',
    tasks?.length ? `Stored learning steps: ${tasks.map((task) => `${task.title} — ${task.stage}${task.completed_at ? ' (completed)' : ''}`).join('; ')}` : '',
  ].filter(Boolean).join('\n') || 'No learner-specific profile information has been shared.'
  const history = (messages ?? []).reverse().slice(0, -1).slice(-12).map((item) => `${item.role === 'assistant' ? 'LearnLoom Mentor' : 'Learner'}: ${item.content}`).join('\n')

  let generated: z.infer<typeof mentorResponseSchema>
  try {
    const result = await generateText({
      model: 'google/gemini-3.8-flash',
      system: `${specialist.system}\n\nYou are part of LearnLoom AI, an educational and career guidance platform. Use only the learner context and conversation below. Do not invent personal records. Keep your answer warm, specific, and accessible. Do not provide medical, legal, or financial advice. Return a concise reply and up to three useful follow-up questions.\n\nLearner context:\n${context}`,
      prompt: `Conversation so far:\n${history}\n\nNew learner message:\n${message}`,
      output: Output.object({ schema: mentorResponseSchema }),
      maxOutputTokens: 900,
    })
    generated = result.output
  } catch {
    return NextResponse.json({ error: 'The AI Mentor could not respond right now. Your message is saved; please try again shortly.' }, { status: 502 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: 'Secure mentor storage is not configured.' }, { status: 503 })
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: assistantMessage, error: assistantError } = await admin.from('mentor_messages').insert({ conversation_id: conversationId, user_id: user.id, role: 'assistant', content: generated.reply, agent_type: specialist.id }).select('id, role, content, agent_type, created_at').single()
  if (assistantError) return NextResponse.json({ error: 'The mentor reply could not be saved securely.' }, { status: 500 })
  const conversationUpdate: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() }
  if (shouldSetConversationTitle) conversationUpdate.title = message.slice(0, 68)
  await admin.from('mentor_conversations').update(conversationUpdate).eq('id', conversationId).eq('user_id', user.id)
  await admin.from('progress_logs').insert({ user_id: user.id, event_type: 'mentor_message', entity_id: conversationId, details: { agent_type: specialist.id } })

  return NextResponse.json({ conversation_id: conversationId, message: assistantMessage, suggested_questions: generated.suggestedQuestions })
}
