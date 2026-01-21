'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  FileText,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react'
import {
  analyzeDocument,
  generateSpecification,
  type Question,
  type PatentSpecification,
  type Answer,
} from '../../../lib/api'

type Step = 'input' | 'questions' | 'generating' | 'result'

export default function GeneratePage() {
  const [step, setStep] = useState<Step>('input')
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Analysis state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [summary, setSummary] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Result state
  const [specification, setSpecification] = useState<PatentSpecification | null>(null)
  const [copied, setCopied] = useState(false)

  // Step 1: Analyze document
  const handleAnalyze = async () => {
    if (!inputText.trim() || inputText.length < 100) {
      setError('최소 100자 이상의 연구 내용을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await analyzeDocument(inputText)
      setSessionId(result.session_id)
      setSummary(result.summary)
      setQuestions(result.questions)
      setStep('questions')
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Generate specification
  const handleGenerate = async () => {
    if (!sessionId) return

    // Check if all questions are answered
    const unanswered = questions.filter((q) => !answers[q.id]?.trim())
    if (unanswered.length > 0) {
      setError(`${unanswered.length}개의 질문에 답변해주세요.`)
      return
    }

    setIsLoading(true)
    setError(null)
    setStep('generating')

    try {
      const answerList: Answer[] = Object.entries(answers).map(([question_id, answer]) => ({
        question_id,
        answer,
      }))

      const result = await generateSpecification(sessionId, answerList)
      setSpecification(result.specification)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '명세서 생성 중 오류가 발생했습니다.')
      setStep('questions')
    } finally {
      setIsLoading(false)
    }
  }

  // Copy to clipboard
  const handleCopy = async () => {
    if (!specification) return

    const text = formatSpecificationAsText(specification)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Reset
  const handleReset = () => {
    setStep('input')
    setInputText('')
    setSessionId(null)
    setSummary('')
    setQuestions([])
    setAnswers({})
    setSpecification(null)
    setError(null)
  }

  return (
    <main className="min-h-screen w-full bg-white text-text">
      {/* Header */}
      <header className="border-b border-border bg-white px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold md:text-4xl">특허 명세서 생성기</h1>
          <p className="mt-2 text-lg text-text-muted">
            연구 논문을 입력하면 AI가 특허 명세서를 작성해드립니다
          </p>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {['입력', '질문', '생성', '완료'].map((label, idx) => {
            const steps: Step[] = ['input', 'questions', 'generating', 'result']
            const isActive = steps.indexOf(step) >= idx
            const isCurrent = steps[idx] === step

            return (
              <div key={label} className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors ${
                    isCurrent
                      ? 'bg-primary text-white'
                      : isActive
                        ? 'bg-secondary text-primary'
                        : 'border border-border bg-white text-text-muted'
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`ml-2 font-medium ${isCurrent ? 'text-text' : 'text-text-muted'}`}
                >
                  {label}
                </span>
                {idx < 3 && <ChevronRight className="mx-2 h-5 w-5 text-border" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Input */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="rounded-lg border border-border bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">연구 내용 입력</h2>
                </div>

                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="연구 논문, 보고서, 또는 발명 아이디어를 입력하세요... (최소 100자)"
                  className="h-64 w-full resize-none rounded-lg border border-border p-4 text-lg transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                <div className="mt-2 text-right text-sm text-text-muted">
                  {inputText.length}자 / 최소 100자
                </div>

                {error && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || inputText.length < 100}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      AI 분석 시작
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Questions */}
          {step === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Summary */}
              <div className="mb-6 rounded-lg border-l-4 border-l-primary bg-surface p-6">
                <h3 className="mb-2 text-lg font-semibold">연구 내용 요약</h3>
                <p className="text-text-muted">{summary}</p>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="rounded-lg border border-border bg-white p-6">
                    <div className="mb-3 flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <span className="mb-1 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">
                          {q.category}
                        </span>
                        <h4 className="mt-2 text-base font-semibold">{q.question}</h4>
                        {q.hint && (
                          <p className="mt-1 text-sm text-text-muted">힌트: {q.hint}</p>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                      }
                      placeholder="답변을 입력하세요..."
                      className="mt-2 h-24 w-full resize-none rounded-lg border border-border p-3 transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setStep('input')}
                  className="flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 font-semibold text-text transition-all hover:bg-border"
                >
                  <ChevronLeft className="h-5 w-5" />
                  이전
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText className="h-5 w-5" />
                  명세서 생성
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative">
                <div className="h-20 w-20 animate-spin rounded-full border-4 border-surface border-t-primary" />
                <Sparkles className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <h2 className="mt-8 text-2xl font-semibold">명세서 생성 중...</h2>
              <p className="mt-2 text-base text-text-muted">
                AI가 특허 명세서를 작성하고 있습니다. 잠시만 기다려주세요.
              </p>
            </motion.div>
          )}

          {/* Step 4: Result */}
          {step === 'result' && specification && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Actions */}
              <div className="mb-6 flex gap-4">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  {copied ? '복사됨!' : '전체 복사'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-lg bg-secondary px-6 py-3 font-semibold text-text transition-all hover:bg-border"
                >
                  새로 작성
                </button>
              </div>

              {/* Specification */}
              <div className="space-y-6">
                <SpecSection title="발명의 명칭" highlight>
                  <p className="text-xl font-semibold">{specification.title}</p>
                </SpecSection>

                <SpecSection title="기술분야" highlight>
                  <p>{specification.technical_field}</p>
                </SpecSection>

                <SpecSection title="발명의 배경이 되는 기술">
                  <p className="whitespace-pre-wrap">{specification.background_art}</p>
                </SpecSection>

                <SpecSection title="해결하려는 과제">
                  <p className="whitespace-pre-wrap">{specification.problem_to_solve}</p>
                </SpecSection>

                <SpecSection title="과제의 해결 수단">
                  <p className="whitespace-pre-wrap">{specification.solution}</p>
                </SpecSection>

                <SpecSection title="발명의 효과" highlight>
                  <p className="whitespace-pre-wrap">{specification.advantageous_effects}</p>
                </SpecSection>

                <SpecSection title="발명을 실시하기 위한 구체적인 내용">
                  <p className="whitespace-pre-wrap">{specification.detailed_description}</p>
                </SpecSection>

                <SpecSection title="청구항" highlight>
                  <div className="space-y-4">
                    {specification.claims.map((claim) => (
                      <div
                        key={claim.number}
                        className="rounded-lg border border-border bg-white p-4"
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
                            {claim.is_independent ? '독립항' : '종속항'} {claim.number}
                          </span>
                          {claim.depends_on && (
                            <span className="text-sm text-text-muted">
                              (제{claim.depends_on}항 인용)
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{claim.text}</p>
                      </div>
                    ))}
                  </div>
                </SpecSection>

                <SpecSection title="요약서" highlight>
                  <p>{specification.abstract}</p>
                </SpecSection>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

// Helper component for specification sections
function SpecSection({
  title,
  highlight = false,
  children,
}: {
  title: string
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`rounded-lg border p-6 ${
        highlight ? 'border-l-4 border-l-primary bg-surface' : 'border-border bg-white'
      }`}
    >
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <div className="text-base leading-relaxed">{children}</div>
    </div>
  )
}

// Helper function to format specification as text
function formatSpecificationAsText(spec: PatentSpecification): string {
  const lines = [
    '【발명의 명칭】',
    spec.title,
    '',
    '【기술분야】',
    spec.technical_field,
    '',
    '【발명의 배경이 되는 기술】',
    spec.background_art,
    '',
    '【해결하려는 과제】',
    spec.problem_to_solve,
    '',
    '【과제의 해결 수단】',
    spec.solution,
    '',
    '【발명의 효과】',
    spec.advantageous_effects,
    '',
    '【발명을 실시하기 위한 구체적인 내용】',
    spec.detailed_description,
    '',
    '【청구항】',
    ...spec.claims.map((c) => `【청구항 ${c.number}】\n${c.text}`),
    '',
    '【요약서】',
    spec.abstract,
  ]

  return lines.join('\n')
}
