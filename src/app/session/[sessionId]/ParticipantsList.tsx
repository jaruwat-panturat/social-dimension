'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Participant {
  id: string
  name: string
  registered_at: string
}

export default function ParticipantsList({ sessionId, initialParticipants }: { sessionId: string; initialParticipants: Participant[] }) {
  const [participants, setParticipants] = useState(initialParticipants)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

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
            return [...prev, p]
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Participants</h2>
          <p className="text-xs text-gray-400 mt-0.5">Updates in real-time as people join</p>
        </div>
        <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
          {participants.length}
        </span>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-medium text-gray-400">No participants yet</p>
          <p className="text-xs mt-0.5 text-gray-300">Share the registration link to get started</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {participants.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                newIds.has(p.id) ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
              }`}
            >
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-indigo-600">{p.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-gray-800 flex-1">{p.name}</span>
              <span className="text-xs text-gray-400">#{i + 1}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
