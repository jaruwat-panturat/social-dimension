'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Participant {
  id: string
  name: string
  registered_at: string
}

export default function ParticipantsLive({
  sessionId,
  initialParticipants,
}: {
  sessionId: string
  initialParticipants: Participant[]
}) {
  const [participants, setParticipants] = useState(initialParticipants)

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
          setParticipants(prev => [...prev, payload.new as Participant])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900">Participants</h2>
        <span className="text-xs font-semibold bg-brand-100 text-brand-700 px-2.5 py-1 rounded-full">
          {participants.length} joined
        </span>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
          Waiting for participants…
        </div>
      ) : (
        <ol className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {participants.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{i + 1}</span>
              <span className="text-sm font-medium text-gray-800">{p.name}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
