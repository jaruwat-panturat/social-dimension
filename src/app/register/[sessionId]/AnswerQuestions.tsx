'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Question {
  id: string
  question_text: string
  order_index: number
}

interface Participant {
  id: string
  name: string
}

// localStorage: store full selections per question so we can pre-fill on back
const storageKey = (sessionId: string, participantId: string) =>
  `answers_${sessionId}_${participantId}`

function getAllSaved(sessionId: string, participantId: string): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(storageKey(sessionId, participantId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveAnswer(sessionId: string, participantId: string, questionId: string, selected: string[]) {
  const all = getAllSaved(sessionId, participantId)
  all[questionId] = selected
  localStorage.setItem(storageKey(sessionId, participantId), JSON.stringify(all))
}

function getSaved(sessionId: string, participantId: string, questionId: string): string[] {
  return getAllSaved(sessionId, participantId)[questionId] ?? []
}

export default function AnswerQuestions({
  sessionId,
  participantId,
  participantName,
}: {
  sessionId: string
  participantId: string
  participantName: string
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const [
        { data: qs, error: qsError },
        { data: ps },
      ] = await Promise.all([
        supabase
          .from('questions')
          .select('id, question_text, order_index')
          .eq('session_id', sessionId)
          .order('order_index', { ascending: true }),
        supabase
          .from('participants')
          .select('id, name')
          .eq('session_id', sessionId)
          .neq('id', participantId)
          .order('registered_at', { ascending: true }),
      ])

      if (qsError || !qs || qs.length === 0) {
        setError('Could not load questions. Please refresh the page.')
        setLoading(false)
        return
      }

      const saved = getAllSaved(sessionId, participantId)
      const answeredIds = new Set(Object.keys(saved))

      setQuestions(qs)
      setParticipants(ps ?? [])

      const firstUnanswered = qs.findIndex((q) => !answeredIds.has(q.id))
      if (firstUnanswered === -1) {
        setDone(true)
      } else {
        setCurrentIndex(firstUnanswered)
        setSelected(saved[qs[firstUnanswered].id] ?? [])
      }

      setLoading(false)
    }

    load()
  }, [sessionId, participantId])

  function goToQuestion(index: number) {
    setCurrentIndex(index)
    setSelected(getSaved(sessionId, participantId, questions[index].id))
    setError(null)
  }

  function toggleParticipant(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  async function handleSubmit() {
    if (selected.length !== 3 || submitting) return

    setSubmitting(true)
    setError(null)
    const question = questions[currentIndex]
    const supabase = createClient()

    // Upsert so editing a previous answer works correctly
    const { error: upsertError } = await supabase.from('answers').upsert(
      {
        question_id: question.id,
        participant_id: participantId,
        selected_participant_1: selected[0],
        selected_participant_2: selected[1],
        selected_participant_3: selected[2],
      },
      { onConflict: 'question_id,participant_id' }
    )

    if (upsertError) {
      setError('Could not save your answer. Please try again.')
      setSubmitting(false)
      return
    }

    saveAnswer(sessionId, participantId, question.id, selected)

    const saved = getAllSaved(sessionId, participantId)
    const allAnswered = questions.every((q) => saved[q.id])

    if (allAnswered && currentIndex === questions.length - 1) {
      setDone(true)
    } else {
      // Advance to next unanswered, or next in sequence
      const nextUnanswered = questions.findIndex((q, i) => i > currentIndex && !saved[q.id])
      const next = nextUnanswered !== -1 ? nextUnanswered : currentIndex + 1
      if (next >= questions.length) {
        setDone(true)
      } else {
        goToQuestion(next)
      }
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error && questions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Could not load questions</h2>
        <p className="text-gray-400 text-sm mb-5">There was a problem fetching the session data.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          Refresh
        </button>
      </div>
    )
  }

  if (done) {
    const saved = getAllSaved(sessionId, participantId)
    return (
      <div className="py-6">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">All done!</h2>
          <p className="text-gray-500 text-sm">
            You&apos;ve answered all {questions.length} question{questions.length !== 1 ? 's' : ''}.
          </p>
        </div>

        {/* Answer summary with edit links */}
        <div className="space-y-2 mb-6">
          {questions.map((q, i) => {
            const picks = saved[q.id] ?? []
            const pickNames = picks.map(
              (id) => participants.find((p) => p.id === id)?.name ?? '?'
            )
            const ORDINAL_COLORS = ['text-amber-600', 'text-slate-500', 'text-orange-700']
            return (
              <div key={q.id} className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Q{i + 1}</p>
                  <button
                    onClick={() => { setDone(false); goToQuestion(i) }}
                    className="text-xs text-brand-500 hover:text-brand-700 font-medium shrink-0"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-2">{q.question_text}</p>
                <div className="flex flex-col gap-1">
                  {pickNames.map((name, rank) => (
                    <span key={rank} className={`text-xs font-semibold ${ORDINAL_COLORS[rank]}`}>
                      {['1', '2', '3'][rank]} — {name}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 text-sm text-brand-700">
          <p className="font-medium mb-0.5">Sit tight, {participantName}</p>
          <p className="text-brand-400 text-xs">The facilitator will present the results shortly</p>
        </div>
      </div>
    )
  }

  const question = questions[currentIndex]
  const saved = getAllSaved(sessionId, participantId)
  const answeredCount = questions.filter((q) => saved[q.id]).length
  const progress = (answeredCount / questions.length) * 100
  const isEditing = !!saved[question.id]

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
          <span className="font-medium">
            Question {currentIndex + 1} of {questions.length}
            {isEditing && <span className="ml-1.5 text-brand-500">(editing)</span>}
          </span>
          <span className={selected.length === 3 ? 'font-semibold' : ''}>
            {selected.length === 0 && <span className="text-gray-400">– picked</span>}
            {selected.length > 0 && (
              <span className="flex items-center gap-1">
                {selected.length >= 1 && <span className="text-amber-500 font-semibold">1</span>}
                {selected.length >= 2 && <><span className="text-gray-300">·</span><span className="text-slate-500 font-semibold">2</span></>}
                {selected.length >= 3 && <><span className="text-gray-300">·</span><span className="text-orange-700 font-semibold">3</span></>}
                <span className="text-gray-400 font-normal ml-0.5">picked</span>
              </span>
            )}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 leading-snug mb-1">
          {question.question_text}
        </h3>
        <p className="text-sm text-gray-400">
          {selected.length === 0 && 'Pick your 1st choice'}
          {selected.length === 1 && 'Now pick your 2nd choice'}
          {selected.length === 2 && 'Now pick your 3rd choice'}
          {selected.length === 3 && 'Tap a name to change your picks'}
        </p>
      </div>

      {/* Participant grid */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {participants.map((p) => {
          const rank = selected.indexOf(p.id)
          const isSelected = rank !== -1
          const isDisabled = !isSelected && selected.length >= 3

          const RANKS = [
            { label: '1', badge: 'bg-amber-400 text-white',  card: 'border-amber-400 bg-amber-50 text-amber-800' },
            { label: '2', badge: 'bg-slate-400 text-white',  card: 'border-slate-400 bg-slate-50 text-slate-700' },
            { label: '3', badge: 'bg-orange-700 text-white', card: 'border-orange-700 bg-orange-50 text-orange-900' },
          ]
          const rankStyle = isSelected ? RANKS[rank] : null

          return (
            <button
              key={p.id}
              onClick={() => toggleParticipant(p.id)}
              disabled={isDisabled}
              className={`relative flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                rankStyle
                  ? rankStyle.card
                  : isDisabled
                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:bg-brand-50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                  rankStyle ? rankStyle.badge : 'border-2 border-gray-300 text-transparent'
                }`}
              >
                {rankStyle ? rankStyle.label : '·'}
              </div>
              <span className="truncate">{p.name}</span>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {currentIndex > 0 && (
          <button
            onClick={() => goToQuestion(currentIndex - 1)}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
            Back
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={selected.length !== 3 || submitting}
          className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : isEditing && done ? (
            'Save & finish'
          ) : currentIndex === questions.length - 1 ? (
            'Finish'
          ) : (
            <>
              {isEditing ? 'Save & next' : 'Next'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
