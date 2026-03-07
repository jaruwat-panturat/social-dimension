'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function renameSession(sessionId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('sessions')
    .update({ name })
    .eq('id', sessionId)

  revalidatePath(`/session/${sessionId}`)
}
