'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Session {
  id: string
  name: string
  status: string
}

export default function RegisterForm({ session }: { session: Session }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)
  const [participantName, setParticipantName] = useState('')

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

    // Store participant ID so they can answer questions later
    localStorage.setItem(`participant_${session.id}`, data.id)

    setParticipantName(trimmed)
    setRegistered(true)
    setLoading(false)
  }

  if (registered) {
    return (
      <div className="text-center">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You're in!</h2>
        <p className="text-gray-600 mb-6">
          Welcome, <span className="font-semibold">{participantName}</span>
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          Keep this page open. The facilitator will start the session shortly.
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-6">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Your name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          autoFocus
          required
          className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors"
      >
        {loading ? 'Registering...' : 'Join Session'}
      </button>
    </form>
  )
}
