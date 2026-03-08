'use client'

import { useState, useRef } from 'react'
import { renameSession } from './actions'
import LoadingOverlay from '@/components/LoadingOverlay'

export default function RenameSession({ sessionId, initialName }: { sessionId: string; initialName: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function save() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === initialName) {
      setName(initialName)
      setEditing(false)
      return
    }
    setSaving(true)
    await renameSession(sessionId, trimmed)
    setSaving(false)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') save()
    if (e.key === 'Escape') { setName(initialName); setEditing(false) }
  }

  if (editing) {
    return (
      <>
        {saving && <LoadingOverlay />}
        <input
          ref={inputRef}
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={save}
          onKeyDown={handleKeyDown}
          disabled={saving}
          className="font-semibold text-gray-900 text-sm bg-white border border-brand-400 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-brand-300 min-w-0 w-48"
          autoFocus
        />
      </>
    )
  }

  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="font-semibold text-gray-900 text-sm truncate">{name}</span>
      <button
        onClick={startEdit}
        className="text-gray-300 hover:text-brand-500 transition-colors shrink-0"
        title="Rename session"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
    </div>
  )
}
