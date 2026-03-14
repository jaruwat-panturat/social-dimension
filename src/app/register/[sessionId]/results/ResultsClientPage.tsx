'use client'

import { useEffect, useState } from 'react'
import ParticipantResults from '../ParticipantResults'

export default function ResultsClientPage({
  sessionId,
  sessionStatus,
}: {
  sessionId: string
  sessionStatus: string
}) {
  const [participantId, setParticipantId] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    const stored = localStorage.getItem(`participant_${sessionId}`)
    setParticipantId(stored ?? null)
  }, [sessionId])

  // Still reading localStorage
  if (participantId === undefined) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (sessionStatus !== 'closed') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4 text-3xl">
          ⏳
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Results not available yet</h2>
        <p className="text-gray-400 text-sm">Come back once the facilitator closes the session.</p>
      </div>
    )
  }

  if (!participantId) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-3xl">
          🔒
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Results are private</h2>
        <p className="text-gray-400 text-sm">Only participants who joined this session can view the results.</p>
      </div>
    )
  }

  return <ParticipantResults sessionId={sessionId} />
}
