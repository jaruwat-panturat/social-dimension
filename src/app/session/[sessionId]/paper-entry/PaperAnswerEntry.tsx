'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { recomputeTop3 } from '../actions'

interface Question {
  id: string
  question_text: string
  order_index: number
}

interface Participant {
  id: string
  name: string
}

const RANKS = [
  { label: '1st', badge: 'bg-amber-400 text-white',  card: 'border-amber-400 bg-amber-50 text-amber-800' },
  { label: '2nd', badge: 'bg-slate-400 text-white',  card: 'border-slate-400 bg-slate-50 text-slate-700' },
  { label: '3rd', badge: 'bg-orange-700 text-white', card: 'border-orange-700 bg-orange-50 text-orange-900' },
]

export default function PaperAnswerEntry({
  sessionId,
  sessionStatus,
  participants,
  questions,
  initialParticipantId,
}: {
  sessionId: string
  sessionStatus: string
  participants: Participant[]
  questions: Question[]
  initialParticipantId?: string
}) {
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [saved, setSaved] = useState<Record<string, string[]>>({})
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-select participant if provided via URL
  useEffect(() => {
    if (!initialParticipantId) return
    const p = participants.find(x => x.id === initialParticipantId)
    if (p) handleSelectParticipant(p)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSelectParticipant(p: Participant) {
    setLoading(true)
    const supabase = createClient()
    const { data: existing } = await supabase
      .from('answers')
      .select('question_id, selected_participant_1, selected_participant_2, selected_participant_3')
      .eq('participant_id', p.id)
      .in('question_id', questions.map(q => q.id))

    const savedAnswers: Record<string, string[]> = {}
    for (const a of (existing ?? [])) {
      savedAnswers[a.question_id] = [
        a.selected_participant_1,
        a.selected_participant_2,
        a.selected_participant_3,
      ].filter(Boolean) as string[]
    }

    setSaved(savedAnswers)
    setSelectedParticipant(p)
    setDone(false)
    setError(null)

    const firstUnanswered = questions.findIndex(q => !savedAnswers[q.id])
    if (firstUnanswered === -1) {
      setDone(true)
      setCurrentIndex(0)
      setSelected([])
    } else {
      setCurrentIndex(firstUnanswered)
      setSelected(savedAnswers[questions[firstUnanswered].id] ?? [])
    }
    setLoading(false)
  }

  function goToQuestion(index: number) {
    setCurrentIndex(index)
    setSelected(saved[questions[index].id] ?? [])
    setError(null)
  }

  function toggleParticipant(id: string) {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 3) return prev
      return [...prev, id]
    })
  }

  async function handleSubmit() {
    if (selected.length !== 3 || submitting || !selectedParticipant) return
    setSubmitting(true)
    setError(null)

    const question = questions[currentIndex]
    const supabase = createClient()
    const { error: upsertError } = await supabase.from('answers').upsert(
      {
        question_id: question.id,
        participant_id: selectedParticipant.id,
        selected_participant_1: selected[0],
        selected_participant_2: selected[1],
        selected_participant_3: selected[2],
      },
      { onConflict: 'question_id,participant_id' }
    )

    if (upsertError) {
      setError('Could not save. Please try again.')
      setSubmitting(false)
      return
    }

    const newSaved = { ...saved, [question.id]: selected }
    setSaved(newSaved)

    const allAnswered = questions.every(q => newSaved[q.id])
    if (allAnswered) {
      // Only recompute top3 when session is already closed
      if (sessionStatus === 'closed') {
        await recomputeTop3(sessionId)
      }
      setDone(true)
    } else {
      const next = questions.findIndex((q, i) => i > currentIndex && !newSaved[q.id])
      goToQuestion(next !== -1 ? next : currentIndex + 1)
    }
    setSubmitting(false)
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  // ── Participant picker ──────────────────────────────────────────────────────
  if (!selectedParticipant) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Select participant</h2>
        <p className="text-sm text-gray-400 mb-5">Choose whose answers you want to enter.</p>
        <ul className="space-y-2">
          {participants.map(p => (
            <li key={p.id}>
              <button
                onClick={() => handleSelectParticipant(p)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 hover:bg-brand-50 hover:border-brand-200 border border-transparent transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-brand-600">{p.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-gray-800">{p.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const otherParticipants = participants.filter(p => p.id !== selectedParticipant.id)

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">All answers saved</h2>
        <p className="text-gray-400 text-sm mb-6">
          Answers for <span className="font-semibold text-gray-700">{selectedParticipant.name}</span> have been recorded.
        </p>
        <button
          onClick={() => { setSelectedParticipant(null); setSaved({}); setSelected([]) }}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          Enter for another participant
        </button>
      </div>
    )
  }

  // ── Answer entry ─────────────────────────────────────────────────────────────
  const question = questions[currentIndex]
  const answeredCount = questions.filter(q => saved[q.id]).length
  const progress = (answeredCount / questions.length) * 100
  const isEditing = !!saved[question.id]

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      {/* Participant header */}
      <div className="flex items-center gap-2 mb-5 pb-5 border-b border-gray-100">
        <button
          onClick={() => { setSelectedParticipant(null); setSaved({}); setSelected([]) }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-brand-600">{selectedParticipant.name.charAt(0).toUpperCase()}</span>
        </div>
        <span className="text-sm font-semibold text-gray-800">{selectedParticipant.name}</span>
        <span className="ml-auto text-xs text-gray-400">{answeredCount}/{questions.length} answered</span>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
          <span className="font-medium">
            Question {currentIndex + 1} of {questions.length}
            {isEditing && <span className="ml-1.5 text-brand-500">(editing)</span>}
          </span>
          <span>
            {selected.length === 0 && <span className="text-gray-400">– picked</span>}
            {selected.length > 0 && (
              <span className="flex items-center gap-1">
                {selected.length >= 1 && <span className="text-amber-500 font-semibold">1st</span>}
                {selected.length >= 2 && <><span className="text-gray-300">·</span><span className="text-slate-500 font-semibold">2nd</span></>}
                {selected.length >= 3 && <><span className="text-gray-300">·</span><span className="text-orange-700 font-semibold">3rd</span></>}
                <span className="text-gray-400 font-normal ml-0.5">picked</span>
              </span>
            )}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-brand-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 leading-snug mb-1">{question.question_text}</h3>
        <p className="text-sm text-gray-400">
          {selected.length === 0 && 'Pick 1st choice'}
          {selected.length === 1 && 'Pick 2nd choice'}
          {selected.length === 2 && 'Pick 3rd choice'}
          {selected.length === 3 && 'Tap a name to change picks'}
        </p>
      </div>

      {/* Participant grid */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        {otherParticipants.map(p => {
          const rank = selected.indexOf(p.id)
          const isSelected = rank !== -1
          const isDisabled = !isSelected && selected.length >= 3
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
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                rankStyle ? rankStyle.badge : 'border-2 border-gray-300 text-transparent'
              }`}>
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
          ) : currentIndex === questions.length - 1 ? (
            'Save & finish'
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
