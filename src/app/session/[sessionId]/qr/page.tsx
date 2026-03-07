'use client';

import { useParams } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

export default function SessionQRPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  // Mock session data - will be replaced with real data from Supabase
  const sessionName = 'Social Dimension Workshop';
  const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register/${sessionId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full text-center">
        {/* Session Info */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {sessionName}
          </h1>
          <p className="text-xl text-gray-600">
            Scan to join the session
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-8 bg-white p-8 rounded-xl border-4 border-gray-200">
          <QRCodeSVG
            value={registrationUrl}
            size={320}
            level="H"
            includeMargin={true}
            className="w-full h-auto max-w-md"
          />
        </div>

        {/* URL Display */}
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">Or visit:</p>
          <p className="text-lg font-mono bg-gray-100 px-4 py-2 rounded-lg text-gray-700 break-all">
            {registrationUrl}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📱 Participants can scan this QR code with their phone camera to register
          </p>
        </div>

        {/* Session ID */}
        <div className="mt-6 text-xs text-gray-400">
          Session ID: {sessionId}
        </div>
      </div>

      {/* Controls (for facilitator) */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={() => window.print()}
          className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
        >
          🖨️ Print
        </button>
        <button
          onClick={() => {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              document.documentElement.requestFullscreen();
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
        >
          ⛶ Fullscreen
        </button>
      </div>

      {/* Mock indicator */}
      <div className="mt-4 text-sm text-gray-500 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg">
        ⚠️ Mock Mode - Connect to Supabase for real sessions
      </div>
    </div>
  );
}
