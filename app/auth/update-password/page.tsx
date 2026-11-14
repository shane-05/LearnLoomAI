'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) { setMessage('We couldn’t update your password. Request a new reset link and try again.'); return }
    setMessage('Your password has been updated.')
    window.setTimeout(() => router.replace('/'), 900)
  }

  return <main className="reset-page"><form className="profile-form surface" onSubmit={submit}><span className="eyebrow">LEARNLOOM AI</span><h1>Choose a new password</h1><p>Use at least eight characters to secure your account.</p><label className="field"><span>New password</span><input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message && <p role="status" className="form-message">{message}</p>}<button type="submit" className="primary-button" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button></form></main>
}
