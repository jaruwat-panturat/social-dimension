'use client'

import { useState, useRef } from 'react'
import { addQuestion, updateQuestion, deleteQuestion, reorderQuestions } from './actions'
import LoadingOverlay from '@/components/LoadingOverlay'

interface Question {
  id: string
  question_text: string
  order_index: number
}

export default function QuestionsPanel({ sessionId, initialQuestions, onCountChange, status }: { sessionId: string; initialQuestions: Question[]; onCountChange?: (count: number) => void; status?: string }) {
  const locked = status === 'started' || status === 'closed'
  const [questions, setQuestions] = useState(initialQuestions)
  const [newText, setNewText] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [busy, setBusy] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  function openInput() {
    setShowInput(true)
    setTimeout(() => addInputRef.current?.focus(), 0)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const text = newText.trim()
    if (!text) return

    setBusy(true)
    const question = await addQuestion(sessionId, text, questions.length) as Question
    setQuestions(prev => {
      const next = [...prev, question]
      onCountChange?.(next.length)
      return next
    })
    setNewText('')
    setBusy(false)
    addInputRef.current?.focus()
  }

  function startEdit(q: Question) {
    setEditingId(q.id)
    setEditText(q.question_text)
  }

  async function saveEdit(id: string) {
    const trimmed = editText.trim()
    const original = questions.find(q => q.id === id)?.question_text
    setEditingId(null)
    if (!trimmed || trimmed === original) return

    setBusy(true)
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, question_text: trimmed } : q))
    await updateQuestion(id, trimmed)
    setBusy(false)
  }

  function handleEditKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Enter') saveEdit(id)
    if (e.key === 'Escape') setEditingId(null)
  }

  async function handleDelete(id: string) {
    setBusy(true)
    setDeletingId(id)
    setQuestions(prev => {
      const next = prev.filter(q => q.id !== id)
      onCountChange?.(next.length)
      return next
    })
    await deleteQuestion(id)
    setDeletingId(null)
    setBusy(false)
  }

  function handleDragStart(id: string) {
    setDraggingId(id)
  }

  function handleDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (id !== draggingId) setDragOverId(id)
  }

  async function handleDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const from = questions.findIndex(q => q.id === draggingId)
    const to = questions.findIndex(q => q.id === targetId)
    const reordered = [...questions]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    const updated = reordered.map((q, i) => ({ ...q, order_index: i }))

    setQuestions(updated)
    setDraggingId(null)
    setDragOverId(null)

    await reorderQuestions(updated.map(q => ({ id: q.id, order_index: q.order_index })))
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverId(null)
  }

  return (
    <div>
      {busy && <LoadingOverlay />}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Questions</h2>
          <p className="text-xs text-gray-400 mt-0.5">What participants will answer about each other</p>
        </div>
        {!locked && (
          <button
            onClick={openInput}
            className="text-sm bg-brand-50 hover:bg-brand-100 text-brand-600 font-medium px-3 py-2 rounded-lg transition-colors"
          >
            + Add
          </button>
        )}
      </div>

      {questions.length === 0 && !showInput && (
        <div className="text-center py-8">
          <p className="text-sm font-medium text-gray-400">No questions yet</p>
          <p className="text-xs mt-0.5 text-gray-300">Add questions participants will answer about each other</p>
        </div>
      )}

      {questions.length > 0 && (
        <ol className="space-y-2 mb-3">
          {questions.map((q, i) => (
            <li
              key={q.id}
              draggable={!locked}
              onDragStart={() => handleDragStart(q.id)}
              onDragOver={e => handleDragOver(e, q.id)}
              onDrop={() => handleDrop(q.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 transition-all
                ${deletingId === q.id ? 'opacity-40' : ''}
                ${draggingId === q.id ? 'opacity-40 scale-[0.98]' : ''}
                ${dragOverId === q.id ? 'ring-2 ring-brand-400 ring-offset-1' : ''}
                ${!locked ? 'cursor-default' : ''}
              `}
            >
              {!locked && (
                <svg className="text-gray-300 shrink-0 cursor-grab active:cursor-grabbing" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="5" r="1" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="5" r="1" fill="currentColor" stroke="none" />
                  <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
                  <circle cx="9" cy="19" r="1" fill="currentColor" stroke="none" />
                  <circle cx="15" cy="19" r="1" fill="currentColor" stroke="none" />
                </svg>
              )}

              <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>

              {editingId === q.id ? (
                <input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onBlur={() => saveEdit(q.id)}
                  onKeyDown={e => handleEditKeyDown(e, q.id)}
                  className="flex-1 text-sm px-2 py-1 border border-brand-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
                  autoFocus
                />
              ) : (
                <span
                  className={`text-sm text-gray-800 flex-1 ${!locked ? 'cursor-pointer hover:text-brand-600 transition-colors' : ''}`}
                  onClick={() => !locked && startEdit(q)}
                  title={locked ? undefined : 'Click to edit'}
                >
                  {q.question_text}
                </span>
              )}

              {!locked && (
                <div className="flex items-center gap-1 shrink-0">
                  {editingId !== q.id && (
                    <button
                      onClick={() => startEdit(q)}
                      className="text-gray-300 hover:text-brand-400 transition-colors p-0.5"
                      title="Edit question"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors p-0.5"
                    title="Delete question"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {showInput && !locked && (
        <form onSubmit={handleAdd} className="flex gap-2 mt-2">
          <input
            ref={addInputRef}
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && (setShowInput(false), setNewText(''))}
            placeholder="e.g. How well do you know this person?"
            className="flex-1 text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400 placeholder-gray-300 transition-colors"
          />
          <button
            type="submit"
            disabled={!newText.trim()}
            className="bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => { setShowInput(false); setNewText('') }}
            className="text-gray-400 hover:text-gray-600 px-2 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </form>
      )}
    </div>
  )
}
