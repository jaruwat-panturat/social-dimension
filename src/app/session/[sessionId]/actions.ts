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

export async function addQuestion(sessionId: string, text: string, order: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('questions')
    .insert({ session_id: sessionId, question_text: text, order_index: order })
    .select('id, question_text, order_index')
    .single()

  if (error || !data) throw new Error('Failed to add question')
  return data
}

export async function updateQuestion(questionId: string, text: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('questions')
    .update({ question_text: text })
    .eq('id', questionId)
}

export async function deleteQuestion(questionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)
}
