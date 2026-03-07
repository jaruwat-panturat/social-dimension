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

  if (error || !session) {
    notFound()
  }

  const isOpen = session.status === 'created' || session.status === 'registration_open'

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{session.name}</h1>
          <p className="text-gray-500 text-sm">Social Dimension Workshop</p>
        </div>

        {!isOpen ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-4">
              {session.status === 'started' ? '🚀' : '🔒'}
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {session.status === 'started'
                ? 'Session has started'
                : 'Session is closed'}
            </h2>
            <p className="text-gray-500 text-sm">
              {session.status === 'started'
                ? 'Registration is no longer open.'
                : 'This session has ended.'}
            </p>
          </div>
        ) : (
          <RegisterForm session={session} />
        )}
      </div>
    </main>
  )
}
