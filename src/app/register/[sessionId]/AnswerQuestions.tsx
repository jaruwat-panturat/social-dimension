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
      const [{ data: qs }, { data: ps }, { data: answers }] = await Promise.all([
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
        supabase
          .from('answers')
          .select('question_id')
          .eq('participant_id', participantId),
      ])

      const answeredIds = new Set(answers?.map((a) => a.question_id) ?? [])
      const allQuestions = qs ?? []

      setQuestions(allQuestions)
      setParticipants(ps ?? [])

      const firstUnanswered = allQuestions.findIndex((q) => !answeredIds.has(q.id))
      if (firstUnanswered === -1) {
        setDone(true)
      } else {
        setCurrentIndex(firstUnanswered)
      }

      setLoading(false)
    }

    load()
  }, [sessionId, participantId])

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

    const { error: insertError } = await supabase.from('answers').insert({
      question_id: question.id,
      participant_id: participantId,
      selected_participant_1: selected[0],
      selected_participant_2: selected[1],
      selected_participant_3: selected[2],
    })

    if (insertError) {
      setError('Could not save your answer. Please try again.')
      setSubmitting(false)
      return
    }

    const next = currentIndex + 1
    if (next >= questions.length) {
      setDone(true)
    } else {
      setCurrentIndex(next)
      setSelected([])
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">All done!</h2>
        <p className="text-gray-500 text-sm mb-6">
          You&apos;ve answered all {questions.length} question{questions.length !== 1 ? 's' : ''}.
        </p>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-700">
          <p className="font-medium mb-0.5">Sit tight, {participantName}</p>
          <p className="text-indigo-400 text-xs">The facilitator will present the results shortly</p>
        </div>
      </div>
    )
  }

  const question = questions[currentIndex]
  const progress = (currentIndex / questions.length) * 100

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
          <span className="font-medium">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className={selected.length === 3 ? 'font-semibold' : ''}>
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
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
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
          const rank = selected.indexOf(p.id) // -1 if not selected
          const isSelected = rank !== -1
          const isDisabled = !isSelected && selected.length >= 3

          const RANKS = [
            { label: '1st', badge: 'bg-amber-400 text-white',  card: 'border-amber-400 bg-amber-50 text-amber-800' },
            { label: '2nd', badge: 'bg-slate-400 text-white',  card: 'border-slate-400 bg-slate-50 text-slate-700' },
            { label: '3rd', badge: 'bg-orange-700 text-white', card: 'border-orange-700 bg-orange-50 text-orange-900' },
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
                  : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                  rankStyle
                    ? rankStyle.badge
                    : 'border-2 border-gray-300 text-transparent'
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

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={selected.length !== 3 || submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : currentIndex === questions.length - 1 ? (
          'Finish'
        ) : (
          <>
            Next
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}
