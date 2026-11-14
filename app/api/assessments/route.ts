import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const quizBank = {
  JavaScript: {
    beginner: [
      { id: 'js-b-1', question: 'Which keyword declares a block-scoped variable that can be reassigned?', options: ['const', 'let', 'static', 'define'], answer: 1, explanation: '`let` creates a block-scoped binding that can be reassigned.' },
      { id: 'js-b-2', question: 'What does `Array.prototype.map()` return?', options: ['The original array only', 'A new transformed array', 'A boolean', 'The first matching element'], answer: 1, explanation: '`map()` creates a new array from the values returned by its callback.' },
      { id: 'js-b-3', question: 'Which value is strictly equal to `undefined`?', options: ['null', '0', 'undefined', 'false'], answer: 2, explanation: 'Strict equality compares both value and type; `undefined === undefined` is true.' },
    ],
    intermediate: [
      { id: 'js-i-1', question: 'What does an `async` function always return?', options: ['A generator', 'A Promise', 'An iterator', 'A callback'], answer: 1, explanation: 'An async function always returns a Promise, which resolves with its return value.' },
      { id: 'js-i-2', question: 'What is a closure?', options: ['A function that retains access to its lexical scope', 'A Promise rejection handler', 'An object without a prototype', 'A module export'], answer: 0, explanation: 'A closure combines a function with references to its surrounding lexical environment.' },
      { id: 'js-i-3', question: 'Which statement about `Promise.all` is correct?', options: ['It resolves when the first promise resolves', 'It rejects if any input promise rejects', 'It runs callbacks sequentially', 'It ignores rejected promises'], answer: 1, explanation: '`Promise.all` rejects as soon as one of its input promises rejects.' },
    ],
    advanced: [
      { id: 'js-a-1', question: 'When does a microtask typically run?', options: ['After the next animation frame', 'After the current call stack empties, before the next task', 'Only after network idle', 'Before the current call stack empties'], answer: 1, explanation: 'The microtask queue is drained after the current stack and before the next task is processed.' },
      { id: 'js-a-2', question: 'What does `Object.freeze()` do to an object?', options: ['Deep-freezes all nested objects', 'Prevents extensions and makes own data properties non-writable and non-configurable', 'Serializes the object', 'Removes its prototype'], answer: 1, explanation: '`Object.freeze` is shallow: it affects the object itself, not nested objects.' },
      { id: 'js-a-3', question: 'What is the main purpose of `AbortController` in browser APIs?', options: ['Cancel supported asynchronous operations', 'Retry a failed fetch', 'Pause the JavaScript event loop', 'Clear a cache'], answer: 0, explanation: 'An AbortSignal can be passed to APIs such as fetch to cancel supported operations.' },
    ],
  },
  SQL: {
    beginner: [
      { id: 'sql-b-1', question: 'Which clause filters rows before grouping?', options: ['ORDER BY', 'HAVING', 'WHERE', 'LIMIT'], answer: 2, explanation: '`WHERE` filters source rows before grouping and aggregation.' },
      { id: 'sql-b-2', question: 'Which keyword removes duplicate rows from a result?', options: ['UNIQUE', 'DISTINCT', 'SINGLE', 'DEDUP'], answer: 1, explanation: '`SELECT DISTINCT` removes duplicate result rows.' },
      { id: 'sql-b-3', question: 'Which join returns matching rows from both tables?', options: ['INNER JOIN', 'CROSS JOIN', 'FULL JOIN', 'SELF JOIN'], answer: 0, explanation: '`INNER JOIN` returns rows with matching join conditions on both sides.' },
    ],
    intermediate: [
      { id: 'sql-i-1', question: 'What does `HAVING` filter?', options: ['Rows before aggregation', 'Groups after aggregation', 'Column names', 'Indexes'], answer: 1, explanation: '`HAVING` filters groups after `GROUP BY` and aggregation.' },
      { id: 'sql-i-2', question: 'What is a window function useful for?', options: ['Deleting partitions', 'Calculating across related rows without collapsing them', 'Creating a new database', 'Encrypting a table'], answer: 1, explanation: 'Window functions calculate over related rows while preserving each output row.' },
      { id: 'sql-i-3', question: 'Which constraint ensures each value in a column is unique?', options: ['CHECK', 'DEFAULT', 'UNIQUE', 'NOT NULL'], answer: 2, explanation: 'A `UNIQUE` constraint prevents duplicate values in the constrained column(s).' },
    ],
    advanced: [
      { id: 'sql-a-1', question: 'Why use a transaction with `SERIALIZABLE` isolation?', options: ['To allow all write conflicts', 'To make concurrent transactions behave as if run serially', 'To disable rollback', 'To force table locks for every query'], answer: 1, explanation: 'Serializable isolation guarantees an outcome equivalent to some serial transaction order.' },
      { id: 'sql-a-2', question: 'What is the main purpose of a partial index?', options: ['Index only rows matching a predicate', 'Index a query result once', 'Create a temporary table', 'Prevent all updates'], answer: 0, explanation: 'A partial index stores entries only for rows matching its predicate.' },
      { id: 'sql-a-3', question: 'What does a foreign key primarily enforce?', options: ['A sort order', 'Referential integrity', 'Query caching', 'Column encryption'], answer: 1, explanation: 'A foreign key ensures referenced values correspond to rows in the related table.' },
    ],
  },
  React: {
    beginner: [
      { id: 'react-b-1', question: 'What is the purpose of a React key in a list?', options: ['Add CSS styling', 'Help React identify items between renders', 'Create a route', 'Store component state'], answer: 1, explanation: 'Stable keys help React match list items when the list changes.' },
      { id: 'react-b-2', question: 'Which hook stores local component state?', options: ['useEffect', 'useMemo', 'useState', 'useContext'], answer: 2, explanation: '`useState` adds state to a function component.' },
      { id: 'react-b-3', question: 'What is a React prop?', options: ['Input passed to a component', 'A CSS selector', 'A database row', 'A React lifecycle event'], answer: 0, explanation: 'Props are read-only inputs passed from a parent component.' },
    ],
    intermediate: [
      { id: 'react-i-1', question: 'When is `useEffect` typically used?', options: ['To synchronize with an external system', 'To compute a value from props', 'To declare a component', 'To style an element'], answer: 0, explanation: '`useEffect` synchronizes a component with external systems such as subscriptions or browser APIs.' },
      { id: 'react-i-2', question: 'Why should state updates use a functional updater when based on previous state?', options: ['To avoid stale state in queued updates', 'To force a remount', 'To disable batching', 'To skip rendering'], answer: 0, explanation: 'An updater function receives the latest pending state, which avoids stale captured values.' },
      { id: 'react-i-3', question: 'What does lifting state up accomplish?', options: ['Moves shared state to a common ancestor', 'Moves state into CSS', 'Turns props into context', 'Persists state to a database'], answer: 0, explanation: 'A common owner can coordinate state used by multiple child components.' },
    ],
    advanced: [
      { id: 'react-a-1', question: 'What is the primary goal of `useTransition`?', options: ['Mark updates as non-urgent', 'Persist a component', 'Replace all effects', 'Batch network requests'], answer: 0, explanation: '`useTransition` marks state updates as non-urgent so urgent interactions can remain responsive.' },
      { id: 'react-a-2', question: 'What does hydration attach to server-rendered markup?', options: ['Event handling and client-side behavior', 'A database connection', 'CSS variables', 'A new document'], answer: 0, explanation: 'Hydration attaches React behavior and event handlers to existing server-rendered HTML.' },
      { id: 'react-a-3', question: 'What is a reason to use `useSyncExternalStore`?', options: ['Subscribe to an external store consistently with concurrent rendering', 'Memoize every callback', 'Create a server action', 'Store a ref'], answer: 0, explanation: 'It provides a supported subscription interface for external stores.' },
    ],
  },
} as const

const requestSchema = z.object({ topic: z.enum(['JavaScript', 'SQL', 'React']), difficulty: z.enum(['beginner', 'intermediate', 'advanced']), answers: z.record(z.string(), z.number().int().min(0).max(3)).optional() }).strict()
const isMissingSchema = (code: string) => ['42P01', 'PGRST205', 'PGRST204'].includes(code)
type Topic = keyof typeof quizBank
type Difficulty = keyof (typeof quizBank)['JavaScript']

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to take an assessment.' }, { status: 401 })
  const url = new URL(request.url)
  if (url.searchParams.get('history') === '1') {
    const { data, error } = await supabase.from('assessment_attempts').select('id, topic, difficulty, score, total_questions, correct_answers, completed_at').eq('user_id', user.id).order('completed_at', { ascending: false }).limit(20)
    if (error) return isMissingSchema(error.code) ? NextResponse.json({ error: 'Assessment storage is not installed yet. Apply the LearnLoom schema migration to continue.' }, { status: 503 }) : NextResponse.json({ error: 'Assessment history could not be loaded.' }, { status: 500 })
    return NextResponse.json({ attempts: data })
  }
  const parsed = requestSchema.pick({ topic: true, difficulty: true }).safeParse({ topic: url.searchParams.get('topic'), difficulty: url.searchParams.get('difficulty') })
  if (!parsed.success) return NextResponse.json({ topics: Object.keys(quizBank), difficulties: ['beginner', 'intermediate', 'advanced'] })
  const questions = quizBank[parsed.data.topic as Topic][parsed.data.difficulty as Difficulty]
  return NextResponse.json({ topic: parsed.data.topic, difficulty: parsed.data.difficulty, questions: questions.map(({ id, question, options }) => ({ id, question, options })) })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to submit an assessment.' }, { status: 401 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }) }
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success || !parsed.data.answers) return NextResponse.json({ error: 'Assessment answers are invalid.' }, { status: 400 })

  const { topic, difficulty, answers } = parsed.data
  const questions = quizBank[topic][difficulty]
  if (Object.keys(answers).length !== questions.length || questions.some((question) => !(question.id in answers))) return NextResponse.json({ error: 'Submit an answer for each question.' }, { status: 400 })
  const correctAnswers = questions.filter((question) => answers[question.id] === question.answer).length
  const score = Math.round((correctAnswers / questions.length) * 100)
  const resultDetails = questions.map((question) => ({ question_id: question.id, selected_option: answers[question.id], correct_option: question.answer, explanation: question.explanation, is_correct: answers[question.id] === question.answer }))
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceKey || !supabaseUrl) return NextResponse.json({ error: 'Secure assessment storage is not configured.' }, { status: 503 })
  const admin = createAdminClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await admin.from('assessment_attempts').insert({ user_id: user.id, topic, difficulty, score, total_questions: questions.length, correct_answers: correctAnswers, answers: resultDetails }).select('id, topic, difficulty, score, total_questions, correct_answers, completed_at').single()
  if (error) return isMissingSchema(error.code) ? NextResponse.json({ error: 'Assessment storage is not installed yet. Apply the LearnLoom schema migration to continue.' }, { status: 503 }) : NextResponse.json({ error: 'Your assessment result could not be saved.' }, { status: 500 })
  await admin.from('progress_logs').insert({ user_id: user.id, event_type: 'assessment_completed', entity_id: data.id, details: { topic, difficulty, score } })
  if (score >= 80) {
    const { data: matchingSkill } = await admin.from('user_skills').select('id, proficiency').eq('user_id', user.id).ilike('name', topic).maybeSingle()
    if (matchingSkill) await admin.from('user_skills').update({ verification_status: 'verified', proficiency: Math.max(matchingSkill.proficiency ?? 0, 4) }).eq('id', matchingSkill.id).eq('user_id', user.id)
  }
  return NextResponse.json({ attempt: data, details: resultDetails }, { status: 201 })
}
