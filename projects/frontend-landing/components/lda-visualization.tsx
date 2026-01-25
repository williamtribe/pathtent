"use client"

import { useState, useMemo } from "react"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import { motion, AnimatePresence } from "motion/react"
import { X, TrendingUp, FileText, Hash } from "lucide-react"
import type { LDAResponse, CollectResponse } from "../lib/api"

// Modern color palette
const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f43f5e", // rose
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
]

interface LDAVisualizationProps {
  ldaResult: LDAResponse
  collectResult: CollectResponse
  onClose?: () => void
}

export function LDAVisualization({
  ldaResult,
  collectResult,
  onClose,
}: LDAVisualizationProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "documents">("overview")

  // Calculate topic sizes (number of documents)
  const topicData = useMemo(() => {
    const topicCounts = new Map<number, number>()
    ldaResult.documents.forEach((doc) => {
      topicCounts.set(doc.topic_id, (topicCounts.get(doc.topic_id) || 0) + 1)
    })

    // Simple 2D layout using topic weights and document count
    return ldaResult.topics.map((topic, idx) => {
      const count = topicCounts.get(topic.id) || 0
      const angle = (idx / ldaResult.topics.length) * 2 * Math.PI
      const radius = 40 + topic.weight * 20
      return {
        ...topic,
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
        z: count,
        count,
        color: COLORS[idx % COLORS.length],
      }
    })
  }, [ldaResult])

  // Pie chart data
  const pieData = useMemo(() => {
    return topicData.map((t) => ({
      name: `Topic ${t.id + 1}`,
      value: t.count,
      color: t.color,
    }))
  }, [topicData])

  // Selected topic details
  const selectedTopic = useMemo(() => {
    if (selectedTopicId === null) return null
    return topicData.find((t) => t.id === selectedTopicId)
  }, [selectedTopicId, topicData])

  // Keywords bar chart data
  const keywordData = useMemo(() => {
    if (!selectedTopic) return []
    const topic = ldaResult.topics.find((t) => t.id === selectedTopic.id)
    if (!topic) return []
    return topic.keywords.slice(0, 10).map((kw, idx) => ({
      keyword: kw,
      weight: (10 - idx) * 10, // Approximate weight based on rank
      fill: selectedTopic.color,
    }))
  }, [selectedTopic, ldaResult.topics])

  // Documents for selected topic
  const topicDocuments = useMemo(() => {
    if (selectedTopicId === null) return []
    return ldaResult.documents
      .filter((d) => d.topic_id === selectedTopicId)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10)
      .map((d) => {
        const patent = collectResult.patents.find(
          (p) => p.application_number === d.patent_id
        )
        return { ...d, patent }
      })
  }, [selectedTopicId, ldaResult.documents, collectResult.patents])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-900"
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Topic Analysis
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {ldaResult.num_topics} topics from {ldaResult.documents.length} patents
            {" "}|{" "}
            Coherence: {ldaResult.coherence_score.toFixed(3)}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: "overview", label: "Overview", icon: TrendingUp },
          { id: "keywords", label: "Keywords", icon: Hash },
          { id: "documents", label: "Documents", icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-2"
          >
            {/* Topic Bubbles */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Topic Map
              </h4>
              <p className="mb-2 text-xs text-gray-500">
                Click a bubble to explore
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis type="number" dataKey="x" domain={[0, 100]} hide />
                  <YAxis type="number" dataKey="y" domain={[0, 100]} hide />
                  <ZAxis type="number" dataKey="z" range={[200, 2000]} />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.[0]?.payload) return null
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            Topic {data.id + 1}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {data.count} patents
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {data.keywords.slice(0, 3).join(", ")}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Scatter
                    data={topicData}
                    onClick={(data) => setSelectedTopicId(data.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {topicData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={
                          selectedTopicId === null || selectedTopicId === entry.id
                            ? 0.8
                            : 0.3
                        }
                        stroke={selectedTopicId === entry.id ? "#000" : "none"}
                        strokeWidth={2}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution Pie */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Topic Distribution
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data) => {
                      const topicNum = parseInt(data.name.split(" ")[1] || "1")
                      setSelectedTopicId(topicNum - 1)
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={
                          selectedTopicId === null || selectedTopicId === index
                            ? 1
                            : 0.4
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} patents`, "Count"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Topic List */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50 lg:col-span-2">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                All Topics
              </h4>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {topicData.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                      selectedTopicId === topic.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                    }`}
                  >
                    <div
                      className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: topic.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Topic {topic.id + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {topic.count} docs
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                        {topic.keywords.slice(0, 5).join(", ")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "keywords" && (
          <motion.div
            key="keywords"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {selectedTopic ? (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: selectedTopic.color }}
                  />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Topic {selectedTopic.id + 1} Keywords
                  </h4>
                  <span className="text-sm text-gray-500">
                    ({selectedTopic.count} patents)
                  </span>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={keywordData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="keyword"
                      tick={{ fontSize: 14 }}
                      width={100}
                    />
                    <Tooltip />
                    <Bar dataKey="weight" radius={[0, 4, 4, 0]}>
                      {keywordData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.fill}
                          opacity={1 - index * 0.05}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-500">
                Select a topic from the Overview tab to see keywords
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "documents" && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {selectedTopic ? (
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: selectedTopic.color }}
                  />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Topic {selectedTopic.id + 1} Patents
                  </h4>
                  <span className="text-sm text-gray-500">
                    Top 10 by relevance
                  </span>
                </div>
                <div className="space-y-2">
                  {topicDocuments.map((doc, idx) => (
                    <div
                      key={doc.patent_id}
                      className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {doc.patent?.title || doc.patent_id}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {doc.patent_id}
                        </p>
                        <div className="mt-2 flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${doc.probability * 100}%`,
                                  backgroundColor: selectedTopic.color,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {(doc.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-gray-500">
                Select a topic from the Overview tab to see patents
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
