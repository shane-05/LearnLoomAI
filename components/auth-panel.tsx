'use client'

import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type AuthPanelProps = { onClose: () => void }

export default function AuthPanel({ onClose }: AuthPanelProps) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'reset'>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const supabase = createClient()

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setBusy(true)
    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
            data: { display_name: name.trim() },
          },
        })
        if (error) throw error
        setMessage('Check your inbox for a confirmation link. Your account will be ready once your email is verified.')
      } else if (mode === 'reset') {
        const resetRedirect = new URL(process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? '/auth/callback', window.location.origin)
        resetRedirect.searchParams.set('next', '/auth/update-password')
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: resetRedirect.toString(),
        })
        if (error) throw error
        setMessage('If an account matches that email, a password reset link is on its way.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        window.location.reload()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : ''
      if (mode === 'sign-in' && /confirm|verified/.test(errorMessage)) {
        setMessage('Please confirm your email using the link we sent before signing in.')
      } else if (mode === 'sign-up' && /password/.test(errorMessage)) {
        setMessage('Choose a stronger password and try again.')
      } else if (mode === 'sign-up' && /already|registered/.test(errorMessage)) {
        setMessage('Unable to create an account with those details. Try signing in or use a different email.')
      } else {
        setMessage(mode === 'sign-in' ? 'Invalid email or password. If you recently signed up, confirm your email first or use Forgot password to reset it.' : 'We could not complete that request. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  const isSignUp = mode === 'sign-up'
  const isReset = mode === 'reset'
  return (
    <div className="auth-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button auth-back" onClick={onClose} aria-label="Close sign-in dialog"><ArrowLeft size={18} /></button>
        <div className="auth-mark"><span className="brand-mark"><i /><i /><i /><i /></span></div>
        <p className="eyebrow">LEARNLOOM AI</p>
        <h1 id="auth-title">{isReset ? 'Reset your password' : isSignUp ? 'Start your journey' : 'Welcome back'}</h1>
        <p className="muted auth-subtitle">{isReset ? 'We’ll send a secure reset link to your inbox.' : isSignUp ? 'A little direction can change everything.' : 'Your learning journey is right where you left it.'}</p>
        <form className="auth-form" onSubmit={submit}>
          {isSignUp && <label className="field"><span>Your name</span><div className="field-input"><UserRound size={17} /><input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Jordan Lee" /></div></label>}
          <label className="field"><span>Email address</span><div className="field-input"><Mail size={17} /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div></label>
          {!isReset && <label className="field"><span>Password</span><div className="field-input"><LockKeyhole size={17} /><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" /><button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>}
          {message && <p className="form-message" role="status">{message}</p>}
          <button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? <LoaderCircle className="spin" size={16} /> : null}{isReset ? 'Send reset link' : isSignUp ? 'Create account' : 'Sign in'}<span aria-hidden="true">→</span></button>
        </form>
        <div className="auth-links">
          {mode === 'sign-in' && <button className="text-button" onClick={() => { setMode('reset'); setMessage('') }}>Forgot password?</button>}
          <p>{isSignUp ? 'Already have an account?' : 'New to LearnLoom?'} <button className="text-button" onClick={() => { setMode(isSignUp ? 'sign-in' : 'sign-up'); setMessage('') }}>{isSignUp ? 'Sign in' : 'Create an account'}</button></p>
          {isReset && <button className="text-button back-to-login" onClick={() => { setMode('sign-in'); setMessage('') }}>Back to sign in</button>}
        </div>
        <p className="privacy-note">Your learning data stays private and belongs to you.</p>
      </section>
    </div>
  )
}
