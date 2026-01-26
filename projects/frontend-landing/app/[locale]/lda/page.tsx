// @TODO-12 — Unified LDA analysis page with integrated pipeline
"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Sparkles,
  Loader2,
  Layers,
  Search,
  Filter,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Circle,
} from "lucide-react"
import { runAnalysisPipeline, type PipelineResponse, type NoiseRemovalConfig } from "../../../lib/api"
import { LDAVisualization } from "../../../components/lda-visualization"

// Step status component
function StepStatus({
  step,
  status,
  count,
  message,
  isActive,
}: {
  step: string
  status: string
  count?: number | null
  message?: string | null
  isActive: boolean
}) {
  const stepLabels: Record<string, { icon: React.ReactNode; label: string }> = {
    keyword_extraction: { icon: <Sparkles className="h-4 w-4" />, label: "키워드 추출" },
    kipris_search: { icon: <Search className="h-4 w-4" />, label: "특허 검색" },
    noise_removal: { icon: <Filter className="h-4 w-4" />, label: "노이즈 제거" },
    lda_analysis: { icon: <BarChart3 className="h-4 w-4" />, label: "LDA 분석" },
  }

  const { icon, label } = stepLabels[step] || { icon: <Circle className="h-4 w-4" />, label: step }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg p-3 ${
        status === "completed"
          ? "bg-green-50 text-green-800"
          : status === "failed"
            ? "bg-red-50 text-red-800"
            : isActive
              ? "bg-blue-50 text-blue-800"
              : "bg-gray-50 text-gray-500"
      }`}
    >
      <div className="flex-shrink-0">
        {status === "completed" ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : status === "failed" ? (
          <XCircle className="h-5 w-5 text-red-600" />
        ) : isActive ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        ) : (
          <Circle className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 font-medium">
          {icon}
          {label}
          {count !== undefined && count !== null && (
            <span className="text-sm font-normal">({count.toLocaleString()}건)</span>
          )}
        </div>
        {message && <div className="mt-1 text-sm opacity-75">{message}</div>}
      </div>
    </div>
  )
}

// Noise config editor component
function NoiseConfigEditor({
  config,
  onChange,
}: {
  config: NoiseRemovalConfig
  onChange: (config: NoiseRemovalConfig) => void
}) {
  const updateField = <K extends keyof NoiseRemovalConfig>(key: K, value: NoiseRemovalConfig[K]) => {
    onChange({ ...config, [key]: value })
  }

  return (
    <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">필수 키워드 (OR 조건)</label>
        <input
          type="text"
          value={config.required_keywords.join(", ")}
          onChange={(e) => updateField("required_keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          className="w-full rounded border border-slate-300 p-2 text-sm"
          placeholder="키워드1, 키워드2, ..."
        />
        <p className="mt-1 text-xs text-slate-500">하나라도 매칭되면 유지됩니다</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">제외 키워드</label>
        <input
          type="text"
          value={config.exclude_keywords.join(", ")}
          onChange={(e) => updateField("exclude_keywords", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
          className="w-full rounded border border-slate-300 p-2 text-sm"
          placeholder="제외할 키워드..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">포함 IPC</label>
          <input
            type="text"
            value={config.include_ipc.join(", ")}
            onChange={(e) => updateField("include_ipc", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            className="w-full rounded border border-slate-300 p-2 text-sm"
            placeholder="G06F*, B60L*"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">제외 IPC</label>
          <input
            type="text"
            value={config.exclude_ipc.join(", ")}
            onChange={(e) => updateField("exclude_ipc", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            className="w-full rounded border border-slate-300 p-2 text-sm"
            placeholder="E04*, B23K*"
          />
        </div>
      </div>
    </div>
  )
}

export default function LDAPage() {
  // Input state
  const [description, setDescription] = useState("")
  const [maxPatents, setMaxPatents] = useState(500)
  const [numTopics, setNumTopics] = useState<number | "auto">("auto")
  const [enableNoiseRemoval, setEnableNoiseRemoval] = useState(true)

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customNoiseConfig, setCustomNoiseConfig] = useState<NoiseRemovalConfig | null>(null)

  // Pipeline state
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PipelineResponse | null>(null)

  const handleRun = useCallback(async () => {
    if (!description.trim() || description.length < 10) {
      setError("분석하고자 하는 기술을 10자 이상으로 설명해주세요.")
      return
    }

    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      const response = await runAnalysisPipeline({
        description,
        max_patents: maxPatents,
        num_topics: numTopics,
        enable_noise_removal: enableNoiseRemoval,
        noise_removal_config: customNoiseConfig,
      })

      setResult(response)

      // Update custom noise config with generated one if not already set
      if (!customNoiseConfig && response.generated_noise_config) {
        setCustomNoiseConfig(response.generated_noise_config)
      }

      if (response.error) {
        setError(response.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "파이프라인 실행 실패")
    } finally {
      setIsRunning(false)
    }
  }, [description, maxPatents, numTopics, enableNoiseRemoval, customNoiseConfig])

  // Convert pipeline result to format expected by LDAVisualization
  const collectResult = result?.search_summary
    ? {
        total: result.search_summary.total_found,
        collected: result.noise_removal_summary?.output_count ?? result.search_summary.collected,
        patents: [], // Visualization doesn't need full patent list
        formula: result.search_summary.search_keywords.join(" "), // Keywords used for search
      }
    : null

  return (
    <main className="min-h-screen w-full bg-white text-text">
      <header className="border-b border-border bg-white px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold md:text-4xl">기술 토픽 분석</h1>
          </div>
          <p className="mt-2 text-lg text-text-muted">
            자연어로 기술을 설명하면 AI가 특허를 수집하고 토픽을 분석합니다
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-border bg-white p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            기술 설명 입력
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                분석하고 싶은 기술을 자연어로 설명하세요
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="예: 전기자동차 배터리 충전 기술, 특히 급속 충전과 무선 충전 관련 특허를 분석하고 싶습니다. 리튬이온 배터리와 전고체 배터리 기술도 포함해주세요."
                className="h-32 w-full resize-none rounded-lg border border-border p-3 transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-sm text-text-muted">
                {description.length}자 (최소 10자)
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-4">
              <div className="w-40">
                <label className="mb-2 block text-sm font-medium">최대 특허 수</label>
                <input
                  type="number"
                  value={maxPatents}
                  onChange={(e) => setMaxPatents(Math.min(2000, Math.max(10, Number(e.target.value))))}
                  min={10}
                  max={2000}
                  className="w-full rounded-lg border border-border p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="w-40">
                <label className="mb-2 block text-sm font-medium">토픽 수</label>
                <select
                  value={numTopics}
                  onChange={(e) => setNumTopics(e.target.value === "auto" ? "auto" : Number(e.target.value))}
                  className="w-full rounded-lg border border-border p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="auto">자동 (최적화)</option>
                  {[3, 5, 7, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n}개</option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={enableNoiseRemoval}
                  onChange={(e) => setEnableNoiseRemoval(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm">노이즈 제거 적용</span>
              </label>
            </div>

            {/* Advanced Settings Toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-sm text-text-muted hover:text-primary"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              고급 설정
            </button>

            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {customNoiseConfig ? (
                    <NoiseConfigEditor
                      config={customNoiseConfig}
                      onChange={setCustomNoiseConfig}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
                      분석을 실행하면 AI가 생성한 노이즈 제거 설정이 여기에 표시됩니다.
                      <br />
                      필요시 수정 후 재분석할 수 있습니다.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={isRunning || description.length < 10}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-4 font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  분석 실행
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Pipeline Progress */}
        {(isRunning || result) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg border border-border bg-white p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Layers className="h-5 w-5 text-primary" />
              파이프라인 진행 상황
            </h2>

            <div className="space-y-2">
              {result?.steps.map((step, index) => (
                <StepStatus
                  key={step.step}
                  step={step.step}
                  status={step.status}
                  count={step.count}
                  message={step.message}
                  isActive={isRunning && index === result.steps.length - 1}
                />
              ))}

              {isRunning && (!result || result.steps.length === 0) && (
                <StepStatus
                  step="keyword_extraction"
                  status="running"
                  isActive={true}
                />
              )}
            </div>

            {/* Generated Keywords Preview */}
            {result?.generated_keywords && result.generated_keywords.length > 0 && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-700">AI 생성 키워드</h3>
                <div className="flex flex-wrap gap-2">
                  {result.generated_keywords.map((kw) => (
                    <span
                      key={kw}
                      className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Results - LDA Visualization */}
        {result?.lda_result && collectResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LDAVisualization
              ldaResult={result.lda_result}
              collectResult={collectResult}
            />
          </motion.div>
        )}

        {/* Empty State */}
        {!result && !isRunning && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Sparkles className="mb-4 h-16 w-16 text-text-muted/50" />
            <h2 className="text-xl font-semibold text-text-muted">
              분석하고 싶은 기술을 설명해주세요
            </h2>
            <p className="mt-2 text-text-muted">
              AI가 자동으로 키워드를 추출하고, 특허를 검색하고,
              <br />
              노이즈를 제거한 후 토픽 분석을 수행합니다
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
