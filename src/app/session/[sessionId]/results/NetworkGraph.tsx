'use client'

import { useEffect, useRef, useState } from 'react'
import type { QuestionMatrix } from './page'

// ── Types ─────────────────────────────────────────────────────────────────

type SimNode = {
  id: string
  name: string
  totalPoints: number
  x: number; y: number
  vx: number; vy: number
  pinned?: boolean
}

type GraphEdge = {
  from: string
  to: string
  rank: 1 | 2 | 3
  questionId: string
}

// ── Constants ─────────────────────────────────────────────────────────────

const VW = 760
const VH = 500

const RANK_STYLE = {
  1: { width: 2.5, dash: undefined as string | undefined, color: '#f59e0b', label: '1st choice' },
  2: { width: 1.5, dash: undefined as string | undefined, color: '#94a3b8', label: '2nd choice' },
  3: { width: 1.2, dash: '7,5',                          color: '#b45309', label: '3rd choice' },
} as const

function nodeRadius(pts: number) {
  return 14 + Math.sqrt(Math.max(pts, 0)) * 1.5
}

// ── Helpers ───────────────────────────────────────────────────────────────

function buildGraph(matrices: QuestionMatrix[]) {
  const pts: Record<string, { name: string; total: number }> = {}
  // perQ[questionId][participantId] = points for that question
  const perQ: Record<string, Record<string, number>> = {}

  for (const m of matrices) {
    perQ[m.questionId] = {}
    for (const col of m.columns) {
      pts[col.id] = { name: col.name, total: (pts[col.id]?.total ?? 0) + col.total }
      perQ[m.questionId][col.id] = col.total
    }
  }

  const allEdges: GraphEdge[] = []
  for (const m of matrices) {
    for (const row of m.rows) {
      for (const [toId, rank] of Object.entries(row.selections)) {
        allEdges.push({ from: row.participant.id, to: toId, rank: rank as 1 | 2 | 3, questionId: m.questionId })
      }
    }
  }

  const ids = Object.keys(pts)
  const nodes: SimNode[] = ids.map((id, i) => {
    const angle = (i / ids.length) * 2 * Math.PI - Math.PI / 2
    const cr = Math.min(VW, VH) * 0.28
    return {
      id, name: pts[id].name, totalPoints: pts[id].total,
      x: VW / 2 + cr * Math.cos(angle),
      y: VH / 2 + cr * Math.sin(angle),
      vx: 0, vy: 0,
    }
  })

  return { nodes, edges: allEdges, perQ }
}

// ── Component ─────────────────────────────────────────────────────────────

export default function NetworkGraph({
  matrices,
  activeQId,
  onChangeQId,
}: {
  matrices: QuestionMatrix[]
  activeQId: string
  onChangeQId: (qId: string) => void
}) {
  const filterQId = activeQId
  const setFilterQId = onChangeQId
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [nodes, setNodes] = useState<SimNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  // perQ[questionId][participantId] = points for that question only
  const [perQ, setPerQ] = useState<Record<string, Record<string, number>>>({})

  const nodesRef = useRef<SimNode[]>([])
  const tickRef  = useRef(0)
  const rafRef   = useRef<number>(0)
  const dragRef  = useRef<string | null>(null)
  const svgRef   = useRef<SVGSVGElement>(null)

  // ── Build graph when matrices change ──────────────────────────────────

  useEffect(() => {
    if (!matrices.length) return
    const { nodes: ns, edges: es, perQ: pq } = buildGraph(matrices)
    nodesRef.current = ns
    tickRef.current = 0
    setEdges(es)
    setPerQ(pq)
    setNodes([...ns])
  }, [matrices])

  // ── Force simulation ──────────────────────────────────────────────────

  useEffect(() => {
    if (!nodesRef.current.length) return
    tickRef.current = 0
    cancelAnimationFrame(rafRef.current)

    const active = edges.filter(e => e.questionId === filterQId)

    function tick() {
      if (tickRef.current++ >= 280) return
      const alpha = 1 - tickRef.current / 280          // cooling factor
      const ns = nodesRef.current
      const byId = new Map(ns.map(n => [n.id, n]))

      // Damping
      for (const n of ns) { n.vx *= 0.80; n.vy *= 0.80 }

      // Gravity toward center
      for (const n of ns) {
        n.vx += (VW / 2 - n.x) * 0.006 * alpha
        n.vy += (VH / 2 - n.y) * 0.006 * alpha
      }

      // Charge repulsion between all nodes
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x || 0.01
          const dy = ns[j].y - ns[i].y || 0.01
          const d2 = dx * dx + dy * dy
          const d  = Math.sqrt(d2)
          const f  = 4500 * alpha / d2
          ns[i].vx -= (dx / d) * f; ns[i].vy -= (dy / d) * f
          ns[j].vx += (dx / d) * f; ns[j].vy += (dy / d) * f
        }
      }

      // Spring attraction along edges
      for (const e of active) {
        const a = byId.get(e.from); const b = byId.get(e.to)
        if (!a || !b) continue
        const dx = b.x - a.x; const dy = b.y - a.y
        const d  = Math.sqrt(dx * dx + dy * dy) || 0.01
        const f  = (d - 135) * 0.045 * alpha
        a.vx += (dx / d) * f; a.vy += (dy / d) * f
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f
      }

      // Integrate + boundary clamp
      for (const n of ns) {
        if (n.pinned) continue
        n.x += n.vx; n.y += n.vy
        const nr = nodeRadius(n.totalPoints)
        n.x = Math.max(nr + 10, Math.min(VW - nr - 10, n.x))
        n.y = Math.max(nr + 10, Math.min(VH - nr - 10, n.y))
      }

      setNodes([...ns])
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [edges, filterQId])

  // ── Drag ──────────────────────────────────────────────────────────────

  function svgPoint(e: React.MouseEvent) {
    const pt = svgRef.current!.createSVGPoint()
    pt.x = e.clientX; pt.y = e.clientY
    return pt.matrixTransform(svgRef.current!.getScreenCTM()!.inverse())
  }

  function onNodeDown(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    dragRef.current = id
    const n = nodesRef.current.find(n => n.id === id)
    if (n) { n.pinned = true }
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return
    const { x, y } = svgPoint(e)
    const n = nodesRef.current.find(n => n.id === dragRef.current)
    if (n) { n.x = x; n.y = y; setNodes([...nodesRef.current]) }
  }

  function onMouseUp() {
    if (!dragRef.current) return
    const n = nodesRef.current.find(n => n.id === dragRef.current)
    if (n) { n.pinned = false; n.vx = 0; n.vy = 0 }
    dragRef.current = null
  }

  // ── Derived render data ───────────────────────────────────────────────

  const visibleEdges = edges.filter(e => e.questionId === filterQId)

  const nodeById = new Map(nodes.map(n => [n.id, n]))

  function displayPts(nodeId: string): number {
    return perQ[filterQId]?.[nodeId] ?? 0
  }

  const highlightedEdges = hoverId
    ? new Set(visibleEdges.filter(e => e.from === hoverId || e.to === hoverId).map(e => `${e.from}→${e.to}`))
    : null
  const highlightedNodes = hoverId
    ? new Set(visibleEdges.filter(e => e.from === hoverId || e.to === hoverId).flatMap(e => [e.from, e.to]))
    : null

  // Pre-compute reverse-edge lookup for perpendicular offset
  const edgeKeySet = new Set(visibleEdges.map(e => `${e.from}→${e.to}`))

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Question tabs */}
      {matrices.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {matrices.map((m, i) => (
            <button
              key={m.questionId}
              onClick={() => { setFilterQId(m.questionId); tickRef.current = 0 }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filterQId === m.questionId ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              Q{i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Current question text */}
      {(() => {
        const activeMatrix = matrices.find(m => m.questionId === filterQId)
        const activeIndex  = matrices.findIndex(m => m.questionId === filterQId)
        if (!activeMatrix) return null
        return (
          <div className="mb-6 bg-white rounded-2xl border border-gray-200 px-6 py-4">
            <p className="text-xs text-gray-400 mb-1">Question {activeIndex + 1}</p>
            <p className="font-semibold text-gray-900">{activeMatrix.questionText}</p>
          </div>
        )
      })()}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* SVG canvas */}
        <div className="aspect-[760/500] w-full">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${VW} ${VH}`}
            className="w-full h-full"
            style={{ cursor: dragRef.current ? 'grabbing' : 'default' }}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          >
            <defs>
              {/* Arrowhead markers per rank */}
              {([1, 2, 3] as const).map(rank => {
                const s = RANK_STYLE[rank]
                return (
                  <marker
                    key={rank}
                    id={`arrow-${rank}`}
                    viewBox="0 -5 10 10"
                    refX="5"
                    refY="0"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto"
                    markerUnits="userSpaceOnUse"
                  >
                    <path d="M0,-5 L10,0 L0,5 Z" fill={s.color} />
                  </marker>
                )
              })}
            </defs>

            {/* Edges — render before nodes so nodes sit on top */}
            {visibleEdges.map((e) => {
              const a = nodeById.get(e.from); const b = nodeById.get(e.to)
              if (!a || !b) return null
              const s = RANK_STYLE[e.rank]
              const dx = b.x - a.x; const dy = b.y - a.y
              const d  = Math.sqrt(dx * dx + dy * dy) || 1
              const ra = nodeRadius(displayPts(a.id))
              const rb = nodeRadius(displayPts(b.id))

              // Perpendicular offset so bidirectional / parallel edges don't overlap.
              // Use a CANONICAL direction (smaller-id → larger-id) so the perpendicular
              // vector is identical for both A→B and B→A. Then flip sign per edge so
              // they land on opposite sides of the line.
              const hasBidi = edgeKeySet.has(`${e.to}→${e.from}`)
              const OFFSET  = hasBidi ? 4 : 2
              // Canonical direction: always from the node with the smaller id to the larger
              const canonDx = e.from < e.to ? dx : -dx
              const canonDy = e.from < e.to ? dy : -dy
              const canonD  = Math.sqrt(canonDx * canonDx + canonDy * canonDy) || 1
              const perpX   = -canonDy / canonD  // left of canonical direction
              const perpY   =  canonDx / canonD
              const sign    = e.from < e.to ? 1 : -1
              const ox = perpX * OFFSET * sign
              const oy = perpY * OFFSET * sign

              const x1 = a.x + (dx / d) * (ra + 3) + ox
              const y1 = a.y + (dy / d) * (ra + 3) + oy
              const x2 = b.x - (dx / d) * (rb + 5) + ox
              const y2 = b.y - (dy / d) * (rb + 5) + oy

              const key = `${e.from}→${e.to}`
              const dim = highlightedEdges ? !highlightedEdges.has(key) : false

              return (
                <line
                  key={key}
                  x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeDasharray={s.dash}
                  markerEnd={`url(#arrow-${e.rank})`}
                  opacity={dim ? 0.08 : 0.75}
                  style={{ transition: 'opacity 0.15s' }}
                />
              )
            })}

            {/* Nodes */}
            {nodes.map(n => {
              const dp = displayPts(n.id)
              const nr = nodeRadius(dp)
              const isHovered = n.id === hoverId
              const dim = highlightedNodes ? !highlightedNodes.has(n.id) : false

              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x},${n.y})`}
                  style={{ cursor: 'grab' }}
                  onMouseDown={ev => onNodeDown(ev, n.id)}
                  onMouseEnter={() => setHoverId(n.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  {isHovered && (
                    <circle r={nr + 6} fill="#6366f1" opacity={0.15} />
                  )}
                  <circle
                    r={nr}
                    fill={isHovered ? '#4338ca' : '#6366f1'}
                    stroke="white"
                    strokeWidth={isHovered ? 3 : 2}
                    opacity={dim ? 0.2 : 1}
                    style={{ transition: 'opacity 0.15s, fill 0.1s' }}
                  />
                  {/* Points inside bubble */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={Math.max(9, Math.min(15, nr * 0.6))}
                    fill="white"
                    fontWeight="700"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {dp}
                  </text>
                  {/* Name below bubble */}
                  <text
                    textAnchor="middle"
                    y={nr + 13}
                    fontSize="11"
                    fill={dim ? '#d1d5db' : isHovered ? '#1e1b4b' : '#374151'}
                    fontWeight={isHovered ? '700' : '500'}
                    style={{ pointerEvents: 'none', userSelect: 'none', transition: 'fill 0.15s' }}
                  >
                    {n.name.length > 13 ? n.name.slice(0, 11) + '…' : n.name}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-5 flex-wrap text-xs text-gray-600">
          <span className="font-medium text-gray-400">Legend:</span>
          {([1, 2, 3] as const).map(rank => {
            const s = RANK_STYLE[rank]
            return (
              <span key={rank} className="flex items-center gap-2">
                <svg width="32" height="12" overflow="visible">
                  <line x1="0" y1="6" x2="26" y2="6" stroke={s.color} strokeWidth={s.width} strokeDasharray={s.dash} />
                  <path d="M26,1 L36,6 L26,11 Z" fill={s.color} />
                </svg>
                {s.label}
              </span>
            )
          })}
          <span className="text-gray-400">Bubble size &amp; number = total points &nbsp;·&nbsp; Drag nodes to rearrange</span>
        </div>
      </div>
    </div>
  )
}
