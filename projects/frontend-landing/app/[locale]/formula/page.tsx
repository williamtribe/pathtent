'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  Loader2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  RefreshCw,
  ThumbsDown,
  ThumbsUp,
  AlertCircle,
} from 'lucide-react'
import {
  generateFormula,
  improveFormula,
  type FormulaResult,
} from '../../../lib/api'

type FeedbackType = 'too_many' | 'too_few' | 'noisy' | null

export default function FormulaPage() {
  // Input state
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Result state
  const [result, setResult] = useState<FormulaResult | null>(null)
  const [copied, setCopied] = useState(false)

  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType>(null)
  const [resultCount, setResultCount] = useState<string>('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [isImproving, setIsImproving] = useState(false)

  // History for showing improvement
  const [previousFormula, setPreviousFormula] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!inputText.trim() || inputText.length < 10) {
      setError('최소 10자 이상의 발명 아이디어를 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)
    setPreviousFormula(null)
    setShowFeedback(false)

    try {
      const formulaResult = await generateFormula(inputText)
      setResult(formulaResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색식 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImprove = async () => {
    if (!result || !selectedFeedback) return

    setIsImproving(true)
    setError(null)
    setPreviousFormula(result.formula)

    try {
      const improvedResult = await improveFormula(
        result.formula,
        result.keywords,
        result.synonyms,
        result.excluded_terms,
        selectedFeedback,
        additionalContext || undefined,
      )
      setResult(improvedResult)
      setShowFeedback(false)
      setSelectedFeedback(null)
      setResultCount('')
      setAdditionalContext('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색식 개선 중 오류가 발생했습니다.')
    } finally {
      setIsImproving(false)
    }
  }

  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.formula)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('클립보드 복사에 실패했습니다.')
    }
  }

  const handleReset = () => {
    setInputText('')
    setResult(null)
    setError(null)
    setShowFeedback(false)
    setSelectedFeedback(null)
    setPreviousFormula(null)
  }

  return (
    <main className="min-h-screen w-full bg-white text-text">
      {/* Header */}
      <header className="border-b border-border bg-white px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold md:text-4xl">KIPRIS 검색식 생성기</h1>
          <p className="mt-2 text-lg text-text-muted">
            발명 아이디어를 입력하면 AI가 전문가급 특허 검색식을 생성해드립니다
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Input Section */}
        <div className="rounded-lg border border-border bg-white p-6">
          <div className="mb-4 flex items-center gap-3">
            <Search className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">발명 아이디어 입력</h2>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="검색하고 싶은 발명 아이디어나 기술을 설명해주세요...&#10;&#10;예: 전기자동차에서 AI를 활용하여 정지 거리를 예측하는 스마트 브레이크 시스템"
            className="h-40 w-full resize-none rounded-lg border border-border p-4 text-lg transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
          />

          <div className="mt-2 text-right text-sm text-text-muted">
            {inputText.length}자
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isLoading || inputText.length < 10}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                검색식 생성 중...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                검색식 생성
              </>
            )}
          </button>
        </div>

        {/* Result Section */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8 space-y-6"
            >
              {/* Formula Output */}
              <div className="rounded-lg border-2 border-primary bg-surface p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">생성된 검색식</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-2 rounded-lg border border-primary bg-white px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-secondary"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? '복사됨!' : '복사'}
                    </button>
                  </div>
                </div>

                {/* Previous formula (if improved) */}
                {previousFormula && (
                  <div className="mb-4 rounded-lg border border-border bg-white p-3">
                    <p className="mb-1 text-xs font-medium text-text-muted">이전 검색식:</p>
                    <p className="font-mono text-sm text-text-muted line-through">{previousFormula}</p>
                  </div>
                )}

                {/* Current formula */}
                <div className="rounded-lg border border-border bg-white p-4">
                  <p className="font-mono text-base break-all leading-relaxed">{result.formula}</p>
                </div>

                {/* KIPRIS Link */}
                <a
                  href="https://kpat.kipris.or.kr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition-all hover:bg-green-700"
                >
                  <ExternalLink className="h-5 w-5" />
                  KIPRIS에서 검색하기
                </a>
              </div>

              {/* Explanation */}
              <div className="rounded-lg border border-border bg-white p-6">
                <h3 className="mb-3 text-lg font-semibold">검색 전략 설명</h3>
                <p className="text-text-muted">{result.explanation}</p>
              </div>

              {/* Keywords & Synonyms */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="mb-3 text-lg font-semibold">핵심 키워드</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-white"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="mb-3 text-lg font-semibold">IPC 분류</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.ipc_codes.map((code, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-secondary px-3 py-1 text-sm font-medium text-primary"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Synonyms */}
              {Object.keys(result.synonyms).length > 0 && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="mb-3 text-lg font-semibold">동의어/유의어</h3>
                  <div className="space-y-2">
                    {Object.entries(result.synonyms).map(([keyword, synonyms]) => (
                      <div key={keyword} className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{keyword}:</span>
                        {synonyms.map((syn, idx) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-surface px-2 py-1 text-sm"
                          >
                            {syn}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Excluded Terms */}
              {result.excluded_terms.length > 0 && (
                <div className="rounded-lg border border-border bg-white p-6">
                  <h3 className="mb-3 text-lg font-semibold">제외 용어 (NOT)</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.excluded_terms.map((term, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700"
                      >
                        !{term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              {result.tips.length > 0 && (
                <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-50 p-6">
                  <h3 className="mb-3 text-lg font-semibold text-amber-800">활용 팁</h3>
                  <ul className="list-disc space-y-1 pl-5 text-amber-700">
                    {result.tips.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback Section */}
              <div className="rounded-lg border border-border bg-white p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">검색 결과가 마음에 드시나요?</h3>
                  {!showFeedback && (
                    <button
                      onClick={() => setShowFeedback(true)}
                      className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-all hover:bg-surface"
                    >
                      <RefreshCw className="h-4 w-4" />
                      검색식 개선하기
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showFeedback && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-4"
                    >
                      <p className="text-sm text-text-muted">
                        KIPRIS에서 검색 후 결과에 대한 피드백을 주시면 검색식을 개선해드립니다.
                      </p>

                      {/* Feedback Options */}
                      <div className="grid gap-3 md:grid-cols-3">
                        <button
                          onClick={() => setSelectedFeedback('too_many')}
                          className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                            selectedFeedback === 'too_many'
                              ? 'border-primary bg-secondary'
                              : 'border-border hover:bg-surface'
                          }`}
                        >
                          <ThumbsDown className="h-5 w-5" />
                          <span className="font-medium">결과가 너무 많음</span>
                        </button>
                        <button
                          onClick={() => setSelectedFeedback('too_few')}
                          className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                            selectedFeedback === 'too_few'
                              ? 'border-primary bg-secondary'
                              : 'border-border hover:bg-surface'
                          }`}
                        >
                          <ThumbsUp className="h-5 w-5 rotate-180" />
                          <span className="font-medium">결과가 너무 적음</span>
                        </button>
                        <button
                          onClick={() => setSelectedFeedback('noisy')}
                          className={`flex items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                            selectedFeedback === 'noisy'
                              ? 'border-primary bg-secondary'
                              : 'border-border hover:bg-surface'
                          }`}
                        >
                          <AlertCircle className="h-5 w-5" />
                          <span className="font-medium">관련없는 결과 많음</span>
                        </button>
                      </div>

                      {/* Additional Input */}
                      {selectedFeedback && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-3"
                        >
                          <div>
                            <label className="mb-1 block text-sm font-medium">
                              추가 요청사항 (선택사항)
                            </label>
                            <textarea
                              value={additionalContext}
                              onChange={(e) => setAdditionalContext(e.target.value)}
                              placeholder="예: 자율주행 관련 특허는 제외해주세요"
                              className="h-20 w-full resize-none rounded-lg border border-border p-3 transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setShowFeedback(false)
                                setSelectedFeedback(null)
                              }}
                              className="rounded-lg border border-border px-6 py-3 font-medium transition-all hover:bg-surface"
                            >
                              취소
                            </button>
                            <button
                              onClick={handleImprove}
                              disabled={isImproving}
                              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isImproving ? (
                                <>
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  개선 중...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-5 w-5" />
                                  검색식 개선
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full rounded-lg border border-border py-3 font-medium transition-all hover:bg-surface"
              >
                새로운 검색식 생성하기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* KIPRIS Syntax Guide */}
        {!result && (
          <div className="mt-8 rounded-lg border border-border bg-surface p-6">
            <h3 className="mb-4 text-lg font-semibold">KIPRIS 검색식 문법 안내</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-sm">
                <p><code className="rounded bg-white px-2 py-1">*</code> AND: 모든 단어 포함</p>
                <p><code className="rounded bg-white px-2 py-1">+</code> OR: 하나 이상 포함</p>
                <p><code className="rounded bg-white px-2 py-1">!</code> NOT: 해당 단어 제외</p>
              </div>
              <div className="space-y-2 text-sm">
                <p><code className="rounded bg-white px-2 py-1">^n</code> NEAR: n단어 이내 인접</p>
                <p><code className="rounded bg-white px-2 py-1">&quot;&quot;</code> 구문검색: 정확한 문구</p>
                <p><code className="rounded bg-white px-2 py-1">TI:</code> <code className="rounded bg-white px-2 py-1">AB:</code> <code className="rounded bg-white px-2 py-1">MIPC:</code> 필드 지정</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
