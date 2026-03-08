'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteSession } from './actions'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function DeleteSession({ sessionId, sessionName }: { sessionId: string; sessionName: string }) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    setBusy(true)
    await deleteSession(sessionId)
    router.push('/dashboard')
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="text-sm text-red-400 hover:text-red-600 font-medium transition-colors"
      >
        Delete session
      </button>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4">
      {busy && <LoadingOverlay />}
      <p className="text-sm text-red-700">
        Permanently delete <span className="font-semibold">"{sessionName}"</span>? This removes all questions, participants and answers.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => setShowConfirm(false)}
          disabled={busy}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors"
        >
          {busy ? 'Deleting…' : 'Yes, delete'}
        </button>
      </div>
    </div>
  )
}
