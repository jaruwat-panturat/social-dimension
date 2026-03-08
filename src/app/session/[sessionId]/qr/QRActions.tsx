'use client'

export default function QRActions() {
  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  return (
    <div className="mt-8 flex gap-4 print:hidden">
      <button
        onClick={() => window.print()}
        className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
      >
        Print
      </button>
      <button
        onClick={toggleFullscreen}
        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
      >
        Fullscreen
      </button>
    </div>
  )
}
