'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Participant {
  id: string
  name: string
  registered_at: string
}

export default function ParticipantsList({
  sessionId,
  initialParticipants,
  onCountChange,
  status,
  questionCount,
}: {
  sessionId: string
  initialParticipants: Participant[]
  onCountChange?: (count: number) => void
  status: string
  questionCount: number
}) {
  const [participants, setParticipants] = useState(initialParticipants)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const [answerCounts, setAnswerCounts] = useState<Record<string, number>>({})

  // Subscribe to new participants joining
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`participants:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const p = payload.new as Participant
          setParticipants(prev => {
            if (prev.some(x => x.id === p.id)) return prev
            const next = [...prev, p]
            onCountChange?.(next.length)
            return next
          })
          setNewIds(prev => new Set(prev).add(p.id))
          setTimeout(() => {
            setNewIds(prev => {
              const next = new Set(prev)
              next.delete(p.id)
              return next
            })
          }, 2000)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  // Track answer completion when session is started
  useEffect(() => {
    if (status !== 'started' || participants.length === 0) return

    const supabase = createClient()
    const participantIds = participants.map(p => p.id)

    // Load initial answer counts
    supabase
      .from('answers')
      .select('participant_id')
      .in('participant_id', participantIds)
      .then(({ data }) => {
        if (!data) return
        const counts: Record<string, number> = {}
        for (const row of data) {
          counts[row.participant_id] = (counts[row.participant_id] ?? 0) + 1
        }
        setAnswerCounts(counts)
      })

    // Subscribe to new answers being submitted
    const channel = supabase
      .channel(`answers:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'answers' },
        (payload) => {
          const participantId = (payload.new as { participant_id: string }).participant_id
          if (!participantIds.includes(participantId)) return
          setAnswerCounts(prev => ({
            ...prev,
            [participantId]: (prev[participantId] ?? 0) + 1,
          }))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'answers' },
        // Updates don't change count — no-op needed
        () => {}
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [status, participants.length, sessionId])

  const isStarted = status === 'started'
  const completedCount = isStarted
    ? participants.filter(p => (answerCounts[p.id] ?? 0) >= questionCount).length
    : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Participants</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isStarted
              ? `${completedCount} of ${participants.length} completed`
              : 'Updates in real-time as people join'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isStarted && (
            <span className="text-sm font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">
              {completedCount}/{participants.length}
            </span>
          )}
          <span className="text-sm font-semibold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
            {participants.length}
          </span>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-medium text-gray-400">No participants yet</p>
          <p className="text-xs mt-0.5 text-gray-300">Share the registration link to get started</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {participants.map((p, i) => {
            const count = answerCounts[p.id] ?? 0
            const completed = isStarted && count >= questionCount
            const inProgress = isStarted && count > 0 && count < questionCount

            return (
              <li
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                  newIds.has(p.id) ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-brand-600">{p.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm font-medium text-gray-800 flex-1">{p.name}</span>

                {isStarted ? (
                  completed ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Done
                    </span>
                  ) : inProgress ? (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      {count}/{questionCount}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300">waiting</span>
                  )
                ) : (
                  <span className="text-xs text-gray-400">#{i + 1}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
