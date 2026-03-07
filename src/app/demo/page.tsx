import Link from 'next/link';

export default function DemoPage() {
  // Mock session ID for demonstration
  const mockSessionId = 'demo-session-123';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Demo Mode
        </h1>
        <p className="text-gray-600 mb-6">
          Explore the app features without setting up the database.
        </p>

        <div className="space-y-4">
          <Link
            href={`/session/${mockSessionId}/qr`}
            className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
          >
            📱 View QR Code Page
          </Link>

          <Link
            href={`/register/${mockSessionId}`}
            className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg text-center transition-colors"
          >
            ✍️ Participant Registration
          </Link>

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-500 mb-2">Coming soon:</p>
            <div className="space-y-2 text-sm text-gray-400">
              <div>• Question answering</div>
              <div>• Results visualization</div>
              <div>• Facilitator dashboard</div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-center text-gray-400">
          <p>⚠️ This is demo mode</p>
          <p>No data is saved</p>
        </div>
      </div>
    </div>
  );
}
