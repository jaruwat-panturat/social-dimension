'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import AnswerQuestions from './AnswerQuestions'

interface Session {
  id: string
  name: string
  status: string
}

const storageKey = (sessionId: string) => `participant_${sessionId}`

export default function RegisterForm({ session }: { session: Session }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [participantName, setParticipantName] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')
  const [renameError, setRenameError] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState(session.status)

  useEffect(() => {
    const storedId = localStorage.getItem(storageKey(session.id))
    if (!storedId) {
      setLoading(false)
      return
    }

    const supabase = createClient()
    supabase
      .from('participants')
      .select('id, name')
      .eq('id', storedId)
      .eq('session_id', session.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setParticipantId(data.id)
          setParticipantName(data.name)
        } else {
          localStorage.removeItem(storageKey(session.id))
        }
        setLoading(false)
      })
  }, [session.id])

  // Listen for session status changes via realtime + polling fallback
  useEffect(() => {
    if (sessionStatus === 'started' || sessionStatus === 'closed') return

    const supabase = createClient()

    // Realtime (works once RLS policies are applied)
    const channel = supabase
      .channel(`session-status-${session.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${session.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as { status?: string }).status
          if (newStatus) setSessionStatus(newStatus)
        }
      )
      .subscribe()

    // Polling fallback every 4s — catches cases where realtime isn't firing
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('sessions')
        .select('status')
        .eq('id', session.id)
        .single()
      if (data?.status && data.status !== sessionStatus) {
        setSessionStatus(data.status)
      }
    }, 4000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [session.id, sessionStatus])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from('participants')
      .insert({ session_id: session.id, name: trimmed })
      .select('id')
      .single()

    if (insertError) {
      setError('Could not register. Please try again.')
      setLoading(false)
      return
    }

    localStorage.setItem(storageKey(session.id), data.id)
    setParticipantId(data.id)
    setParticipantName(trimmed)
    setLoading(false)
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === participantName) {
      setRenaming(false)
      return
    }

    setLoading(true)
    setRenameError(null)

    const storedId = localStorage.getItem(storageKey(session.id))
    if (!storedId) {
      setRenaming(false)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('participants')
      .update({ name: trimmed })
      .eq('id', storedId)
      .eq('session_id', session.id)

    if (updateError) {
      setRenameError('Could not update name. Please try again.')
      setLoading(false)
      return
    }

    setParticipantName(trimmed)
    setRenaming(false)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  // Session started + registered -> show answering UI
  if (sessionStatus === 'started' && participantId) {
    return (
      <AnswerQuestions
        sessionId={session.id}
        participantId={participantId}
        participantName={participantName}
      />
    )
  }

  // Session started but not registered
  if (sessionStatus === 'started') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-3xl">
          🚀
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Session has started</h2>
        <p className="text-gray-400 text-sm">Registration is no longer open.</p>
      </div>
    )
  }

  // Session closed
  if (sessionStatus === 'closed') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-3xl">
          🔒
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Session is closed</h2>
        <p className="text-gray-400 text-sm">This session has ended.</p>
      </div>
    )
  }

  // Registered, waiting for session to start
  if (participantId) {
    return (
      <div className="text-center py-6">
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
        <h2 className="text-2xl font-bold text-gray-900 mb-1">You&apos;re in!</h2>

        {renaming ? (
          <form onSubmit={handleRename} className="flex items-center justify-center gap-2 mb-8">
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setRenaming(false)}
              className="text-center text-base font-semibold border-2 border-indigo-400 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !renameValue.trim()}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold px-3 py-1.5 rounded-xl transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setRenaming(false)}
              className="text-gray-400 hover:text-gray-600 px-1 transition-colors"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-8">
            <p className="text-gray-500">
              Welcome, <span className="font-semibold text-gray-800">{participantName}</span>
            </p>
            <button
              onClick={() => {
                setRenameValue(participantName)
                setRenaming(true)
              }}
              className="text-gray-300 hover:text-indigo-500 transition-colors"
              title="Change your name"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        )}

        {renameError && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
            {renameError}
          </div>
        )}

        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-700">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            <p className="font-medium">Waiting for the session to start</p>
          </div>
          <p className="text-indigo-400 text-xs">This page will update automatically</p>
        </div>
      </div>
    )
  }

  // Not registered, registration open
  return (
    <form onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Join the session</h2>
      <p className="text-sm text-gray-400 mb-8">Enter your name to register</p>

      <div className="mb-5">
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          autoFocus
          required
          className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-indigo-500 transition-colors placeholder-gray-300"
        />
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-base transition-colors"
      >
        {loading ? 'Joining...' : 'Join Session'}
      </button>
    </form>
  )
}
