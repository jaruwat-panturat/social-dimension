import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

const STEPS = [
  { key: 'created', label: 'Draft' },
  { key: 'registration_open', label: 'Registration' },
  { key: 'started', label: 'In Progress' },
  { key: 'closed', label: 'Closed' },
]

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

  const currentStep = STEPS.findIndex(s => s.key === session.status)
  const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register/${session.id}`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 flex items-center gap-3 py-4">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <span className="text-gray-200">|</span>
          <h1 className="font-semibold text-gray-900 text-sm truncate">{session.name}</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Status steps */}
        <div className="bg-white rounded-2xl border border-gray-200 px-6 py-5">
          <div className="flex items-center">
            {STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i < currentStep ? 'bg-indigo-600 text-white' :
                    i === currentStep ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {i < currentStep ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${i <= currentStep ? 'text-indigo-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < currentStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Registration link */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 mb-1">Registration Link</h2>
              <p className="text-xs text-gray-400 mb-3">Participants scan the QR code or visit this link to join</p>
              <p className="text-xs font-mono bg-gray-50 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg break-all">
                {registrationUrl}
              </p>
            </div>
            <Link
              href={`/session/${session.id}/qr`}
              target="_blank"
              className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              Show QR
            </Link>
          </div>
        </div>

        {/* Questions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">Questions</h2>
              <p className="text-xs text-gray-400 mt-0.5">What participants will answer about each other</p>
            </div>
            <button disabled className="text-sm bg-gray-100 text-gray-400 font-medium px-3 py-2 rounded-lg cursor-not-allowed">
              + Add
            </button>
          </div>
          <div className="text-center py-8">
            <p className="text-sm font-medium text-gray-400">No questions yet</p>
            <p className="text-xs mt-0.5 text-gray-300">Coming soon</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Session Controls</h2>
          <div className="flex flex-wrap gap-3">
            <button disabled className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl opacity-40 cursor-not-allowed text-sm">
              Open Registration
            </button>
            <button disabled className="bg-green-600 text-white font-semibold px-4 py-2.5 rounded-xl opacity-40 cursor-not-allowed text-sm">
              Start Session
            </button>
            <button disabled className="bg-red-500 text-white font-semibold px-4 py-2.5 rounded-xl opacity-40 cursor-not-allowed text-sm">
              Close Session
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
