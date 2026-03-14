import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ParticipantResults from '@/app/register/[sessionId]/ParticipantResults'

export default async function FacilitatorParticipantViewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: session } = await supabase
    .from('sessions')
    .select('id, name, status')
    .eq('id', sessionId)
    .single()

  if (!session) notFound()
  if (session.status !== 'closed') redirect(`/session/${sessionId}`)

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-600 to-brand-800 flex flex-col">
      <div className="px-6 pt-8 pb-6 text-center">
        <Link
          href={`/session/${sessionId}`}
          className="inline-flex items-center gap-1.5 text-brand-200 hover:text-white text-xs mb-4 transition-colors"
        >
          ← Back to session
        </Link>
        <p className="text-brand-200 text-xs font-medium uppercase tracking-widest mb-3">Sociometry</p>
        <h1 className="text-2xl font-bold text-white">{session.name}</h1>
        <p className="text-brand-200 text-sm mt-1">Workshop Session</p>
      </div>

      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10">
        <ParticipantResults sessionId={session.id} />
      </div>
    </main>
  )
}
