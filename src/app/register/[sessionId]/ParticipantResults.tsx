'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface QuestionResult {
  id: string
  question_text: string
  order_index: number
  top3_results: { name: string; rank: number }[]
}

const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function ParticipantResults({ sessionId }: { sessionId: string }) {
  const [questions, setQuestions] = useState<QuestionResult[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('questions')
      .select('id, question_text, order_index, top3_results')
      .eq('session_id', sessionId)
      .order('order_index')
      .then(({ data }) => {
        setQuestions(data ?? [])
        setLoading(false)
      })
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4 text-3xl">
          🏆
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Session Results</h2>
        <p className="text-gray-400 text-sm">Top picks from your group</p>
      </div>

      <div className="space-y-5">
        {questions?.map((q, qi) => (
          <div key={q.id} className="bg-gray-50 rounded-2xl p-5">
            <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-1">
              Question {qi + 1}
            </p>
            <p className="text-sm font-semibold text-gray-800 mb-4">{q.question_text}</p>

            {q.top3_results.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-2">No answers recorded</p>
            ) : (
              <div className="space-y-2">
                {q.top3_results.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm"
                  >
                    <span className="text-xl w-7 shrink-0">{medals[entry.rank] ?? medals[i + 1]}</span>
                    <span className="font-medium text-gray-800">{entry.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
