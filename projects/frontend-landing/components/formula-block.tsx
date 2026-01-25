"use client"

import { useState } from "react"
import { X, Plus, ChevronDown, Trash2 } from "lucide-react"
import { motion } from "motion/react"
import type { FormulaBlock } from "../lib/api"

const FIELD_OPTIONS = [
  { value: "TAC", label: "TAC (Title+Abstract+Claims)" },
  { value: "TI", label: "TI (Title)" },
  { value: "AB", label: "AB (Abstract)" },
  { value: "CL", label: "CL (Claims)" },
  { value: "IPC", label: "IPC (Classification)" },
]

const OPERATOR_OPTIONS = [
  { value: "OR", label: "OR" },
  { value: "AND", label: "AND" },
]

interface FormulaBlockProps {
  block: FormulaBlock
  onChange: (block: FormulaBlock) => void
  onDelete: () => void
  canDelete: boolean
}

export function FormulaBlockComponent({
  block,
  onChange,
  onDelete,
  canDelete,
}: FormulaBlockProps) {
  const [newKeyword, setNewKeyword] = useState("")
  const [isEditingName, setIsEditingName] = useState(false)

  const handleAddKeyword = () => {
    const trimmed = newKeyword.trim()
    if (trimmed && !block.keywords.includes(trimmed)) {
      onChange({
        ...block,
        keywords: [...block.keywords, trimmed],
      })
      setNewKeyword("")
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    onChange({
      ...block,
      keywords: block.keywords.filter((k) => k !== keyword),
    })
  }

  const handleFieldChange = (field: string) => {
    onChange({ ...block, field })
  }

  const handleOperatorChange = (operator: string) => {
    onChange({ ...block, operator })
  }

  const handleNameChange = (name: string) => {
    onChange({ ...block, name })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-xl border border-border bg-white p-4 shadow-sm"
    >
      {/* Block Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <input
              type="text"
              value={block.name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
              className="rounded border border-border bg-surface px-2 py-1 text-sm font-medium"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-sm font-medium text-text hover:text-primary"
            >
              {block.name}
            </button>
          )}
        </div>

        {canDelete && (
          <button
            onClick={onDelete}
            className="rounded p-1 text-text-muted hover:bg-red-50 hover:text-red-500"
            title="Delete block"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Field and Operator Selectors */}
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative">
          <select
            value={block.field}
            onChange={(e) => handleFieldChange(e.target.value)}
            className="appearance-none rounded-lg border border-border bg-surface px-3 py-1.5 pr-8 text-sm"
          >
            {FIELD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        </div>

        <div className="relative">
          <select
            value={block.operator}
            onChange={(e) => handleOperatorChange(e.target.value)}
            className="appearance-none rounded-lg border border-border bg-surface px-3 py-1.5 pr-8 text-sm"
          >
            {OPERATOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        </div>
      </div>

      {/* Keywords */}
      <div className="mb-3 flex flex-wrap gap-2">
        {block.keywords.map((keyword) => (
          <motion.span
            key={keyword}
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
          >
            {keyword}
            <button
              onClick={() => handleRemoveKeyword(keyword)}
              className="ml-1 rounded-full p-0.5 hover:bg-primary/20"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </div>

      {/* Add Keyword Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="키워드 추가..."
          className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm placeholder:text-text-muted"
        />
        <button
          onClick={handleAddKeyword}
          disabled={!newKeyword.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          추가
        </button>
      </div>
    </motion.div>
  )
}
