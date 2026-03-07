'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  const [registered, setRegistered] = useState(false)
  const [participantName, setParticipantName] = useState('')

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
          setParticipantName(data.name)
          setRegistered(true)
        } else {
          localStorage.removeItem(storageKey(session.id))
        }
        setLoading(false)
      })
  }, [session.id])

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
    setParticipantName(trimmed)
    setRegistered(true)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (registered) {
    return (
      <div className="text-center py-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">You're in!</h2>
        <p className="text-gray-500 mb-8">
          Welcome, <span className="font-semibold text-gray-800">{participantName}</span>
        </p>
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-700">
          <p className="font-medium mb-0.5">Keep this page open</p>
          <p className="text-indigo-400 text-xs">The facilitator will start the session shortly</p>
        </div>
      </div>
    )
  }

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
