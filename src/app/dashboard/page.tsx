import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

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
          <button
            disabled
            className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-lg opacity-50 cursor-not-allowed"
          >
            + New Session
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium">No sessions yet</p>
          <p className="text-sm mt-1">Create your first session to get started</p>
        </div>
      </div>
    </main>
  )
}
