import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import ResultsView from './ResultsView'

export type MatrixColumn = {
  id: string
  name: string
  first: number
  second: number
  third: number
  total: number
}

export type MatrixRow = {
  participant: { id: string; name: string }
  // selectedId -> rank (1 | 2 | 3)
  selections: Record<string, number>
}

export type QuestionMatrix = {
  questionId: string
  questionText: string
  orderIndex: number
  columns: MatrixColumn[]  // sorted by total points desc
  rows: MatrixRow[]
}

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, name, status')
    .eq('id', sessionId)
    .single()

  if (error || !session) notFound()
  if (session.status !== 'closed') redirect(`/session/${sessionId}`)

  const [{ data: participants }, { data: questions }] = await Promise.all([
    supabase
      .from('participants')
      .select('id, name')
      .eq('session_id', sessionId)
      .order('registered_at', { ascending: true }),
    supabase
      .from('questions')
      .select('id, question_text, order_index')
      .eq('session_id', sessionId)
      .order('order_index', { ascending: true }),
  ])

  const allParticipants = participants ?? []
  const allQuestions = questions ?? []

  const { data: answers } = await supabase
    .from('answers')
    .select('participant_id, question_id, selected_participant_1, selected_participant_2, selected_participant_3')
    .in('question_id', allQuestions.map(q => q.id))

  const allAnswers = answers ?? []

  // Build one MatrixData per question
  const matrices: QuestionMatrix[] = allQuestions.map(q => {
    const qAnswers = allAnswers.filter(a => a.question_id === q.id)

    // Compute column summary totals
    const summary: Record<string, { first: number; second: number; third: number }> = {}
    for (const p of allParticipants) {
      summary[p.id] = { first: 0, second: 0, third: 0 }
    }

    const rows: MatrixRow[] = []

    for (const a of qAnswers) {
      const selections: Record<string, number> = {}
      if (a.selected_participant_1) { selections[a.selected_participant_1] = 1; summary[a.selected_participant_1].first++ }
      if (a.selected_participant_2) { selections[a.selected_participant_2] = 2; summary[a.selected_participant_2].second++ }
      if (a.selected_participant_3) { selections[a.selected_participant_3] = 3; summary[a.selected_participant_3].third++ }

      const participant = allParticipants.find(p => p.id === a.participant_id)
      if (participant) rows.push({ participant, selections })
    }

    // Sort rows by participant registration order (stable)
    rows.sort((a, b) =>
      allParticipants.findIndex(p => p.id === a.participant.id) -
      allParticipants.findIndex(p => p.id === b.participant.id)
    )

    // Build columns sorted by total points desc
    const columns: MatrixColumn[] = allParticipants.map(p => {
      const s = summary[p.id] ?? { first: 0, second: 0, third: 0 }
      return {
        id: p.id,
        name: p.name,
        first: s.first,
        second: s.second,
        third: s.third,
        total: s.first * 3 + s.second * 2 + s.third * 1,
      }
    }).sort((a, b) => b.total - a.total)

    return {
      questionId: q.id,
      questionText: q.question_text,
      orderIndex: q.order_index,
      columns,
      rows,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 flex items-center gap-3 py-4">
          <Link href={`/session/${sessionId}`} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <span className="text-gray-200">|</span>
          <div>
            <span className="font-semibold text-gray-900">{session.name}</span>
            <span className="ml-2 text-xs text-gray-400">Results</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <ResultsView matrices={matrices} />
      </div>
    </div>
  )
}
