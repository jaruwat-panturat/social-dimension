import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from '@/components/SignOutButton'

const STATUS_LABEL: Record<string, string> = {
  created: 'Draft',
  registration_open: 'Registration Open',
  started: 'In Progress',
  closed: 'Closed',
}

const STATUS_COLOR: Record<string, string> = {
  created: 'bg-gray-100 text-gray-600',
  registration_open: 'bg-blue-100 text-blue-700',
  started: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-600',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, status, created_at')
    .eq('facilitator_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Social Dimension</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">My Sessions</h2>
          <Link
            href="/dashboard/new"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            + New Session
          </Link>
        </div>

        {!sessions || sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-medium">No sessions yet</p>
            <p className="text-sm mt-1">Create your first session to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="block bg-white rounded-xl border border-gray-200 px-6 py-4 hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{session.name}</h3>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[session.status]}`}>
                    {STATUS_LABEL[session.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
