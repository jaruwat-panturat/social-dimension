'use client'

import { useState } from 'react'
import { updateSessionStatus } from './actions'
import LoadingOverlay from '@/components/LoadingOverlay'

const TRANSITIONS: Record<string, { label: string; next: string; color: string }[]> = {
  created: [
    { label: 'Open Registration', next: 'registration_open', color: 'bg-blue-600 hover:bg-blue-700' },
  ],
  registration_open: [
    { label: 'Start Session', next: 'started', color: 'bg-green-600 hover:bg-green-700' },
    { label: 'Close Registration', next: 'created', color: 'bg-gray-500 hover:bg-gray-600' },
  ],
  started: [
    { label: 'Close Session', next: 'closed', color: 'bg-red-500 hover:bg-red-600' },
  ],
  closed: [],
}

export default function SessionControls({ sessionId, initialStatus }: { sessionId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus)
  const [busy, setBusy] = useState(false)

  const actions = TRANSITIONS[status] ?? []

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
        <p className="text-sm text-gray-400">This session is closed. No further actions available.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {actions.map(({ label, next, color }) => (
            <button
              key={next}
              onClick={() => handleTransition(next)}
              disabled={busy}
              className={`${color} text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
