'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { motion } from 'motion/react'
import { Search, Loader2, Network, Info, Play, Pause, SkipBack, SkipForward, Calendar } from 'lucide-react'
import CytoscapeComponent from 'react-cytoscapejs'
import type { Core, ElementDefinition } from 'cytoscape'
import { analyzeSNA, type SNAResult, type SNANode } from '../../../lib/api'

const cytoscapeStylesheet = [
  {
    selector: 'node',
    style: {
      'background-color': '#2563eb',
      label: 'data(label)',
      'text-valign': 'center' as const,
      'text-halign': 'center' as const,
      color: '#fff',
      'font-size': '10px',
      'text-outline-color': '#2563eb',
      'text-outline-width': 2,
      width: 'data(size)',
      height: 'data(size)',
    },
  },
  {
    selector: 'node:selected',
    style: {
      'background-color': '#dc2626',
      'border-width': 3,
      'border-color': '#fca5a5',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 'data(weight)',
      'line-color': '#94a3b8',
      'curve-style': 'bezier' as const,
      opacity: 0.6,
    },
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#2563eb',
      opacity: 1,
    },
  },
]

export default function SNAPage() {
  const [keyword, setKeyword] = useState('')
  const [codeLength, setCodeLength] = useState<4 | 8>(4)
  const [pageSize, setPageSize] = useState(500)
  const [enableFilter, setEnableFilter] = useState(false)
  const [minSimilarity, setMinSimilarity] = useState(0.5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SNAResult | null>(null)
  const [selectedNode, setSelectedNode] = useState<SNANode | null>(null)

  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const cyRef = useRef<Core | null>(null)

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('검색 키워드를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)
    setSelectedNode(null)
    setSelectedYear(null)
    setIsPlaying(false)

      try {
        const data = await analyzeSNA({
          word: keyword,
          codeLength,
          pageSize,
          includeYearly: true,
          enableFilter,
          minSimilarity,
        })
        setResult(data)
      if (data.year_range) {
        setSelectedYear(data.year_range[1])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const currentData = useMemo((): { nodes: SNANode[]; edges: { source: number; target: number; weight: number }[] } | null => {
    if (!result) return null
    if (!selectedYear || !result.yearly_data) {
      return { nodes: result.nodes, edges: result.edges }
    }
    const yearData = result.yearly_data.find((y) => y.year === selectedYear)
    if (yearData) {
      return { nodes: yearData.nodes, edges: yearData.edges }
    }
    return { nodes: result.nodes, edges: result.edges }
  }, [result, selectedYear])

  const cyCallback = useCallback((cy: Core) => {
    cyRef.current = cy

    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      const nodeId = parseInt(node.data('id'), 10)
      const nodeData = currentData?.nodes.find((n) => n.id === nodeId)
      if (nodeData) {
        setSelectedNode(nodeData)
      }
    })

    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedNode(null)
      }
    })
  }, [currentData])

  const elements: ElementDefinition[] = currentData
    ? [
        ...currentData.nodes.map((node) => ({
          data: {
            id: node.id.toString(),
            label: node.name,
            size: Math.max(20, Math.min(60, 20 + node.frequency * 3)),
          },
        })),
        ...currentData.edges.map((edge, idx) => ({
          data: {
            id: `e${idx}`,
            source: edge.source.toString(),
            target: edge.target.toString(),
            weight: Math.max(1, Math.min(8, edge.weight)),
          },
        })),
      ]
    : []

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
    setSelectedNode(null)
  }

  const handlePlayPause = () => {
    if (!result?.year_range || !result.yearly_data) return

    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
      setIsPlaying(false)
    } else {
      const [startYear, endYear] = result.year_range
      if (selectedYear === endYear) {
        setSelectedYear(startYear)
      }

      setIsPlaying(true)
      playIntervalRef.current = setInterval(() => {
        setSelectedYear((prev) => {
          if (prev === null || prev >= endYear) {
            if (playIntervalRef.current) {
              clearInterval(playIntervalRef.current)
              playIntervalRef.current = null
            }
            setIsPlaying(false)
            return endYear
          }
          return prev + 1
        })
      }, 1000)
    }
  }

  const handleSkipBack = () => {
    if (result?.year_range) {
      setSelectedYear(result.year_range[0])
    }
  }

  const handleSkipForward = () => {
    if (result?.year_range) {
      setSelectedYear(result.year_range[1])
    }
  }

  const currentYearPatentCount = useMemo(() => {
    if (!result?.yearly_data || !selectedYear) return null
    const yearData = result.yearly_data.find((y) => y.year === selectedYear)
    return yearData?.patent_count ?? null
  }, [result, selectedYear])

  return (
    <main className="min-h-screen w-full bg-white text-text">
      <header className="border-b border-border bg-white px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <Network className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold md:text-4xl">IPC 네트워크 분석</h1>
          </div>
          <p className="mt-2 text-lg text-text-muted">
            특허 검색 결과의 IPC 코드 동시출현 네트워크를 시각화합니다
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-lg border border-border bg-white p-6"
        >
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-sm font-medium">검색 키워드</label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="예: 터치스크린, 인공지능, 배터리"
                className="w-full rounded-lg border border-border p-3 transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="w-32">
              <label className="mb-2 block text-sm font-medium">IPC 레벨</label>
              <select
                value={codeLength}
                onChange={(e) => setCodeLength(Number(e.target.value) as 4 | 8)}
                className="w-full rounded-lg border border-border p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value={4}>4자리 (서브클래스)</option>
                <option value={8}>8자리 (메인그룹)</option>
              </select>
            </div>

            <div className="w-32">
              <label className="mb-2 block text-sm font-medium">검색 건수</label>
              <input
                type="number"
                value={pageSize}
                onChange={(e) => setPageSize(Math.min(500, Math.max(1, Number(e.target.value))))}
                min={1}
                max={500}
                className="w-full rounded-lg border border-border p-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-6 rounded-lg border border-border bg-surface/50 p-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableFilter}
                onChange={(e) => setEnableFilter(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium">AI 유사도 필터링</span>
            </label>

            {enableFilter && (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
                <div className="flex flex-col gap-1 w-48">
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>최소 유사도</span>
                    <span>{minSimilarity}</span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="0.9"
                    step="0.05"
                    value={minSimilarity}
                    onChange={(e) => setMinSimilarity(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-border accent-primary"
                  />
                </div>
                <div className="text-xs text-text-muted">
                  검색어와 연관성이 높은 특허만 분석합니다
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5" />
                  분석
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}
        </motion.div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-4"
          >
            <div className="lg:col-span-3 space-y-4">
              {result.year_range && result.yearly_data && (
                <div className="rounded-lg border border-border bg-white p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Calendar className="h-5 w-5 text-primary" />
                      연도별 네트워크 변화
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSkipBack}
                        className="rounded p-2 hover:bg-surface transition-colors"
                        title="처음으로"
                      >
                        <SkipBack className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handlePlayPause}
                        className="rounded-full bg-primary p-2 text-white hover:bg-primary-hover transition-colors"
                        title={isPlaying ? '일시정지' : '재생'}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={handleSkipForward}
                        className="rounded p-2 hover:bg-surface transition-colors"
                        title="끝으로"
                      >
                        <SkipForward className="h-4 w-4" />
                      </button>
                      <span className="ml-2 text-2xl font-bold text-primary">{selectedYear}</span>
                    </div>
                  </div>

                  <div className="relative">
                    <input
                      type="range"
                      min={result.year_range[0]}
                      max={result.year_range[1]}
                      value={selectedYear ?? result.year_range[1]}
                      onChange={(e) => handleYearChange(Number(e.target.value))}
                      className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs text-text-muted mt-1">
                      <span>{result.year_range[0]}</span>
                      <span>{result.year_range[1]}</span>
                    </div>
                  </div>

                  {currentYearPatentCount !== null && (
                    <div className="mt-2 text-sm text-text-muted text-center">
                      {selectedYear}년까지 누적: <span className="font-medium text-text">{currentData?.nodes.length}</span>개 IPC, 
                      <span className="font-medium text-text ml-1">{currentData?.edges.length}</span>개 연결
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-lg border border-border bg-white p-4">
                <h2 className="mb-4 text-lg font-semibold">네트워크 시각화</h2>
                <div className="h-[600px] rounded-lg border border-border bg-surface">
                  <CytoscapeComponent
                    elements={elements}
                    stylesheet={cytoscapeStylesheet}
                    layout={{ name: 'cose', animate: true, animationDuration: 500 }}
                    style={{ width: '100%', height: '100%' }}
                    cy={cyCallback}
                    key={`cy-${selectedYear}`}
                  />
                </div>
                <p className="mt-2 text-sm text-text-muted">
                  노드를 클릭하면 상세 정보를 볼 수 있습니다. 드래그하여 이동, 스크롤하여 확대/축소할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <Info className="h-5 w-5 text-primary" />
                  분석 결과
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-text-muted">검색 키워드</dt>
                    <dd className="font-medium">{keyword}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">전체 특허 수</dt>
                    <dd className="font-medium">{result.total_patents}건</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">전체 IPC 수</dt>
                    <dd className="font-medium">{result.nodes.length}개</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-text-muted">전체 연결 수</dt>
                    <dd className="font-medium">{result.edges.length}개</dd>
                  </div>
                  {result.year_range && (
                    <div className="flex justify-between">
                      <dt className="text-text-muted">출원연도 범위</dt>
                      <dd className="font-medium">{result.year_range[0]}~{result.year_range[1]}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-text-muted">IPC 레벨</dt>
                    <dd className="font-medium">{result.code_length}자리</dd>
                  </div>
                </dl>
              </div>

              {selectedNode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-lg border border-primary bg-primary/5 p-4"
                >
                  <h3 className="mb-3 font-semibold text-primary">선택된 노드</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-text-muted">IPC 코드</dt>
                      <dd className="font-medium">{selectedNode.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-muted">출현 빈도</dt>
                      <dd className="font-medium">{selectedNode.frequency}회</dd>
                    </div>
                  </dl>
                </motion.div>
              )}

              <div className="rounded-lg border border-border bg-white p-4">
                <h3 className="mb-3 font-semibold">상위 IPC 코드</h3>
                <ul className="space-y-2 text-sm max-h-[300px] overflow-y-auto">
                  {(currentData?.nodes ?? [])
                    .sort((a, b) => b.frequency - a.frequency)
                    .slice(0, 15)
                    .map((node) => (
                      <li
                        key={node.id}
                        className="flex cursor-pointer items-center justify-between rounded p-2 transition-colors hover:bg-surface"
                        onClick={() => setSelectedNode(node)}
                      >
                        <span className="font-mono">{node.name}</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {node.frequency}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {!result && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Network className="mb-4 h-16 w-16 text-text-muted/50" />
            <h2 className="text-xl font-semibold text-text-muted">
              키워드를 입력하고 분석을 시작하세요
            </h2>
            <p className="mt-2 text-text-muted">
              KIPRIS에서 특허를 검색하고 IPC 코드 간 동시출현 네트워크를 분석합니다
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
