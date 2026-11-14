import assert from 'node:assert/strict'
import test from 'node:test'

const baseUrl = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000'
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#x27;')
}

async function appFetch(path, init = {}) {
  return fetch(new URL(path, baseUrl), { ...init, signal: AbortSignal.timeout(10_000) })
}

async function supabaseGet(table, columns = 'id') {
  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL is required')
  assert.ok(supabaseKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')

  return fetch(
    `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?select=${columns}&limit=1`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      signal: AbortSignal.timeout(10_000),
    },
  )
}

test('Supabase career data reaches the rendered LearnLoom dashboard', async () => {
  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL is required')
  assert.ok(supabaseKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')

  const careersResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, '')}/rest/v1/career_roles?select=id,title&order=title.asc&limit=1`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      signal: AbortSignal.timeout(10_000),
    },
  )
  assert.equal(careersResponse.status, 200, 'Supabase career_roles should be readable with the public key')

  const careers = await careersResponse.json()
  assert.ok(Array.isArray(careers) && careers.length > 0, 'Supabase should return at least one career role')
  assert.equal(typeof careers[0].title, 'string', 'career role should include a title')

  const pageResponse = await appFetch('/')
  assert.equal(pageResponse.status, 200, 'LearnLoom dashboard should respond successfully')
  const page = await pageResponse.text()
  assert.match(page, /Career explorer/, 'dashboard should render its career navigation')
  assert.ok(page.includes(escapeHtml(careers[0].title)), 'dashboard should render the title returned by Supabase')
})

test('Supabase Auth is reachable and new accounts require email confirmation', async () => {
  assert.ok(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL is required')
  assert.ok(supabaseKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')

  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/settings`, {
    headers: { apikey: supabaseKey },
    signal: AbortSignal.timeout(10_000),
  })
  assert.equal(response.status, 200, 'Supabase Auth settings should be reachable')
  const settings = await response.json()
  assert.equal(settings.disable_signup, false, 'sign-up should be enabled')
  assert.equal(settings.mailer_autoconfirm, false, 'new sign-ups must confirm their email before sign-in')
})

test('public catalogues used by the UI are readable from Supabase', async () => {
  const catalogues = [
    ['career_roles', 'id,title'],
    ['skills', 'id,name'],
    ['career_requirements', 'career_id,skill_name'],
    ['learning_resources', 'id,title'],
    ['opportunities', 'id,title'],
  ]

  for (const [table, columns] of catalogues) {
    const response = await supabaseGet(table, columns)
    assert.equal(response.status, 200, `${table} should be readable with the public key`)
    assert.ok(Array.isArray(await response.json()), `${table} should return a row array`)
  }
})

test('private learner tables do not expose data to the public key', async () => {
  const privateTables = [
    'profiles',
    'user_skills',
    'roadmap_tasks',
    'learning_roadmaps',
    'assessment_attempts',
    'progress_logs',
    'mentor_conversations',
    'mentor_messages',
    'opportunity_bookmarks',
  ]

  for (const table of privateTables) {
    const response = await supabaseGet(table)
    assert.ok([200, 401, 403].includes(response.status), `${table} should not return a server error`)
    if (response.status === 200) {
      const rows = await response.json()
      assert.ok(Array.isArray(rows), `${table} should return a row array`)
      assert.equal(rows.length, 0, `${table} must not expose another learner’s rows`)
    }
  }
})

test('all protected API methods reject requests without a signed-in session', async () => {
  const requests = [
    ['/api/assessments?topic=JavaScript&difficulty=beginner'],
    ['/api/assessments', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' }],
    ['/api/mentor'],
    ['/api/mentor', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'create' }) }],
    ['/api/admin/users'],
    ['/api/admin/users', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: '{}' }],
    ['/api/admin/bootstrap', { method: 'POST' }],
  ]

  for (const [path, init] of requests) {
    const response = await appFetch(path, init)
    assert.equal(response.status, 401, `${init?.method ?? 'GET'} ${path} should require authentication`)
  }
})
