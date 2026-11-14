'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useSWRConfig } from 'swr'
import { ArrowLeft, ArrowRight, Check, CircleHelp, FileCheck2, LoaderCircle, RotateCcw } from 'lucide-react'

type Question = { id: string; question: string; options: string[] }
type Detail = { question_id: string; selected_option: number; correct_option: number; explanation: string; is_correct: boolean }
type Attempt = { id: string; topic: string; difficulty: string; score: number; total_questions: number; correct_answers: number; completed_at: string }
type ApiError = { error: string }
const fetcher = async <T,>(url: string): Promise<T> => { const response = await fetch(url); const data = await response.json(); if (!response.ok) throw new Error((data as ApiError).error || 'Could not load assessments.'); return data as T }

export default function AssessmentPanel({ userId, onSignIn }: { userId: string | null; onSignIn: () => void }) {
  const [topic, setTopic] = useState('JavaScript')
  const [difficulty, setDifficulty] = useState('beginner')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ attempt: Attempt; details: Detail[]; questions: Question[] } | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { mutate: globalMutate } = useSWRConfig()
  const { data: history, error: historyError, mutate: mutateHistory } = useSWR<{ attempts: Attempt[] }>(userId ? '/api/assessments?history=1' : null, fetcher)

  async function startQuiz() {
    setBusy(true); setError(''); setResult(null); setAnswers({})
    try {
      const data = await fetcher<{ questions: Question[] }>(`/api/assessments?topic=${encodeURIComponent(topic)}&difficulty=${encodeURIComponent(difficulty)}`)
      setQuestions(data.questions)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Assessment could not be started.') }
    finally { setBusy(false) }
  }

  async function submitQuiz(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (Object.keys(answers).length !== questions.length) { setError('Choose an answer for each question before submitting.'); return }
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/assessments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, difficulty, answers }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Assessment result could not be saved.')
      setResult({ attempt: data.attempt, details: data.details, questions })
      setQuestions([])
      await Promise.all([mutateHistory(), globalMutate('/api/assessments?history=1')])
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Assessment result could not be saved.') }
    finally { setBusy(false) }
  }

  return <section className="page-stack"><div className="page-heading-row"><div><p className="eyebrow">CHECK WHAT’S CLICKING</p><h1>Assessments</h1><p className="muted">Short, focused check-ins to help you learn what to practice next.</p></div></div>
    {!userId ? <div className="surface module-placeholder"><div className="empty-state"><span className="empty-icon"><FileCheck2 size={20} /></span><h2>Your progress, your record</h2><p>Sign in to take an assessment and keep your results with your learning profile.</p><button className="primary-button" onClick={onSignIn}>Sign in to continue</button></div></div> : <div className="assessment-layout"><div className="assessment-main surface">{result ? <div className="assessment-result"><span className="result-mark"><Check size={20} /></span><span className="eyebrow">ASSESSMENT SAVED</span><h2>{result.attempt.score}%</h2><p className="result-caption">{result.attempt.correct_answers} of {result.attempt.total_questions} correct · {topic} · {difficulty}</p><div className="result-details">{result.details.map((detail, index) => { const question = result.questions.find((item) => item.id === detail.question_id); return <div className="result-detail" key={detail.question_id}><span className={`answer-mark ${detail.is_correct ? 'correct' : 'incorrect'}`}>{detail.is_correct ? <Check size={13} /> : <CircleHelp size={13} />}</span><div><strong>{question?.question ?? `Question ${index + 1}`}</strong><p>{detail.explanation}</p></div></div> })}</div><button className="primary-button" onClick={() => { setResult(null); setAnswers({}) }}>Take another assessment <RotateCcw size={14} /></button></div> : questions.length ? <form className="quiz-form" onSubmit={submitQuiz}><div className="quiz-topline"><span className="eyebrow">{topic.toUpperCase()} · {difficulty.toUpperCase()}</span><span>{Object.keys(answers).length} / {questions.length} answered</span></div><h2>Take a moment with each one.</h2>{questions.map((item, index) => <fieldset className="quiz-question" key={item.id}><legend><span>0{index + 1}</span>{item.question}</legend><div className="answer-options">{item.options.map((option, optionIndex) => <label className={`answer-option ${answers[item.id] === optionIndex ? 'chosen' : ''}`} key={option}><input type="radio" name={item.id} checked={answers[item.id] === optionIndex} onChange={() => setAnswers((current) => ({ ...current, [item.id]: optionIndex }))} /><span className="answer-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span></label>)}</div></fieldset>)}{error && <p className="form-message" role="alert">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Saving result…' : 'Submit assessment'}<ArrowRight size={14} /></button></form> : <div className="quiz-start"><span className="empty-icon"><FileCheck2 size={21} /></span><span className="eyebrow">A MOMENT TO CHECK IN</span><h2>Practice makes progress.</h2><p>Your answer key stays on the server until you submit. Results are saved to your private learning history.</p><div className="quiz-selectors"><label className="field"><span>Topic</span><select value={topic} onChange={(event) => setTopic(event.target.value)}><option>JavaScript</option><option>SQL</option><option>React</option></select></label><label className="field"><span>Difficulty</span><select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label></div>{error && <p className="form-message" role="alert">{error}</p>}<button className="primary-button" onClick={startQuiz} disabled={busy}>{busy ? <LoaderCircle className="spin" size={15} /> : null}Start assessment <ArrowRight size={14} /></button></div>}</div>
      <aside className="assessment-history surface"><div className="section-heading"><div><span className="eyebrow">YOUR RECORD</span><h2>Recent assessments</h2></div></div>{historyError ? <div className="assessment-history-error" role="alert">{historyError.message}</div> : history?.attempts.length ? <div className="attempt-list">{history.attempts.map((attempt) => <article className="attempt-row" key={attempt.id}><span className="attempt-score">{Math.round(attempt.score)}%</span><div><strong>{attempt.topic}</strong><p>{attempt.difficulty} · {attempt.correct_answers}/{attempt.total_questions} correct</p></div><span className="attempt-date">{new Date(attempt.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></article>)}</div> : <div className="empty-inline"><CircleHelp size={17} /><span>Your completed assessments will appear here.</span></div>}</aside></div>}
  </section>
}
