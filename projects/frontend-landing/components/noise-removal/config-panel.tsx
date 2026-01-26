"use client"

import { useState, useCallback, type KeyboardEvent } from "react"
import { Plus, X, Settings } from "lucide-react"

export interface NoiseRemovalConfig {
  main_category: string
  sub_categories: string[]
  include_ipc: string[]
  exclude_ipc: string[]
  required_keywords: string[]
  exclude_keywords: string[]
  use_embedding_filter: boolean
  embedding_threshold: number
}

interface ConfigPanelProps {
  config: NoiseRemovalConfig
  onChange: (config: NoiseRemovalConfig) => void
}

interface TagInputProps {
  label: string
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

function TagInput({ label, tags, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("")

  const handleAdd = useCallback(() => {
    const trimmed = input.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
      setInput("")
    }
  }, [input, tags, onChange])

  const handleRemove = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag))
    },
    [tags, onChange]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        handleAdd()
      }
    },
    [handleAdd]
  )

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-lg bg-slate-100 px-3 py-2 text-slate-600 transition-colors hover:bg-slate-200"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemove(tag)}
                className="rounded-full p-0.5 transition-colors hover:bg-blue-200"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const updateConfig = useCallback(
    <K extends keyof NoiseRemovalConfig>(key: K, value: NoiseRemovalConfig[K]) => {
      onChange({ ...config, [key]: value })
    },
    [config, onChange]
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Settings className="h-5 w-5 text-blue-600" />
        설정
      </h2>

      <div className="space-y-6">
        {/* Main Category */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">대분류</label>
          <input
            type="text"
            value={config.main_category}
            onChange={(e) => updateConfig("main_category", e.target.value)}
            placeholder="예: 디스플레이 센서 기술"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
          />
        </div>

        {/* Sub Categories */}
        <TagInput
          label="중분류"
          tags={config.sub_categories}
          onChange={(tags) => updateConfig("sub_categories", tags)}
          placeholder="예: 터치, 압력, 지문"
        />

        {/* IPC Filters */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">IPC 코드 필터링</h3>

          <div className="space-y-4">
            <TagInput
              label="포함 IPC (해당 패턴만 포함)"
              tags={config.include_ipc}
              onChange={(tags) => updateConfig("include_ipc", tags)}
              placeholder="예: G06F-003*, G06K-009*"
            />

            <TagInput
              label="제외 IPC (해당 패턴 제외)"
              tags={config.exclude_ipc}
              onChange={(tags) => updateConfig("exclude_ipc", tags)}
              placeholder="예: E04*, B23K*"
            />
          </div>
        </div>

        {/* Keyword Filters */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">키워드 필터링</h3>
          <p className="mb-4 text-xs text-slate-500">
            필수 키워드는 OR 조건: 하나라도 매칭되면 유지. 유사어/오탈자 변형 포함 권장.
          </p>

          <div className="space-y-4">
            <TagInput
              label="필수 키워드 (OR 조건)"
              tags={config.required_keywords}
              onChange={(tags) => updateConfig("required_keywords", tags)}
              placeholder="예: 디스플레이, display, 표시장치"
            />

            <TagInput
              label="제외 키워드"
              tags={config.exclude_keywords}
              onChange={(tags) => updateConfig("exclude_keywords", tags)}
              placeholder="예: 콘크리트, 용접"
            />
          </div>
        </div>

        {/* Embedding Filter */}
        <div className="border-t border-slate-200 pt-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-800">임베딩 필터링 (선택)</h3>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={config.use_embedding_filter}
              onChange={(e) => updateConfig("use_embedding_filter", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">임베딩 유사도 필터링 사용</span>
          </label>

          {config.use_embedding_filter && (
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                유사도 임계값: {config.embedding_threshold.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.embedding_threshold}
                onChange={(e) => updateConfig("embedding_threshold", parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500">
                <span>0.0 (느슨)</span>
                <span>1.0 (엄격)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
