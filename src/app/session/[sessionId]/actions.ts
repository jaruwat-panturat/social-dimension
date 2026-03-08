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

export async function updateSessionStatus(sessionId: string, status: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId)

  revalidatePath(`/session/${sessionId}`)
}

export async function reorderQuestions(updates: { id: string; order_index: number }[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await Promise.all(
    updates.map(({ id, order_index }) =>
      supabase.from('questions').update({ order_index }).eq('id', id)
    )
  )
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Get all question IDs for this session
  const { data: questions } = await supabase
    .from('questions')
    .select('id')
    .eq('session_id', sessionId)

  const questionIds = (questions ?? []).map(q => q.id)

  // Delete answers belonging to those questions
  if (questionIds.length > 0) {
    await supabase.from('answers').delete().in('question_id', questionIds)
  }

  // Delete questions, participants, then session
  await supabase.from('questions').delete().eq('session_id', sessionId)
  await supabase.from('participants').delete().eq('session_id', sessionId)
  await supabase.from('sessions').delete().eq('id', sessionId)

  revalidatePath('/dashboard')
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
