import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SignInButton from '@/components/SignInButton'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  const { error } = await searchParams

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Social Dimension
        </h1>
        <p className="text-gray-500 mb-10">
          Psychology workshop tool for social assessment
        </p>

        {error === 'auth' && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            Sign-in failed. Please try again.
          </div>
        )}

        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-3">Facilitator access</p>
          <SignInButton />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
          <h3 className="font-semibold text-blue-900 mb-2">What is this?</h3>
          <ul className="text-blue-800 space-y-1">
            <li>• Register participants via QR code</li>
            <li>• Answer questions about peers</li>
            <li>• Visualize social dynamics</li>
            <li>• Designed for psychology workshops</li>
          </ul>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          Built with Next.js + Supabase + Tailwind
        </div>
      </div>
    </main>
  )
}
