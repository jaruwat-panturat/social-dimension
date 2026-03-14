import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import PaperAnswerEntry from './PaperAnswerEntry'

export default async function PaperEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>
  searchParams: Promise<{ for?: string }>
}) {
  const { sessionId } = await params
  const { for: initialParticipantId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, status')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()
  if (session.status !== 'started' && session.status !== 'closed') redirect(`/session/${sessionId}`)

  const [{ data: participants }, { data: questions }] = await Promise.all([
    supabase
      .from('participants')
      .select('id, name')
      .eq('session_id', sessionId)
      .order('registered_at', { ascending: true }),
    supabase
      .from('questions')
      .select('id, question_text, order_index')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true }),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 flex items-center gap-3 py-4">
          <Link href={`/session/${sessionId}`} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <span className="text-gray-200">|</span>
          <div>
            <span className="font-semibold text-gray-900">{session.name}</span>
            <span className="ml-2 text-xs text-gray-400">Enter Answers</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <PaperAnswerEntry
          sessionId={session.id}
          sessionStatus={session.status}
          participants={participants ?? []}
          questions={questions ?? []}
          initialParticipantId={initialParticipantId}
        />
      </div>
    </div>
  )
}
