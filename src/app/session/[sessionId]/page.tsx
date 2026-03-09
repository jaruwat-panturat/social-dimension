import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import RenameSession from './RenameSession'
import SessionMain from './SessionMain'
import DeleteSession from './DeleteSession'
import CopyButton from './CopyButton'

const STEPS = [
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
    .single()

  if (error || !session) notFound()

  const { data: questions } = await supabase
    .from('questions')
    .select('id, question_text, order_index')
    .eq('session_id', sessionId)
    .order('order_index', { ascending: true })

  const { data: participants } = await supabase
    .from('participants')
    .select('id, name, registered_at')
    .eq('session_id', sessionId)
    .order('registered_at', { ascending: true })

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
          <RenameSession sessionId={session.id} initialName={session.name} />
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
                    i < currentStep ? 'bg-brand-600 text-white' :
                    i === currentStep ? 'bg-brand-600 text-white ring-4 ring-brand-100' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {i < currentStep ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${i <= currentStep ? 'text-brand-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < currentStep ? 'bg-brand-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Registration link — hidden once session is closed */}
        {session.status !== 'closed' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 mb-1">Registration Link</h2>
                <p className="text-xs text-gray-400 mb-3">Participants scan the QR code or visit this link to join</p>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <p className="text-xs font-mono text-gray-600 break-all flex-1">{registrationUrl}</p>
                  <CopyButton text={registrationUrl} />
                </div>
              </div>
              <Link
                href={`/session/${session.id}/qr`}
                target="_blank"
                className="shrink-0 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                Show QR
              </Link>
            </div>
          </div>
        )}

        {/* View Results (only when closed) */}
        {session.status === 'closed' && (
          <Link
            href={`/session/${session.id}/results`}
            className="flex items-center justify-between bg-brand-600 hover:bg-brand-700 text-white rounded-2xl px-6 py-4 transition-colors"
          >
            <div>
              <p className="font-semibold">Session Results</p>
              <p className="text-brand-200 text-xs mt-0.5">View the sociometric matrix</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        )}

        {/* Participants + Questions + Controls (shared state) */}
        <SessionMain
          sessionId={session.id}
          initialQuestions={questions ?? []}
          initialParticipants={participants ?? []}
          initialStatus={session.status}
        />

        {/* Danger zone — only available once session is closed */}
        {session.status === 'closed' && (
          <div className="flex items-center justify-end pt-2 pb-6">
            <DeleteSession sessionId={session.id} sessionName={session.name} />
          </div>
        )}

      </div>
    </div>
  )
}
