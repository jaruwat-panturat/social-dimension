'use client'

import { useState } from 'react'
import MatrixView from './MatrixView'
import NetworkGraph from './NetworkGraph'
import type { QuestionMatrix } from './page'

const VIEWS = [
  {
    id: 'matrix',
    label: 'Matrix',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    id: 'network',
    label: 'Network',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
        <line x1="12" y1="7" x2="5" y2="17" /><line x1="12" y1="7" x2="19" y2="17" />
        <line x1="7" y1="19" x2="17" y2="19" />
      </svg>
    ),
  },
] as const

export default function ResultsView({ matrices }: { matrices: QuestionMatrix[] }) {
  const [view, setView] = useState<'matrix' | 'network'>('matrix')
  const [activeQId, setActiveQId] = useState<string>(() => matrices[0]?.questionId ?? '')

  return (
    <div>
      {/* View toggle */}
      <div className="inline-flex bg-white border border-gray-200 rounded-xl p-1 mb-6 gap-1">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === v.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {v.icon}
            {v.label}
          </button>
        ))}
      </div>

      {view === 'matrix' ? (
        <MatrixView matrices={matrices} activeQId={activeQId} onChangeQId={setActiveQId} />
      ) : (
        <NetworkGraph matrices={matrices} activeQId={activeQId} onChangeQId={setActiveQId} />
      )}
    </div>
  )
}
