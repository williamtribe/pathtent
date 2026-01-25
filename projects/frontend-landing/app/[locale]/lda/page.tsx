// @TODO-12 — Create LDA analysis page
"use client"

import { useState } from "react"
import { motion } from "motion/react"
import {
  Search,
  Loader2,
  Layers,
  Info,
  FileText,
  BarChart3,
  ExternalLink,
} from "lucide-react"
import {
  collectPatents,
  analyzeLDA,
  openLDAVisualization,
  type CollectResponse,
  type LDAResponse,
  type Topic,
} from "../../../lib/api"

export default function LDAPage() {
  const [formula, setFormula] = useState("")
  const [maxResults, setMaxResults] = useState(100)
  const [numTopics, setNumTopics] = useState<number | "auto">("auto")
  const [isCollecting, setIsCollecting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingViz, setIsLoadingViz] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collectResult, setCollectResult] = useState<CollectResponse | null>(null)
  const [ldaResult, setLdaResult] = useState<LDAResponse | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)

  const handleCollect = async () => {
    if (!formula.trim()) {
      setError("Please enter a search formula.")
      return
    }

    setIsCollecting(true)
    setError(null)
    setCollectResult(null)
    setLdaResult(null)
    setSelectedTopic(null)

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
    setSelectedTopic(null)

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
      if (data.topics.length > 0 && data.topics[0]) {
        setSelectedTopic(data.topics[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "LDA analysis failed.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getTopicPatents = (topicId: number) => {
    if (!ldaResult || !collectResult) return []
    return ldaResult.documents
      .filter((d) => d.topic_id === topicId)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10)
      .map((d) => {
        const patent = collectResult.patents.find(
          (p) => p.application_number === d.patent_id,
        )
        return { ...d, patent }
      })
  }

  const handleOpenVisualization = async () => {
    if (!collectResult) return

    setIsLoadingViz(true)
    setError(null)

    try {
      const patents = collectResult.patents.map((p) => ({
        id: p.application_number,
        text: `${p.title} ${p.abstract || ""}`,
      }))

      await openLDAVisualization({
        patents,
        num_topics: numTopics,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load visualization.")
    } finally {
      setIsLoadingViz(false)
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
                  setMaxResults(Math.min(500, Math.max(10, Number(e.target.value))))
                }
                min={10}
                max={500}
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
                disabled={isAnalyzing || isCollecting || isLoadingViz}
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

              {ldaResult && (
                <button
                  onClick={handleOpenVisualization}
                  disabled={isLoadingViz || isAnalyzing}
                  className="flex items-center gap-2 rounded-lg border border-primary bg-white px-6 py-3 font-semibold text-primary transition-all hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoadingViz ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-5 w-5" />
                      Open Visualization
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {ldaResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-4"
          >
            {/* Topics List */}
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Info className="h-5 w-5 text-primary" />
                  Analysis Results
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Topics</dt>
                    <dd className="font-medium">{ldaResult.num_topics}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Vocabulary</dt>
                    <dd className="font-medium">{ldaResult.vocabulary_size}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">Coherence</dt>
                    <dd className="font-medium">
                      {ldaResult.coherence_score.toFixed(3)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-border bg-white p-4">
                <h3 className="mb-3 font-semibold">Topics</h3>
                <ul className="space-y-2 text-sm">
                  {ldaResult.topics.map((topic) => (
                    <li
                      key={topic.id}
                      onClick={() => setSelectedTopic(topic)}
                      className={`cursor-pointer rounded p-3 transition-colors ${
                        selectedTopic?.id === topic.id
                          ? "border border-primary bg-primary/5"
                          : "hover:bg-surface"
                      }`}
                    >
                      <div className="mb-1 font-medium">Topic {topic.id + 1}</div>
                      <div className="text-xs text-text-muted">
                        {topic.keywords.slice(0, 5).join(", ")}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Topic Details */}
            <div className="lg:col-span-3 space-y-4">
              {selectedTopic && (
                <>
                  <div className="rounded-lg border border-border bg-white p-6">
                    <h3 className="mb-4 text-lg font-semibold">
                      Topic {selectedTopic.id + 1} Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopic.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
                          style={{
                            opacity: 1 - idx * 0.08,
                          }}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-white p-6">
                    <h3 className="mb-4 text-lg font-semibold">
                      Top Patents in Topic {selectedTopic.id + 1}
                    </h3>
                    <div className="space-y-3">
                      {getTopicPatents(selectedTopic.id).map((item) => (
                        <div
                          key={item.patent_id}
                          className="rounded-lg border border-border p-4"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="font-mono text-sm text-text-muted">
                              {item.patent_id}
                            </span>
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              {(item.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="font-medium">
                            {item.patent?.title || "Title not available"}
                          </div>
                          {item.patent?.applicant && (
                            <div className="mt-1 text-sm text-text-muted">
                              {item.patent.applicant}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
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
