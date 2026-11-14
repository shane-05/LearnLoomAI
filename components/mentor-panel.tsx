'use client'

import { useState } from 'react'
import { useSWRConfig } from 'swr'
import useSWR from 'swr'
import { ArrowUp, MessageCircle, Plus, Sparkles, UserRound } from 'lucide-react'

type Conversation = { id: string; title: string; created_at: string; updated_at: string }
type Message = { id: string; role: 'user' | 'assistant'; content: string; agent_type: string | null; created_at: string }
type ApiError = { error: string }
const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url)
  const data = await response.json()
  if (!response.ok) throw new Error((data as ApiError).error || 'Could not load mentor data.')
  return data as T
}

export default function MentorPanel({ userId, onSignIn, onNotice }: { userId: string | null; onSignIn: () => void; onNotice: (message: string) => void }) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const { mutate: globalMutate } = useSWRConfig()
  const { data: conversationData, error: conversationError, isLoading: conversationsLoading } = useSWR<{ conversations: Conversation[] }>(userId ? '/api/mentor' : null, fetcher)
  const { data: threadData, error: threadError, isLoading: threadLoading, mutate: mutateThread } = useSWR<{ messages: Message[] }>(userId && conversationId ? `/api/mentor?conversation_id=${conversationId}` : null, fetcher)
  const conversations = conversationData?.conversations ?? []
  const messages = threadData?.messages ?? []

  async function createConversation() {
    if (!userId) { onSignIn(); return }
    setSending(true)
    try {
      const response = await fetch('/api/mentor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create' }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setConversationId(data.conversation.id)
      setSuggestions([])
      await globalMutate('/api/mentor')
    } catch (error) {
      onNotice(error instanceof Error ? error.message : 'A new conversation could not be created.')
    } finally { setSending(false) }
  }

  async function sendMessage(text = draft) {
    const messageText = text.trim()
    if (!userId) { onSignIn(); return }
    if (!messageText || sending) return
    setDraft('')
    setSending(true)
    setSuggestions([])
    try {
      const response = await fetch('/api/mentor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'message', conversation_id: conversationId, message: messageText }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setConversationId(data.conversation_id)
      setSuggestions(data.suggested_questions ?? [])
      await Promise.all([globalMutate('/api/mentor'), mutateThread()])
    } catch (error) {
      setDraft(messageText)
      onNotice(error instanceof Error ? error.message : 'Your mentor could not respond. Please try again.')
    } finally { setSending(false) }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return <section className="page-stack"><div className="page-heading-row"><div><p className="eyebrow">A THOUGHTFUL LEARNING PARTNER</p><h1>AI Mentor</h1><p className="muted">Ask questions, get unstuck, and learn at your own pace.</p></div><button className="journey-button" onClick={createConversation} disabled={sending}><Plus size={15} />New conversation</button></div>
    {!userId ? <div className="surface module-placeholder"><div className="mentor-welcome"><span className="mentor-orbit"><Sparkles size={22} /></span><div><span className="eyebrow">PRIVATE BY DESIGN</span><h2>Your learning companion</h2><p>Sign in to ask questions and save your conversations securely to your account.</p><button className="primary-button" onClick={onSignIn}>Sign in to continue</button></div></div></div> : <div className="mentor-workspace surface"><aside className="conversation-list"><div className="conversation-list-heading"><span className="eyebrow">YOUR CONVERSATIONS</span><button className="icon-button" aria-label="Start a new conversation" onClick={createConversation}><Plus size={16} /></button></div>{conversationsLoading ? <p className="conversation-status">Loading conversations…</p> : conversationError ? <p className="conversation-status error">{conversationError.message}</p> : conversations.length ? conversations.map((conversation) => <button key={conversation.id} className={`conversation-item ${conversationId === conversation.id ? 'active' : ''}`} onClick={() => { setConversationId(conversation.id); setSuggestions([]) }}><MessageCircle size={15} /><span>{conversation.title}</span></button>) : <p className="conversation-status">Your saved conversations will appear here.</p>}</aside>
      <div className="mentor-thread"><div className="thread-heading"><span className="mentor-symbol"><Sparkles size={16} /></span><div><strong>LearnLoom Mentor</strong><span>Career and learning support</span></div><span className="privacy-chip"><span className="status-dot" />Private</span></div>
        {threadError ? <div className="thread-empty"><span className="empty-icon"><MessageCircle size={20} /></span><h2>Mentor storage needs setup</h2><p>{threadError.message}</p></div> : !conversationId || !messages.length ? <div className="thread-empty"><span className="empty-icon"><Sparkles size={20} /></span><h2>What are you working through?</h2><p>Your mentor uses the learning details you’ve shared to make suggestions more relevant.</p>{userId && <div className="suggestion-chips">{['How should I start learning this skill?', 'Can you explain a concept step by step?', 'Help me choose a small practice project.'].map((item) => <button key={item} onClick={() => void sendMessage(item)} disabled={sending}>{item}</button>)}</div>}</div> : <div className="message-list" aria-live="polite">{threadLoading ? <p className="conversation-status">Loading conversation…</p> : messages.map((message) => <article className={`mentor-message ${message.role}`} key={message.id}><span className="message-avatar">{message.role === 'assistant' ? <Sparkles size={14} /> : <UserRound size={14} />}</span><div><span className="message-author">{message.role === 'assistant' ? 'LearnLoom Mentor' : 'You'}</span><p>{message.content}</p>{message.agent_type && <span className="agent-tag">{message.agent_type.replaceAll('-', ' ')}</span>}</div></article>)}{sending && <div className="mentor-message assistant"><span className="message-avatar"><Sparkles size={14} /></span><div><span className="message-author">LearnLoom Mentor</span><p className="typing-indicator">Thinking through this with you<span> · · ·</span></p></div></div>}{suggestions.length > 0 && <div className="suggestion-chips follow-up">{suggestions.map((item) => <button key={item} onClick={() => void sendMessage(item)} disabled={sending}>{item}</button>)}</div>}</div>}
        <form className="mentor-composer" onSubmit={(event) => { event.preventDefault(); void sendMessage() }}><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a question or share what you’re learning…" rows={2} maxLength={4000} aria-label="Message your AI Mentor" disabled={!userId || sending} /><div className="composer-footer"><span>Enter to send · Shift + Enter for a new line</span><button className="send-button" type="submit" disabled={!draft.trim() || sending} aria-label="Send message"><ArrowUp size={17} /></button></div></form>
      </div></div>}
  </section>
}
