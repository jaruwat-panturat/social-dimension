'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateSessionStatus } from './actions'
import LoadingOverlay from '@/components/LoadingOverlay'

const TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  created: [],
  registration_open: [
    { label: 'Start Session', next: 'started', color: 'bg-green-600 hover:bg-green-700' },
  ],
  started: [
    { label: 'Close Session', next: 'closed', color: 'bg-red-500 hover:bg-red-600' },
  ],
  closed: [],
}

export default function SessionControls({ sessionId, initialStatus, questionCount, participantCount, minParticipants }: { sessionId: string; initialStatus: string; questionCount: number; participantCount: number; minParticipants: number }) {
  const [status, setStatus] = useState(initialStatus)
  const [busy, setBusy] = useState(false)

  const actions = TRANSITIONS[status] ?? []
  const canStart = questionCount > 0 && participantCount >= minParticipants

  async function handleTransition(next: string) {
    setBusy(true)
    await updateSessionStatus(sessionId, next)
    setStatus(next)
    setBusy(false)
  }

  return (
    <div>
      {busy && <LoadingOverlay />}
      <h2 className="font-semibold text-gray-900 mb-4">Session Controls</h2>
      {actions.length === 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-gray-400">This session is closed.</p>
          <Link
            href={`/session/${sessionId}/participant-view`}
            className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <span>🏆</span> View Participant Results
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {actions.map(({ label, next, color }) => {
            const blocked = next === 'started' && !canStart
            return (
              <div key={next} className="flex items-center gap-2">
                <button
                  onClick={() => handleTransition(next)}
                  disabled={busy || blocked}
                  className={`${color} text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {label}
                </button>
                {blocked && (
                  <span className="text-xs text-amber-600 font-medium">
                    {questionCount === 0 && participantCount < minParticipants
                      ? `Need ${minParticipants} participants and at least 1 question`
                      : questionCount === 0
                      ? 'Add at least one question first'
                      : `Need ${minParticipants - participantCount} more participant${minParticipants - participantCount > 1 ? 's' : ''}`}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
