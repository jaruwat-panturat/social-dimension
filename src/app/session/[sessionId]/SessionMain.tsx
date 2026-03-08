'use client'

import { useState } from 'react'
import QuestionsPanel from './QuestionsPanel'
import ParticipantsList from './ParticipantsList'
import SessionControls from './SessionControls'

interface Question {
  id: string
  question_text: string
  order_index: number
}

interface Participant {
  id: string
  name: string
  registered_at: string
}

const MIN_PARTICIPANTS = 2

export default function SessionMain({
  sessionId,
  initialQuestions,
  initialParticipants,
  initialStatus,
}: {
  sessionId: string
  initialQuestions: Question[]
  initialParticipants: Participant[]
  initialStatus: string
}) {
  const [questionCount, setQuestionCount] = useState(initialQuestions.length)
  const [participantCount, setParticipantCount] = useState(initialParticipants.length)

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <ParticipantsList
          sessionId={sessionId}
          initialParticipants={initialParticipants}
          onCountChange={setParticipantCount}
          status={initialStatus}
          questionCount={questionCount}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <QuestionsPanel
          sessionId={sessionId}
          initialQuestions={initialQuestions}
          onCountChange={setQuestionCount}
          status={initialStatus}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <SessionControls
          sessionId={sessionId}
          initialStatus={initialStatus}
          questionCount={questionCount}
          participantCount={participantCount}
          minParticipants={MIN_PARTICIPANTS}
        />
      </div>
    </>
  )
}
