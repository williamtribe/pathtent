"use client"

import { useState } from "react"
import { X, Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import type { FormulaBlock } from "../lib/api"

const FIELD_OPTIONS = [
  { value: "TAC", label: "TAC (Title+Abstract+Claims)" },
  { value: "TI", label: "TI (Title)" },
  { value: "AB", label: "AB (Abstract)" },
  { value: "CL", label: "CL (Claims)" },
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
  const [isIpcExpanded, setIsIpcExpanded] = useState(false)

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

  const handleNameChange = (name: string) => {
    onChange({ ...block, name })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddKeyword()
    }
  }

   const handleEnabledChange = (enabled: boolean) => {
    onChange({ ...block, enabled })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`rounded-xl border border-border bg-white p-4 shadow-sm transition-opacity ${
        block.enabled === false ? "opacity-50" : ""
      }`}
    >
      {/* Block Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Enabled Checkbox */}
          <input
            type="checkbox"
            checked={block.enabled !== false}
            onChange={(e) => handleEnabledChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            title={block.enabled !== false ? "Disable this category" : "Enable this category"}
          />
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

      {/* Field Selector */}
      <div className="mb-3">
        <div className="relative inline-block">
          <select
            value={block.field}
            onChange={(e) => handleFieldChange(e.target.value)}
            disabled={block.enabled === false}
            className="appearance-none rounded-lg border border-border bg-surface px-3 py-1.5 pr-8 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {FIELD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        </div>
      </div>

      {/* IPC Codes Dropdown */}
      {block.ipc_codes && block.ipc_codes.length > 0 && (
        <div className={`mb-3 ${block.enabled === false ? "opacity-50" : ""}`}>
          <button
            onClick={() => setIsIpcExpanded(!isIpcExpanded)}
            disabled={block.enabled === false}
            className={`flex items-center gap-1 text-xs ${
              block.enabled === false
                ? "text-gray-400 cursor-not-allowed"
                : "text-blue-600 hover:text-blue-700"
            }`}
          >
            <span className="font-medium">IPC:</span>
            <span>
              {block.ipc_codes[0]?.split(":")[0] ?? block.ipc_codes[0]}
              {block.ipc_codes.length > 1 && ` 외 ${block.ipc_codes.length - 1}개`}
            </span>
            {isIpcExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          <AnimatePresence>
            {isIpcExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1 rounded-lg bg-blue-50 p-2">
                  {block.ipc_codes.map((code, idx) => (
                    <div key={idx} className="text-xs text-blue-700">
                      • {code}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Keywords */}
      <div className={`mb-3 flex flex-wrap gap-2 ${block.enabled === false ? "pointer-events-none" : ""}`}>
        {block.keywords.map((keyword) => (
          <motion.span
            key={keyword}
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${
              block.enabled === false
                ? "bg-gray-100 text-gray-400"
                : "bg-primary/10 text-primary"
            }`}
          >
            {keyword}
            <button
              onClick={() => handleRemoveKeyword(keyword)}
              className={`ml-1 rounded-full p-0.5 ${
                block.enabled === false ? "" : "hover:bg-primary/20"
              }`}
              disabled={block.enabled === false}
            >
              <X className="h-3 w-3" />
            </button>
          </motion.span>
        ))}
      </div>

      {/* Add Keyword Input */}
      <div className={`flex gap-2 ${block.enabled === false ? "pointer-events-none opacity-50" : ""}`}>
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="키워드 추가..."
          disabled={block.enabled === false}
          className="flex-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm placeholder:text-text-muted disabled:cursor-not-allowed disabled:bg-gray-50"
        />
        <button
          onClick={handleAddKeyword}
          disabled={!newKeyword.trim() || block.enabled === false}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          추가
        </button>
      </div>
    </motion.div>
  )
}
