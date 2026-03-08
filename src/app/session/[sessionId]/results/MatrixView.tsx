'use client'


import type { QuestionMatrix } from './page'

const RANK_COLORS: Record<number, string> = {
  1: 'bg-amber-400 text-white',
  2: 'bg-slate-400 text-white',
  3: 'bg-orange-700 text-white',
}

const RANK_LABELS: Record<number, string> = {
  1: '1st',
  2: '2nd',
  3: '3rd',
}

// Explicit opaque backgrounds for alternating rows — bg-inherit breaks sticky with opacity classes
const ROW_BG = ['bg-white', 'bg-gray-50']

export default function MatrixView({
  matrices,
  activeQId,
  onChangeQId,
}: {
  matrices: QuestionMatrix[]
  activeQId: string
  onChangeQId: (qId: string) => void
}) {
  if (matrices.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-sm">No questions found for this session.</p>
      </div>
    )
  }

  const activeIndex = Math.max(0, matrices.findIndex(m => m.questionId === activeQId))
  const matrix = matrices[activeIndex]

  return (
    <div>
      {/* Question tabs */}
      {matrices.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {matrices.map((m, i) => (
            <button
              key={m.questionId}
              onClick={() => onChangeQId(m.questionId)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                i === activeIndex
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              Q{i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Question text */}
      <div className="mb-6 bg-white rounded-2xl border border-gray-200 px-6 py-4">
        <p className="text-xs text-gray-400 mb-1">Question {activeIndex + 1}</p>
        <p className="font-semibold text-gray-900">{matrix.questionText}</p>
      </div>

      {/* Matrix table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Scrollable container — both axes */}
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-sm border-collapse" style={{ minWidth: `${matrix.columns.length * 80 + 176}px` }}>
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-50 border-b border-gray-200">
                {/* Top-left corner — sticky on both axes */}
                <th className="sticky left-0 z-30 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-500 text-xs uppercase tracking-wide w-44 min-w-[176px] border-r border-gray-300 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.08)]">
                  Selector ↓ / Selected →
                </th>
                {matrix.columns.map(col => (
                  <th
                    key={col.id}
                    className="px-3 py-3 text-center font-semibold text-gray-700 min-w-[80px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-600">
                          {col.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-gray-700 max-w-[80px] truncate" title={col.name}>
                        {col.name}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {matrix.rows.map((row, rowIdx) => {
                const bg = ROW_BG[rowIdx % 2]
                return (
                  <tr key={row.participant.id} className={`${bg} border-b border-gray-100`}>
                    {/* Locked selector column */}
                    <td className={`sticky left-0 z-10 ${bg} px-4 py-3 font-medium text-gray-800 border-r border-gray-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]`}>
                      <div className="flex items-center gap-2 w-40">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-indigo-600">
                            {row.participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="truncate text-sm" title={row.participant.name}>
                          {row.participant.name}
                        </span>
                      </div>
                    </td>

                    {/* Data cells */}
                    {matrix.columns.map(col => {
                      const isSelf = col.id === row.participant.id
                      const rank = row.selections[col.id]
                      return (
                        <td key={col.id} className="px-3 py-3 text-center">
                          {isSelf ? (
                            <span className="text-gray-200 text-lg select-none">—</span>
                          ) : rank ? (
                            <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold ${RANK_COLORS[rank]}`}>
                              {RANK_LABELS[rank]}
                            </span>
                          ) : (
                            <span className="text-gray-200 select-none">·</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}

              {/* Divider */}
              <tr>
                <td colSpan={matrix.columns.length + 1} className="h-px bg-gray-300 p-0" />
              </tr>

              {/* Summary: 1st */}
              <tr className="bg-amber-50">
                <td className="sticky left-0 z-10 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700 border-r border-gray-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  <span className="inline-block w-3 h-3 rounded-sm bg-amber-400 mr-1.5 align-middle" />
                  1st choices
                </td>
                {matrix.columns.map(col => (
                  <td key={col.id} className="px-3 py-2.5 text-center text-sm font-semibold text-amber-700">
                    {col.first > 0 ? col.first : <span className="text-amber-200">0</span>}
                  </td>
                ))}
              </tr>

              {/* Summary: 2nd */}
              <tr className="bg-slate-50">
                <td className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 border-r border-gray-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  <span className="inline-block w-3 h-3 rounded-sm bg-slate-400 mr-1.5 align-middle" />
                  2nd choices
                </td>
                {matrix.columns.map(col => (
                  <td key={col.id} className="px-3 py-2.5 text-center text-sm font-semibold text-slate-600">
                    {col.second > 0 ? col.second : <span className="text-slate-200">0</span>}
                  </td>
                ))}
              </tr>

              {/* Summary: 3rd */}
              <tr className="bg-orange-50">
                <td className="sticky left-0 z-10 bg-orange-50 px-4 py-2.5 text-xs font-semibold text-orange-800 border-r border-gray-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  <span className="inline-block w-3 h-3 rounded-sm bg-orange-700 mr-1.5 align-middle" />
                  3rd choices
                </td>
                {matrix.columns.map(col => (
                  <td key={col.id} className="px-3 py-2.5 text-center text-sm font-semibold text-orange-800">
                    {col.third > 0 ? col.third : <span className="text-orange-200">0</span>}
                  </td>
                ))}
              </tr>

              {/* Total points */}
              <tr className="bg-indigo-50 border-t border-indigo-100">
                <td className="sticky left-0 z-10 bg-indigo-50 px-4 py-3 text-xs font-bold text-indigo-700 border-r border-gray-200 uppercase tracking-wide shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  Total Points
                  <span className="ml-1 text-indigo-400 font-normal normal-case">(3·2·1)</span>
                </td>
                {matrix.columns.map(col => (
                  <td key={col.id} className="px-3 py-3 text-center">
                    <span className={`inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-lg text-sm font-bold ${
                      col.total > 0 ? 'bg-indigo-600 text-white' : 'text-gray-300'
                    }`}>
                      {col.total}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-4 flex-wrap">
          <span className="text-xs text-gray-400 font-medium">Legend:</span>
          {Object.entries(RANK_LABELS).map(([rank, label]) => (
            <span key={rank} className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className={`inline-flex items-center justify-center w-8 h-5 rounded text-xs font-bold ${RANK_COLORS[Number(rank)]}`}>
                {label}
              </span>
              = {rank === '1' ? '3 pts' : rank === '2' ? '2 pts' : '1 pt'}
            </span>
          ))}
          <span className="text-xs text-gray-400">· = not selected &nbsp; — = self</span>
        </div>
      </div>
    </div>
  )
}
