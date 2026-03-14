import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ResultsClientPage from './ResultsClientPage'

export default async function ParticipantResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, name, status')
    .eq('id', sessionId)
    .single()

  if (error || !session) notFound()

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-600 to-brand-800 flex flex-col">
      <div className="px-6 pt-8 pb-6 text-center">
        <p className="text-brand-200 text-xs font-medium uppercase tracking-widest mb-3">Sociometry</p>
        <h1 className="text-2xl font-bold text-white">{session.name}</h1>
        <p className="text-brand-200 text-sm mt-1">Workshop Session</p>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10">
        <ResultsClientPage
          sessionId={session.id}
          sessionStatus={session.status}
        />
      </div>
    </main>
  )
}
