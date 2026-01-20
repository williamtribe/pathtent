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
  Sparkles
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
    const unanswered = questions.filter(q => !answers[q.id]?.trim())
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
    <main className="min-h-screen w-full bg-white text-nb-black">
      {/* Header */}
      <header className="border-b-4 border-nb-black bg-nb-yellow px-6 py-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-black uppercase md:text-4xl">
            특허 명세서 생성기
          </h1>
          <p className="mt-2 text-lg font-bold opacity-80">
            연구 논문을 입력하면 AI가 특허 명세서를 작성해드립니다
          </p>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b-4 border-nb-black bg-white px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          {['입력', '질문', '생성', '완료'].map((label, idx) => {
            const steps: Step[] = ['input', 'questions', 'generating', 'result']
            const isActive = steps.indexOf(step) >= idx
            const isCurrent = steps[idx] === step
            
            return (
              <div key={label} className="flex items-center">
                <div className={`
                  flex h-10 w-10 items-center justify-center rounded-full border-4 border-nb-black font-black
                  ${isCurrent ? 'bg-nb-pink text-white' : isActive ? 'bg-nb-green' : 'bg-gray-200'}
                `}>
                  {idx + 1}
                </div>
                <span className={`ml-2 font-bold ${isCurrent ? 'text-nb-black' : 'text-gray-500'}`}>
                  {label}
                </span>
                {idx < 3 && (
                  <ChevronRight className="mx-2 h-6 w-6 text-gray-400" />
                )}
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
              <div className="rounded-xl border-4 border-nb-black bg-white p-6 shadow-neo">
                <div className="mb-4 flex items-center gap-3">
                  <FileText className="h-8 w-8" />
                  <h2 className="text-2xl font-black">연구 내용 입력</h2>
                </div>
                
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="연구 논문, 보고서, 또는 발명 아이디어를 입력하세요... (최소 100자)"
                  className="h-64 w-full resize-none rounded-lg border-4 border-nb-black p-4 text-lg focus:outline-none focus:ring-4 focus:ring-nb-blue"
                />
                
                <div className="mt-2 text-right text-sm font-bold text-gray-500">
                  {inputText.length}자 / 최소 100자
                </div>

                {error && (
                  <div className="mt-4 rounded-lg border-4 border-red-500 bg-red-100 p-4 font-bold text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={isLoading || inputText.length < 100}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-4 border-nb-black bg-nb-pink px-8 py-4 text-xl font-black uppercase text-white shadow-neo transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#000000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6" />
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
              <div className="mb-6 rounded-xl border-4 border-nb-black bg-nb-green p-6 shadow-neo">
                <h3 className="mb-2 text-xl font-black">연구 내용 요약</h3>
                <p className="text-lg font-medium">{summary}</p>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="rounded-xl border-4 border-nb-black bg-white p-6 shadow-neo"
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-nb-black bg-nb-blue font-black text-white">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="mb-1 inline-block rounded-full border-2 border-nb-black bg-nb-yellow px-3 py-1 text-sm font-bold">
                          {q.category}
                        </span>
                        <h4 className="mt-2 text-lg font-bold">{q.question}</h4>
                        {q.hint && (
                          <p className="mt-1 text-sm text-gray-500">힌트: {q.hint}</p>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={answers[q.id] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="답변을 입력하세요..."
                      className="mt-2 h-24 w-full resize-none rounded-lg border-2 border-nb-black p-3 focus:outline-none focus:ring-2 focus:ring-nb-blue"
                    />
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-4 rounded-lg border-4 border-red-500 bg-red-100 p-4 font-bold text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex gap-4">
                <button
                  onClick={() => setStep('input')}
                  className="flex items-center gap-2 rounded-xl border-4 border-nb-black bg-gray-200 px-6 py-3 font-black transition-all hover:bg-gray-300"
                >
                  <ChevronLeft className="h-5 w-5" />
                  이전
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border-4 border-nb-black bg-nb-pink px-8 py-4 text-xl font-black uppercase text-white shadow-neo transition-all hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_#000000] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileText className="h-6 w-6" />
                  명세서 생성
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="relative">
                <div className="h-24 w-24 animate-spin rounded-full border-8 border-nb-black border-t-nb-pink" />
                <Sparkles className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-nb-pink" />
              </div>
              <h2 className="mt-8 text-2xl font-black">명세서 생성 중...</h2>
              <p className="mt-2 text-lg font-medium text-gray-600">
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
                  className="flex items-center gap-2 rounded-xl border-4 border-nb-black bg-nb-blue px-6 py-3 font-black text-white transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_#000000]"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  {copied ? '복사됨!' : '전체 복사'}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-xl border-4 border-nb-black bg-gray-200 px-6 py-3 font-black transition-all hover:bg-gray-300"
                >
                  새로 작성
                </button>
              </div>

              {/* Specification */}
              <div className="space-y-6">
                <SpecSection title="발명의 명칭" color="bg-nb-yellow">
                  <p className="text-xl font-bold">{specification.title}</p>
                </SpecSection>

                <SpecSection title="기술분야" color="bg-nb-green">
                  <p>{specification.technical_field}</p>
                </SpecSection>

                <SpecSection title="발명의 배경이 되는 기술" color="bg-white">
                  <p className="whitespace-pre-wrap">{specification.background_art}</p>
                </SpecSection>

                <SpecSection title="해결하려는 과제" color="bg-white">
                  <p className="whitespace-pre-wrap">{specification.problem_to_solve}</p>
                </SpecSection>

                <SpecSection title="과제의 해결 수단" color="bg-white">
                  <p className="whitespace-pre-wrap">{specification.solution}</p>
                </SpecSection>

                <SpecSection title="발명의 효과" color="bg-nb-green">
                  <p className="whitespace-pre-wrap">{specification.advantageous_effects}</p>
                </SpecSection>

                <SpecSection title="발명을 실시하기 위한 구체적인 내용" color="bg-white">
                  <p className="whitespace-pre-wrap">{specification.detailed_description}</p>
                </SpecSection>

                <SpecSection title="청구항" color="bg-nb-pink text-white">
                  <div className="space-y-4">
                    {specification.claims.map((claim) => (
                      <div key={claim.number} className="rounded-lg bg-white/20 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-nb-pink">
                            {claim.is_independent ? '독립항' : '종속항'} {claim.number}
                          </span>
                          {claim.depends_on && (
                            <span className="text-sm opacity-80">
                              (제{claim.depends_on}항 인용)
                            </span>
                          )}
                        </div>
                        <p className="font-medium">{claim.text}</p>
                      </div>
                    ))}
                  </div>
                </SpecSection>

                <SpecSection title="요약서" color="bg-nb-blue text-white">
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
  color, 
  children 
}: { 
  title: string
  color: string
  children: React.ReactNode 
}) {
  return (
    <div className={`rounded-xl border-4 border-nb-black ${color} p-6 shadow-neo`}>
      <h3 className="mb-4 text-xl font-black uppercase">{title}</h3>
      <div className="text-lg leading-relaxed">{children}</div>
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
    ...spec.claims.map(c => `【청구항 ${c.number}】\n${c.text}`),
    '',
    '【요약서】',
    spec.abstract,
  ]
  
  return lines.join('\n')
}
