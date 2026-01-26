"use client"

import { useState, useCallback } from "react"
import { motion } from "motion/react"
import { Filter, Loader2, ArrowRight } from "lucide-react"
import { ConfigPanel, type NoiseRemovalConfig } from "../../../components/noise-removal/config-panel"
import { ResultsPanel, type NoiseRemovalResult } from "../../../components/noise-removal/results-panel"
import { processNoiseRemoval, type FreeSearchResult } from "../../../lib/api"

const DEFAULT_CONFIG: NoiseRemovalConfig = {
  main_category: "",
  sub_categories: [],
  include_ipc: [],
  exclude_ipc: [],
  required_keywords: [],
  exclude_keywords: [],
  use_embedding_filter: false,
  embedding_threshold: 0.5,
}

export default function NoiseRemovalPage() {
  const [config, setConfig] = useState<NoiseRemovalConfig>(DEFAULT_CONFIG)
  const [patents, setPatents] = useState<FreeSearchResult[]>([])
  const [patentsText, setPatentsText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<NoiseRemovalResult | null>(null)

  const handleProcess = useCallback(async () => {
    if (patents.length === 0) {
      setError("특허 데이터를 입력해주세요.")
      return
    }

    if (!config.main_category.trim()) {
      setError("대분류를 입력해주세요.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await processNoiseRemoval({
        patents,
        config,
      })
      setResult(response.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [patents, config])

  const handlePatentsTextChange = useCallback((text: string) => {
    setPatentsText(text)
    try {
      if (text.trim()) {
        const parsed = JSON.parse(text) as FreeSearchResult[]
        if (Array.isArray(parsed)) {
          setPatents(parsed)
          setError(null)
        }
      } else {
        setPatents([])
      }
    } catch {
      // Invalid JSON, keep current patents
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900">
            <Filter className="h-8 w-8 text-blue-600" />
            노이즈 제거
          </h1>
          <p className="mt-2 text-slate-600">
            4단계 파이프라인으로 특허 검색 결과에서 노이즈를 제거합니다.
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Config */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ConfigPanel config={config} onChange={setConfig} />

            {/* Patent Data Input */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-900">특허 데이터 입력</h3>
              <textarea
                value={patentsText}
                onChange={(e) => handlePatentsTextChange(e.target.value)}
                placeholder='특허 데이터 JSON 배열을 붙여넣으세요...
[{"application_number": "...", "invention_name": "...", "abstract": "...", "ipc_number": "..."}, ...]'
                className="h-40 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              />
              <p className="mt-2 text-sm text-slate-500">
                {patents.length > 0 ? `${patents.length}건의 특허 데이터 로드됨` : "JSON 배열 형식으로 입력"}
              </p>
            </div>

            {/* Process Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleProcess}
              disabled={isLoading || patents.length === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white shadow-lg transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Filter className="h-5 w-5" />
                  노이즈 제거 실행
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
              >
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* Right Column: Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ResultsPanel result={result} isLoading={isLoading} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
