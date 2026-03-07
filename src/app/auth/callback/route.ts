import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      // Check if user is an approved facilitator
      const { data: facilitator } = await supabase
        .from('facilitators')
        .select('id')
        .eq('email', user?.email ?? '')
        .single()

      if (!facilitator) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${origin}/?error=unauthorized`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth`)
}
