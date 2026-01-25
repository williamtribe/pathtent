// @TODO-12 — Create LDA analysis page
"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Search,
  Loader2,
  Layers,
  FileText,
  BarChart3,
} from "lucide-react"
import {
  collectPatents,
  analyzeLDA,
  type CollectResponse,
  type LDAResponse,
} from "../../../lib/api"
import { LDAVisualization } from "../../../components/lda-visualization"

export default function LDAPage() {
  const [formula, setFormula] = useState("")
  const [maxResults, setMaxResults] = useState(100)
  const [numTopics, setNumTopics] = useState<number | "auto">("auto")
  const [isCollecting, setIsCollecting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collectResult, setCollectResult] = useState<CollectResponse | null>(null)
  const [ldaResult, setLdaResult] = useState<LDAResponse | null>(null)
  const [showVisualization, setShowVisualization] = useState(false)

  const handleCollect = async () => {
    if (!formula.trim()) {
      setError("Please enter a search formula.")
      return
    }

    setIsCollecting(true)
    setError(null)
    setCollectResult(null)
    setLdaResult(null)
    setShowVisualization(false)

    try {
      const data = await collectPatents({
        formula,
        max_results: maxResults,
      })
      setCollectResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collection failed.")
    } finally {
      setIsCollecting(false)
    }
  }

  const handleAnalyze = async () => {
    if (!collectResult || collectResult.patents.length < 10) {
      setError("At least 10 patents are required for LDA analysis.")
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setLdaResult(null)
    setShowVisualization(false)

    try {
      const patents = collectResult.patents.map((p) => ({
        id: p.application_number,
        text: `${p.title} ${p.abstract || ""}`,
      }))

      const data = await analyzeLDA({
        patents,
        num_topics: numTopics,
      })
      setLdaResult(data)
      setShowVisualization(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "LDA analysis failed.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-white text-text">
      <header className="border-b border-border bg-white px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <Layers className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold md:text-4xl">LDA Topic Analysis</h1>
          </div>
          <p className="mt-2 text-lg text-text-muted">
            Collect patents and analyze technology topics using LDA topic modeling
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Step 1: Collection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-border bg-white p-6"
        >
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <FileText className="h-5 w-5 text-primary" />
            Step 1: Collect Patents
          </h2>

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[300px] flex-1">
              <label className="mb-2 block text-sm font-medium">
                Search Formula
              </label>
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCollect()}
                placeholder="e.g., autonomous driving AND sensor"
                className="w-full rounded-lg border border-border p-3 transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="w-32">
              <label className="mb-2 block text-sm font-medium">Max Results</label>
              <input
                type="number"
                value={maxResults}
                onChange={(e) =>
                  setMaxResults(Math.min(5000, Math.max(10, Number(e.target.value))))
                }
                min={10}
                max={5000}
                className="w-full rounded-lg border border-border p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <button
              onClick={handleCollect}
              disabled={isCollecting || isAnalyzing}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCollecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Collecting...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  Collect
                </>
              )}
            </button>
          </div>

          {collectResult && (
            <div className="mt-4 rounded-lg bg-green-50 p-4 text-green-800">
              Collected <span className="font-semibold">{collectResult.collected}</span> patents
              (Total: {collectResult.total})
            </div>
          )}
        </motion.div>

        {/* Step 2: LDA Analysis */}
        {collectResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg border border-border bg-white p-6"
          >
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <BarChart3 className="h-5 w-5 text-primary" />
              Step 2: LDA Topic Modeling
            </h2>

            <div className="flex flex-wrap items-end gap-4">
              <div className="w-48">
                <label className="mb-2 block text-sm font-medium">
                  Number of Topics
                </label>
                <select
                  value={numTopics}
                  onChange={(e) =>
                    setNumTopics(
                      e.target.value === "auto" ? "auto" : Number(e.target.value),
                    )
                  }
                  className="w-full rounded-lg border border-border p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="auto">Auto (Optimized)</option>
                  {[3, 5, 7, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n} Topics
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || isCollecting}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Layers className="h-5 w-5" />
                    Run LDA
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Results - New Visualization Component */}
        {ldaResult && collectResult && showVisualization && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LDAVisualization
              ldaResult={ldaResult}
              collectResult={collectResult}
            />
          </motion.div>
        )}

        {/* Empty State */}
        {!collectResult && !isCollecting && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Layers className="mb-4 h-16 w-16 text-text-muted/50" />
            <h2 className="text-xl font-semibold text-text-muted">
              Enter a search formula and collect patents
            </h2>
            <p className="mt-2 text-text-muted">
              Patents will be analyzed using LDA topic modeling to identify
              technology clusters
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
