'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createSession(formData: FormData) {
  const name = (formData.get('name') as string).trim()
  if (!name) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data, error } = await supabase
    .from('sessions')
    .insert({ name, facilitator_id: user.id, status: 'created' })
    .select('id')
    .single()

  if (error || !data) throw new Error('Failed to create session')

  redirect(`/session/${data.id}`)
}
