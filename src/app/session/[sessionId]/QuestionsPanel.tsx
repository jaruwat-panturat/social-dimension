'use client'

import { useState, useRef } from 'react'
import { addQuestion, deleteQuestion } from './actions'

interface Question {
  id: string
  question_text: string
  order_index: number
}

export default function QuestionsPanel({ sessionId, initialQuestions }: { sessionId: string; initialQuestions: Question[] }) {
  const [questions, setQuestions] = useState(initialQuestions)
  const [newText, setNewText] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function openInput() {
    setShowInput(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const text = newText.trim()
    if (!text) return

    setAdding(true)
    const question = await addQuestion(sessionId, text, questions.length) as Question
    setQuestions(prev => [...prev, question])
    setNewText('')
    setAdding(false)
    inputRef.current?.focus()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setQuestions(prev => prev.filter(q => q.id !== id))
    await deleteQuestion(id)
    setDeletingId(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setShowInput(false)
      setNewText('')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-gray-900">Questions</h2>
          <p className="text-xs text-gray-400 mt-0.5">What participants will answer about each other</p>
        </div>
        <button
          onClick={openInput}
          className="text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium px-3 py-2 rounded-lg transition-colors"
        >
          + Add
        </button>
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
              className={`flex items-start gap-3 bg-gray-50 rounded-xl px-4 py-3 transition-opacity ${deletingId === q.id ? 'opacity-40' : ''}`}
            >
              <span className="text-xs font-bold text-gray-400 mt-0.5 w-4 shrink-0">{i + 1}</span>
              <span className="text-sm text-gray-800 flex-1">{q.question_text}</span>
              <button
                onClick={() => handleDelete(q.id)}
                disabled={!!deletingId}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0 disabled:cursor-not-allowed"
                title="Delete question"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </li>
          ))}
        </ol>
      )}

      {showInput && (
        <form onSubmit={handleAdd} className="flex gap-2 mt-2">
          <input
            ref={inputRef}
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. How well do you know this person?"
            disabled={adding}
            className="flex-1 text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 placeholder-gray-300 transition-colors"
          />
          <button
            type="submit"
            disabled={adding || !newText.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
          >
            {adding ? '...' : 'Add'}
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
