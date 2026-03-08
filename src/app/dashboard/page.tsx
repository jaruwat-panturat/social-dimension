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
  created: 'bg-slate-100 text-slate-500',
  registration_open: 'bg-blue-50 text-blue-600',
  started: 'bg-green-50 text-green-600',
  closed: 'bg-red-50 text-red-500',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, name, status, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 py-4">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="2" />
                <circle cx="5" cy="19" r="2" />
                <circle cx="19" cy="19" r="2" />
                <line x1="12" y1="7" x2="5" y2="17" />
                <line x1="12" y1="7" x2="19" y2="17" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">Sociometry</span>
          </div>
          <div className="flex items-center gap-4 py-4">
            <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
            <p className="text-sm text-gray-400 mt-1">{sessions?.length ?? 0} total</p>
          </div>
          <Link
            href="/dashboard/new"
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            + New Session
          </Link>
        </div>

        {!sessions || sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 text-center py-16 px-6">
            <p className="font-semibold text-gray-700 mb-1">No sessions yet</p>
            <p className="text-sm text-gray-400 mb-6">Create your first session to get started</p>
            <Link
              href="/dashboard/new"
              className="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
            >
              + New Session
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/session/${session.id}`}
                className="flex items-center justify-between bg-white rounded-2xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all group px-6 py-4"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">
                    {session.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(session.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[session.status]}`}>
                    {STATUS_LABEL[session.status]}
                  </span>
                  <svg className="text-gray-300 group-hover:text-brand-400 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
