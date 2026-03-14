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

  // When closing, precompute top-3 per question and store on the question row
  if (status === 'closed') {
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('session_id', sessionId)

    if (questions?.length) {
      const questionIds = questions.map(q => q.id)

      const { data: answers } = await supabase
        .from('answers')
        .select('question_id, selected_participant_1, selected_participant_2, selected_participant_3')
        .in('question_id', questionIds)

      const { data: participants } = await supabase
        .from('participants')
        .select('id, name')
        .eq('session_id', sessionId)

      if (answers && participants) {
        const participantMap = new Map(participants.map(p => [p.id, p.name]))

        await Promise.all(
          questions.map(async (question) => {
            const scores = new Map<string, number>()
            answers
              .filter(a => a.question_id === question.id)
              .forEach(a => {
                if (a.selected_participant_1) scores.set(a.selected_participant_1, (scores.get(a.selected_participant_1) ?? 0) + 3)
                if (a.selected_participant_2) scores.set(a.selected_participant_2, (scores.get(a.selected_participant_2) ?? 0) + 2)
                if (a.selected_participant_3) scores.set(a.selected_participant_3, (scores.get(a.selected_participant_3) ?? 0) + 1)
              })

            const sortedEntries = Array.from(scores.entries())
              .sort((a, b) => b[1] - a[1])

            // Standard competition ranking: ties share the same rank,
            // next rank skips over the tied count.
            // Only include entries where rank <= 3.
            const top3: { name: string; rank: number }[] = []
            let position = 1
            let i = 0
            while (i < sortedEntries.length && position <= 3) {
              const score = sortedEntries[i][1]
              const tiedGroup = sortedEntries.filter(([, s]) => s === score)
              tiedGroup.forEach(([id]) => {
                top3.push({ name: participantMap.get(id) ?? 'Unknown', rank: position })
              })
              position += tiedGroup.length
              i += tiedGroup.length
            }

            await supabase
              .from('questions')
              .update({ top3_results: top3 })
              .eq('id', question.id)
          })
        )
      }
    }
  }

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
