import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import QRActions from './QRActions'
import ParticipantsLive from './ParticipantsLive'

export default async function SessionQRPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const supabase = await createClient()

  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, name, status')
    .eq('id', sessionId)
    .single()

  if (error || !session) notFound()

  const { data: participants } = await supabase
    .from('participants')
    .select('id, name, registered_at')
    .eq('session_id', sessionId)
    .order('registered_at', { ascending: true })

  const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/register/${sessionId}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-3xl w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{session.name}</h1>
          <p className="text-gray-500">Scan to join the session</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* QR Code */}
          <div className="flex flex-col items-center gap-4 flex-shrink-0">
            <div className="bg-white p-5 rounded-xl border-4 border-gray-100">
              <QRCodeSVG value={registrationUrl} size={240} level="H" includeMargin={false} />
            </div>
            <p className="text-xs font-mono bg-gray-50 border border-gray-200 text-gray-500 px-3 py-2 rounded-lg break-all text-center max-w-[280px]">
              {registrationUrl}
            </p>
          </div>

          {/* Participants — live via Supabase Realtime */}
          <ParticipantsLive
            sessionId={sessionId}
            initialParticipants={participants ?? []}
          />

        </div>
      </div>

      <QRActions />
    </div>
  )
}
