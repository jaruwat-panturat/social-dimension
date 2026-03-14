'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ParticipantResults from '../ParticipantResults'

export default function ResultsClientPage({
  sessionId,
  sessionStatus,
}: {
  sessionId: string
  sessionStatus: string
}) {
  // undefined = still verifying, true = verified, false = not valid
  const [verified, setVerified] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const storedId = localStorage.getItem(`participant_${sessionId}`)
    if (!storedId) {
      setVerified(false)
      return
    }

    const supabase = createClient()
    supabase
      .from('participants')
      .select('id')
      .eq('id', storedId)
      .eq('session_id', sessionId)
      .single()
      .then(({ data }) => setVerified(!!data))
  }, [sessionId])

  if (verified === undefined) {
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

  if (!verified) {
    notFound()
  }

  return <ParticipantResults sessionId={sessionId} />
}
