import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import RegisterForm from './RegisterForm'

export default async function RegisterPage({
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

  const isClosed = session.status === 'closed'

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-600 to-brand-800 flex flex-col">
      {/* Top brand bar */}
      <div className="px-6 pt-8 pb-6 text-center">
        <p className="text-brand-200 text-xs font-medium uppercase tracking-widest mb-3">Sociometry</p>
        <h1 className="text-2xl font-bold text-white">{session.name}</h1>
        <p className="text-brand-200 text-sm mt-1">Workshop Session</p>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-10">
        {isClosed ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-3xl">
              🔒
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Session is closed</h2>
            <p className="text-gray-400 text-sm">This session has ended.</p>
          </div>
        ) : (
          <RegisterForm session={session} />
        )}
      </div>
    </main>
  )
}
