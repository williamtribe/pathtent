// @TODO-3 — Unified LDA analysis with step-by-step API calls
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
  RefreshCw,
} from "lucide-react"
import {
  generateFormula,
  searchKIPRIS,
  processNoiseRemoval,
  analyzeLDA,
  type NoiseRemovalConfig,
  type FreeSearchResult,
  type LDAResponse,
  type FormulaResult,
} from "../../../lib/api"
import { LDAVisualization } from "../../../components/lda-visualization"

// Step definition
interface StepState {
  step: string
  status: "pending" | "running" | "completed" | "failed"
  count?: number | null
  message?: string | null
  duration?: number | null // seconds
}

// Step status component
function StepStatus({ stepState }: { stepState: StepState }) {
  const { step, status, count, message } = stepState

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
            : status === "running"
              ? "bg-blue-50 text-blue-800"
              : "bg-gray-50 text-gray-500"
      }`}
    >
      <div className="flex-shrink-0">
        {status === "completed" ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : status === "failed" ? (
          <XCircle className="h-5 w-5 text-red-600" />
        ) : status === "running" ? (
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
          {stepState.duration !== undefined && stepState.duration !== null && (
            <span className="text-sm font-normal text-slate-500">({stepState.duration.toFixed(1)}s)</span>
          )}
        </div>
        {message && <div className="mt-1 text-sm opacity-75">{message}</div>}
      </div>
    </div>
  )
}

// Noise config editor component (similarity-based filtering)
function NoiseConfigEditor({
  config,
  onChange,
  disabled,
}: {
  config: NoiseRemovalConfig
  onChange: (config: NoiseRemovalConfig) => void
  disabled?: boolean
}) {
  return (
    <div className={`space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4 ${disabled ? "opacity-50" : ""}`}>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">유사도 필터링 기준 문장</label>
        <textarea
          value={config.embedding_query}
          onChange={(e) => onChange({ ...config, embedding_query: e.target.value })}
          className="w-full rounded border border-slate-300 p-2 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
          rows={3}
          placeholder="관련 특허를 필터링할 기준이 되는 기술 설명..."
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-slate-500">이 문장과 유사한 특허만 분석에 포함됩니다</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          유사도 임계값: {config.embedding_threshold.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={config.embedding_threshold}
          onChange={(e) => onChange({ ...config, embedding_threshold: parseFloat(e.target.value) })}
          className="w-full disabled:cursor-not-allowed"
          disabled={disabled}
        />
        <div className="flex justify-between text-xs text-slate-500">
          <span>0.0 (느슨함)</span>
          <span>1.0 (엄격함)</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">높을수록 더 관련성 높은 특허만 유지됩니다</p>
      </div>
    </div>
  )
}

// Initial steps state
const initialSteps: StepState[] = [
  { step: "keyword_extraction", status: "pending" },
  { step: "kipris_search", status: "pending" },
  { step: "noise_removal", status: "pending" },
  { step: "lda_analysis", status: "pending" },
]

export default function LDAPage() {
  // Input state
  const [description, setDescription] = useState("")
  const [maxPatents, setMaxPatents] = useState(500)
  const [enableNoiseRemoval, setEnableNoiseRemoval] = useState(true)

  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customNoiseConfig, setCustomNoiseConfig] = useState<NoiseRemovalConfig | null>(null)

  // Pipeline state
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [steps, setSteps] = useState<StepState[]>(initialSteps)

  // Results state
  const [generatedKeywords, setGeneratedKeywords] = useState<string[]>([])
  const [searchSummary, setSearchSummary] = useState<{ total: number; collected: number } | null>(null)
  const [searchedPatents, setSearchedPatents] = useState<FreeSearchResult[]>([])  // Cached search results
  const [filteredPatents, setFilteredPatents] = useState<FreeSearchResult[]>([])
  const [numTopics, setNumTopics] = useState(5)
  const [isRerunningNoiseRemoval, setIsRerunningNoiseRemoval] = useState(false)
  const [isRerunningLDA, setIsRerunningLDA] = useState(false)
  const [ldaResult, setLdaResult] = useState<LDAResponse | null>(null)

  // Helper to update a specific step
  const updateStep = (stepName: string, updates: Partial<StepState>) => {
    setSteps((prev) =>
      prev.map((s) => (s.step === stepName ? { ...s, ...updates } : s))
    )
  }

  const handleRun = useCallback(async () => {
    if (!description.trim() || description.length < 10) {
      setError("분석하고자 하는 기술을 10자 이상으로 설명해주세요.")
      return
    }

    // Reset state
    setIsRunning(true)
    setError(null)
    setSteps(initialSteps)
    setGeneratedKeywords([])
    setSearchSummary(null)
    setFilteredPatents([])
    setLdaResult(null)

    try {
      // ========================================
      // Step 1: Keyword Extraction
      // ========================================
      updateStep("keyword_extraction", { status: "running" })
      let step1Start = performance.now()

      let formulaResult: FormulaResult
      let allKeywords: string[] = []
      try {
        formulaResult = await generateFormula(description, {})
        
        // Collect core keywords + all synonyms (includes typos, variations, etc.)
        if (formulaResult.synonyms && Object.keys(formulaResult.synonyms).length > 0) {
          allKeywords = [
            ...formulaResult.keywords,
            ...Object.values(formulaResult.synonyms).flat(),
          ]
        } else {
          allKeywords = formulaResult.keywords
        }
        // Remove duplicates while preserving order
        allKeywords = [...new Set(allKeywords)]
        setGeneratedKeywords(allKeywords)

        // Auto-generate noise config from description if not set
        if (!customNoiseConfig) {
          setCustomNoiseConfig({
            embedding_query: description,
            embedding_threshold: 0.7,
          })
        }

        const step1Duration = (performance.now() - step1Start) / 1000
        updateStep("keyword_extraction", {
          status: "completed",
          count: allKeywords.length,
          message: allKeywords.slice(0, 5).join(", "),
          duration: step1Duration,
        })
      } catch (err) {
        updateStep("keyword_extraction", {
          status: "failed",
          message: err instanceof Error ? err.message : "키워드 추출 실패",
        })
        throw err
      }

      // ========================================
      // Step 2: KIPRIS Search
      // ========================================
      updateStep("kipris_search", { status: "running" })
      const step2Start = performance.now()

      let patents: FreeSearchResult[]
      try {
        const searchResult = await searchKIPRIS({
          keywords: formulaResult.keywords,
          synonyms: formulaResult.synonyms,
          max_results: maxPatents,
        })
        patents = searchResult.patents
        setSearchedPatents(patents)  // Cache for re-filtering
        setSearchSummary({
          total: searchResult.total_found,
          collected: searchResult.collected,
        })

        const step2Duration = (performance.now() - step2Start) / 1000
        updateStep("kipris_search", {
          status: "completed",
          count: searchResult.collected,
          message: `총 ${searchResult.total_found.toLocaleString()}건 중 ${searchResult.collected}건 수집`,
          duration: step2Duration,
        })
      } catch (err) {
        updateStep("kipris_search", {
          status: "failed",
          message: err instanceof Error ? err.message : "특허 검색 실패",
        })
        throw err
      }

      // ========================================
      // Step 3: Noise Removal (optional)
      // ========================================
      let validPatents = patents

      if (enableNoiseRemoval && patents.length > 0) {
        updateStep("noise_removal", { status: "running" })
        const step3Start = performance.now()

        try {
          const noiseConfig: NoiseRemovalConfig = customNoiseConfig || {
            embedding_query: description,
            embedding_threshold: 0.7,
          }

          const noiseResult = await processNoiseRemoval({
            patents,
            config: noiseConfig,
          })
          validPatents = noiseResult.result.valid_patents

          const step3Duration = (performance.now() - step3Start) / 1000
          updateStep("noise_removal", {
            status: "completed",
            count: validPatents.length,
            message: `${patents.length}건 → ${validPatents.length}건 (${patents.length - validPatents.length}건 제거)`,
            duration: step3Duration,
          })
        } catch (err) {
          updateStep("noise_removal", {
            status: "failed",
            message: err instanceof Error ? err.message : "노이즈 제거 실패",
          })
          throw err
        }
      } else {
        updateStep("noise_removal", {
          status: "completed",
          count: patents.length,
          message: enableNoiseRemoval ? "특허 없음" : "비활성화됨",
          duration: 0,
        })
      }

      setFilteredPatents(validPatents)

      // ========================================
      // Step 4: LDA Analysis
      // ========================================
      if (validPatents.length >= 3) {
        updateStep("lda_analysis", { status: "running" })
        const step4Start = performance.now()

        try {
          const ldaDocuments = validPatents
            .map((patent) => {
              const textParts: string[] = []
              if (patent.invention_name) textParts.push(patent.invention_name)
              if (patent.abstract) textParts.push(patent.abstract)
              return {
                id: patent.application_number || `patent-${Math.random()}`,
                text: textParts.join(" "),
              }
            })
            .filter((doc) => doc.text.trim().length > 0)

          const ldaResponse = await analyzeLDA({
            patents: ldaDocuments,
            num_topics: 5,
          })
          setLdaResult(ldaResponse)

          const step4Duration = (performance.now() - step4Start) / 1000
          updateStep("lda_analysis", {
            status: "completed",
            count: ldaResponse.num_topics,
            message: `${ldaResponse.num_topics}개 토픽 추출 (coherence: ${ldaResponse.coherence_score.toFixed(3)})`,
            duration: step4Duration,
          })
        } catch (err) {
          updateStep("lda_analysis", {
            status: "failed",
            message: err instanceof Error ? err.message : "LDA 분석 실패",
          })
          throw err
        }
      } else {
        updateStep("lda_analysis", {
          status: "completed",
          message: "특허 수 부족 (최소 3건 필요)",
          duration: 0,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "파이프라인 실행 실패")
    } finally {
      setIsRunning(false)
    }
  }, [description, maxPatents, enableNoiseRemoval, customNoiseConfig])

  // Re-run noise removal + LDA with different threshold (using cached search results)
  const handleRerunNoiseRemoval = useCallback(async () => {
    if (searchedPatents.length === 0) {
      setError("캐싱된 검색 결과가 없습니다. 먼저 분석을 실행하세요.")
      return
    }
    if (!customNoiseConfig) {
      setError("노이즈 제거 설정이 없습니다.")
      return
    }

    setIsRerunningNoiseRemoval(true)
    setError(null)
    
    // Update pipeline steps - noise_removal and lda_analysis to running
    updateStep("noise_removal", { status: "running", count: null, message: null, duration: null })
    updateStep("lda_analysis", { status: "pending", count: null, message: null, duration: null })

    try {
      // Step 1: Noise Removal with new threshold
      const step3Start = performance.now()
      const noiseResult = await processNoiseRemoval({
        patents: searchedPatents,
        config: customNoiseConfig,
      })
      const validPatents = noiseResult.result.valid_patents
      setFilteredPatents(validPatents)
      
      const step3Duration = (performance.now() - step3Start) / 1000
      updateStep("noise_removal", {
        status: "completed",
        count: validPatents.length,
        message: `${searchedPatents.length}건 → ${validPatents.length}건 (${searchedPatents.length - validPatents.length}건 제거)`,
        duration: step3Duration,
      })

      // Step 2: LDA Analysis
      if (validPatents.length >= 3) {
        updateStep("lda_analysis", { status: "running" })
        const step4Start = performance.now()
        
        const ldaDocuments = validPatents
          .map((patent) => {
            const textParts: string[] = []
            if (patent.invention_name) textParts.push(patent.invention_name)
            if (patent.abstract) textParts.push(patent.abstract)
            return {
              id: patent.application_number || `patent-${Math.random()}`,
              text: textParts.join(" "),
            }
          })
          .filter((doc) => doc.text.trim().length > 0)

        const newLdaResult = await analyzeLDA({
          patents: ldaDocuments,
          num_topics: numTopics,
        })
        setLdaResult(newLdaResult)
        
        const step4Duration = (performance.now() - step4Start) / 1000
        updateStep("lda_analysis", {
          status: "completed",
          count: newLdaResult.num_topics,
          message: `${newLdaResult.num_topics}개 토픽 추출 (coherence: ${newLdaResult.coherence_score.toFixed(3)})`,
          duration: step4Duration,
        })
      } else {
        setLdaResult(null)
        updateStep("lda_analysis", {
          status: "completed",
          message: `특허 수 부족 (${validPatents.length}건, 최소 3건 필요)`,
          duration: 0,
        })
        setError(`필터링 후 특허가 ${validPatents.length}건으로 LDA 분석이 불가합니다 (최소 3건 필요)`)
      }
    } catch (err) {
      updateStep("noise_removal", { status: "failed", message: err instanceof Error ? err.message : "실패" })
      setError(err instanceof Error ? err.message : "노이즈 제거 재실행 실패")
    } finally {
      setIsRerunningNoiseRemoval(false)
    }
  }, [searchedPatents, customNoiseConfig, numTopics])

  // Re-run LDA with different topic count (without re-running entire pipeline)
  const handleRerunLDA = useCallback(async () => {
    if (filteredPatents.length === 0) {
      setError("재분석할 특허가 없습니다.")
      return
    }

    setIsRerunningLDA(true)
    setError(null)

    try {
      const ldaDocuments = filteredPatents
        .map((patent) => {
          const textParts: string[] = []
          if (patent.invention_name) textParts.push(patent.invention_name)
          if (patent.abstract) textParts.push(patent.abstract)
          return {
            id: patent.application_number || `patent-${Math.random()}`,
            text: textParts.join(" "),
          }
        })
        .filter((doc) => doc.text.trim().length > 0)

      const newLdaResult = await analyzeLDA({
        patents: ldaDocuments,
        num_topics: numTopics,
      })

      setLdaResult(newLdaResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "LDA 재분석 실패")
    } finally {
      setIsRerunningLDA(false)
    }
  }, [filteredPatents, numTopics])

  // Check if pipeline has started (any step not pending)
  const hasStarted = steps.some((s) => s.status !== "pending")

  // Convert to format expected by LDAVisualization
  const collectResult = searchSummary
    ? {
        total: searchSummary.total,
        collected: filteredPatents.length,
        patents: filteredPatents,
        formula: generatedKeywords.join(" "),
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
          <h2 className="mb-4 text-lg font-semibold">
            기술 설명 입력
          </h2>

          <div className="space-y-4">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
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
                    <div className="space-y-3">
                      <NoiseConfigEditor
                        config={customNoiseConfig}
                        onChange={setCustomNoiseConfig}
                        disabled={!enableNoiseRemoval}
                      />
                      {/* Re-filter button (only show if we have cached search results) */}
                      {searchedPatents.length > 0 && enableNoiseRemoval && (
                        <button
                          onClick={handleRerunNoiseRemoval}
                          disabled={isRerunningNoiseRemoval}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRerunningNoiseRemoval ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              재필터링 중...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4" />
                              임계값 변경 후 재필터링 ({searchedPatents.length}건)
                            </>
                          )}
                        </button>
                      )}
                    </div>
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
                "분석 실행"
              )}
            </button>
          </div>
        </motion.div>

        {/* Pipeline Progress */}
        {hasStarted && (
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
              {steps.map((stepState) => (
                <StepStatus key={stepState.step} stepState={stepState} />
              ))}
            </div>

            {/* Generated Keywords Preview */}
            {generatedKeywords.length > 0 && (
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <h3 className="mb-2 text-sm font-semibold text-slate-700">AI 생성 키워드</h3>
                <div className="flex flex-wrap gap-2">
                  {generatedKeywords.map((kw) => (
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
        {ldaResult && collectResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Topic Count Adjustment */}
            <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-white p-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">토픽 수 조정:</label>
                <select
                  value={numTopics}
                  onChange={(e) => setNumTopics(Number(e.target.value))}
                  className="rounded-lg border border-border px-3 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isRerunningLDA}
                >
                  {[3, 5, 7, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}개
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRerunLDA}
                  disabled={isRerunningLDA || filteredPatents.length === 0}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRerunningLDA ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      재분석 중...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      토픽 재분석
                    </>
                  )}
                </button>
              </div>
              <div className="text-sm text-text-muted">
                분석 대상: {filteredPatents.length}건
              </div>
            </div>

            <LDAVisualization
              ldaResult={ldaResult}
              collectResult={collectResult}
            />
          </motion.div>
        )}

        {/* Empty State */}
        {!hasStarted && !isRunning && (
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
