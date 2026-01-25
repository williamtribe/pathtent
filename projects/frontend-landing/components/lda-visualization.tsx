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
import { TrendingUp, FileText, Hash } from "lucide-react"
import type { LDAResponse, CollectResponse } from "../lib/api"

// Modern color palette (bright, accessible)
const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#f43f5e", // rose
]

interface LDAVisualizationProps {
  ldaResult: LDAResponse
  collectResult: CollectResponse
}

export function LDAVisualization({
  ldaResult,
  collectResult,
}: LDAVisualizationProps) {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"overview" | "keywords" | "documents">("overview")

  // Process topic data with real MDS coordinates (Jensen-Shannon divergence)
  const topicData = useMemo(() => {
    const topicCounts = new Map<number, number>()
    ldaResult.documents.forEach((doc) => {
      topicCounts.set(doc.topic_id, (topicCounts.get(doc.topic_id) || 0) + 1)
    })

    return ldaResult.topics.map((topic, idx) => {
      const count = topicCounts.get(topic.id) || 0
      // Use real MDS coordinates from backend (centered at origin)
      const x = topic.coordinate?.x ?? 0
      const y = topic.coordinate?.y ?? 0
      
      return {
        ...topic,
        x,
        y,
        z: count,
        count,
        color: COLORS[idx % COLORS.length],
        displayLabel: topic.label || topic.keywords.slice(0, 3).join(", "),
      }
    })
  }, [ldaResult])

  // Fixed axis domain: JS divergence is 0-1, so MDS coords are roughly -1 to 1
  const axisDomain = { min: -1, max: 1 }

  // Pie chart data with keyword labels
  const pieData = useMemo(() => {
    return topicData.map((t) => ({
      name: t.displayLabel,
      value: t.count,
      color: t.color,
      id: t.id,
    }))
  }, [topicData])

  // Selected topic details
  const selectedTopic = useMemo(() => {
    if (selectedTopicId === null) return null
    return topicData.find((t) => t.id === selectedTopicId)
  }, [selectedTopicId, topicData])

  // Keywords bar chart data with real LDA weights
  const keywordData = useMemo(() => {
    if (!selectedTopic) return []
    const topic = ldaResult.topics.find((t) => t.id === selectedTopic.id)
    if (!topic) return []
    const weights = topic.keyword_weights || []
    return topic.keywords.slice(0, 10).map((kw, idx) => ({
      keyword: kw,
      weight: weights[idx] ?? 0,
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
      className="rounded-2xl border border-border bg-white p-6 shadow-sm"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-text">
          Topic Analysis
        </h3>
        <p className="text-sm text-text-muted">
          {ldaResult.num_topics} topics from {ldaResult.documents.length} patents
          {" "}|{" "}
          Coherence: {ldaResult.coherence_score.toFixed(3)}
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border">
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
                : "border-transparent text-text-muted hover:text-text"
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
            {/* Topic Map (Jensen-Shannon Divergence + MDS) */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <h4 className="mb-1 text-sm font-semibold text-text">
                Topic Map
              </h4>
              <p className="mb-3 text-xs text-text-muted">
                Distance = Jensen-Shannon divergence. Similar topics cluster together.
              </p>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 40 }}>
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    domain={[axisDomain.min, axisDomain.max]} 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickFormatter={(v) => v.toFixed(2)}
                    label={{ value: "MDS Dimension 1", position: "bottom", offset: 15, fontSize: 11, fill: "#6b7280" }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    domain={[axisDomain.min, axisDomain.max]} 
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "#d1d5db" }}
                    tickFormatter={(v) => v.toFixed(2)}
                    label={{ value: "MDS Dimension 2", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#6b7280" }}
                  />
                  <ZAxis type="number" dataKey="z" range={[300, 1500]} />
                  <Tooltip
                    content={({ payload }) => {
                      if (!payload?.[0]?.payload) return null
                      const data = payload[0].payload
                      return (
                        <div className="rounded-lg border border-border bg-white p-3 shadow-lg">
                          <p className="font-semibold text-text">
                            {data.displayLabel}
                          </p>
                          <p className="text-sm text-text-muted">
                            {data.count} patents
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
                            ? 0.85
                            : 0.3
                        }
                        stroke={selectedTopicId === entry.id ? "#1f2937" : "white"}
                        strokeWidth={selectedTopicId === entry.id ? 3 : 1}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution Pie */}
            <div className="rounded-xl border border-border bg-surface p-4">
              <h4 className="mb-3 text-sm font-semibold text-text">
                Topic Distribution
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={(data) => setSelectedTopicId(data.id)}
                    style={{ cursor: "pointer" }}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        opacity={
                          selectedTopicId === null || selectedTopicId === entry.id
                            ? 1
                            : 0.4
                        }
                        stroke={selectedTopicId === entry.id ? "#1f2937" : "white"}
                        strokeWidth={selectedTopicId === entry.id ? 2 : 1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value} patents`, "Count"]}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: "12px" }}
                    formatter={(value) => <span className="text-text-muted">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Topic Cards */}
            <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-2">
              <h4 className="mb-3 text-sm font-semibold text-text">
                All Topics
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {topicData.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-all ${
                      selectedTopicId === topic.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-white hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: topic.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-text line-clamp-1">
                          {topic.displayLabel}
                        </span>
                        <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-muted">
                          {topic.count}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-text-muted line-clamp-2">
                        {topic.keywords.slice(3, 8).join(", ")}
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
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: selectedTopic.color }}
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-text">
                      {selectedTopic.displayLabel}
                    </h4>
                    <p className="text-sm text-text-muted">
                      {selectedTopic.count} patents in this topic
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={keywordData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="keyword"
                        tick={{ fontSize: 14, fill: "#374151" }}
                        width={120}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        formatter={(value) => [`Relevance: ${value}`, ""]}
                        contentStyle={{ borderRadius: "8px" }}
                      />
                      <Bar dataKey="weight" radius={[0, 6, 6, 0]}>
                        {keywordData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.fill}
                            opacity={1 - index * 0.06}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface text-text-muted">
                <Hash className="mb-2 h-8 w-8" />
                <p>Select a topic from Overview to see keywords</p>
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
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: selectedTopic.color }}
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-text">
                      {selectedTopic.displayLabel}
                    </h4>
                    <p className="text-sm text-text-muted">
                      Top 10 patents by relevance
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {topicDocuments.map((doc, idx) => (
                    <div
                      key={doc.patent_id}
                      className="flex items-start gap-4 rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-text-muted">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-text">
                          {doc.patent?.title || doc.patent_id}
                        </p>
                        <p className="mt-1 text-sm text-text-muted">
                          {doc.patent_id}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${doc.probability * 100}%`,
                                backgroundColor: selectedTopic.color,
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-text-muted">
                            {(doc.probability * 100).toFixed(1)}% match
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface text-text-muted">
                <FileText className="mb-2 h-8 w-8" />
                <p>Select a topic from Overview to see patents</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
