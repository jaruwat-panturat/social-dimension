import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  created: 'Draft',
  registration_open: 'Registration Open',
  started: 'In Progress',
  closed: 'Closed',
}

export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, name, status, created_at')
    .eq('id', sessionId)
    .eq('facilitator_id', user.id)
    .single()

  if (error || !session) notFound()

  const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register/${session.id}`

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Dashboard
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="font-semibold text-gray-900">{session.name}</h1>
        <span className="ml-auto text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
          {STATUS_LABEL[session.status]}
        </span>
      </header>

      <div className="max-w-3xl mx-auto p-8 space-y-6">

        {/* QR Code */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Registration QR Code</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Participants scan this to join</p>
              <p className="text-sm font-mono text-gray-700 break-all">{registrationUrl}</p>
            </div>
            <Link
              href={`/session/${session.id}/qr`}
              target="_blank"
              className="ml-6 shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Show QR
            </Link>
          </div>
        </div>

        {/* Questions (coming soon) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Questions</h2>
            <button
              disabled
              className="text-sm bg-gray-100 text-gray-400 font-medium px-3 py-1.5 rounded-lg cursor-not-allowed"
            >
              + Add Question
            </button>
          </div>
          <p className="text-sm text-gray-400">No questions added yet. Coming soon.</p>
        </div>

        {/* Session controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Session Controls</h2>
          <div className="flex gap-3">
            <button
              disabled
              className="bg-green-600 text-white font-semibold px-5 py-2.5 rounded-lg opacity-40 cursor-not-allowed text-sm"
            >
              Open Registration
            </button>
            <button
              disabled
              className="bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg opacity-40 cursor-not-allowed text-sm"
            >
              Start Session
            </button>
            <button
              disabled
              className="bg-red-600 text-white font-semibold px-5 py-2.5 rounded-lg opacity-40 cursor-not-allowed text-sm"
            >
              Close Session
            </button>
          </div>
        </div>

      </div>
    </main>
  )
}
