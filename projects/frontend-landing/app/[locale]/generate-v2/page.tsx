'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'motion/react'
import {
  FileText,
  Loader2,
  Download,
  ExternalLink,
  Send,
  Sparkles,
} from 'lucide-react'
import { API_BASE_URL, type PatentSpecification } from '../../../lib/api'

export default function GenerateV2Page() {
  const [step, setStep] = useState<'input' | 'refining'>('input')
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [specification, setSpecification] = useState<PatentSpecification | null>(null)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleGenerate = async () => {
    if (!inputText.trim() || inputText.length < 100) {
      setError('최소 100자 이상의 연구 내용을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/patent/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText }),
      })

      if (!response.ok) throw new Error('명세서 생성 실패')

      const data = await response.json()
      setSessionId(data.session_id)
      setSpecification(data.specification)
      setStep('refining')
      setMessages([
        {
          role: 'assistant',
          content:
            '특허 명세서 초안을 생성했습니다. 왼쪽에서 내용을 확인하시고, 수정하고 싶은 부분이 있으면 말씀해주세요!',
        },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : '명세서 생성 중 오류 발생')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !sessionId || isSending) return

    const userMessage = currentMessage
    setCurrentMessage('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsSending(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/patent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage,
        }),
      })

      if (!response.ok) throw new Error('메시지 전송 실패')

      const data = await response.json()
      setSpecification(data.specification)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : '메시지 전송 중 오류 발생')
    } finally {
      setIsSending(false)
    }
  }

  const handleDownloadWord = async () => {
    if (!sessionId || !specification) return

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/patent/download/${sessionId}`
      )
      if (!response.ok) throw new Error('다운로드 실패')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${specification.title.replace(/\s+/g, '_')}.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : '다운로드 중 오류 발생')
    }
  }

  return (
    <main className="min-h-screen w-full bg-white text-text">
      <header className="border-b border-border bg-white px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold md:text-4xl">특허 명세서 생성기 v2</h1>
          <p className="mt-2 text-lg text-text-muted">
            연구 논문을 입력하면 AI가 초안을 생성하고, 채팅으로 함께 다듬어갑니다
          </p>
        </div>
      </header>

      {step === 'input' && (
        <div className="mx-auto max-w-4xl px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-border bg-white p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-semibold">연구 내용 입력</h2>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="연구 논문, 보고서, 또는 발명 아이디어를 입력하세요... (최소 100자)"
              className="h-96 w-full resize-none rounded-lg border border-border p-4 text-lg transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isLoading}
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
              onClick={handleGenerate}
              disabled={isLoading || inputText.length < 100}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  명세서 초안 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-6 w-6" />
                  명세서 초안 생성
                </>
              )}
            </button>
          </motion.div>
        </div>
      )}

      {step === 'refining' && specification && (
        <div className="flex h-[calc(100vh-120px)]">
          <div className="w-1/2 overflow-y-auto border-r border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">명세서 미리보기</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadWord}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-hover"
                >
                  <Download className="h-4 w-4" />
                  Word
                </button>
                <a
                  href="https://www.patent.go.kr/smart/portal/Main.do"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-green-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  특허청
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <SpecSection title="발명의 명칭" highlight>
                <p className="text-lg font-semibold">{specification.title}</p>
              </SpecSection>

              <SpecSection title="기술분야">
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

              <SpecSection title="발명의 효과">
                <p className="whitespace-pre-wrap">
                  {specification.advantageous_effects}
                </p>
              </SpecSection>

              <SpecSection title="발명을 실시하기 위한 구체적인 내용">
                <p className="whitespace-pre-wrap">
                  {specification.detailed_description}
                </p>
              </SpecSection>

              <SpecSection title="청구항">
                <div className="space-y-3">
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

              <SpecSection title="요약서">
                <p>{specification.abstract}</p>
              </SpecSection>
            </div>
          </div>

          <div className="flex w-1/2 flex-col bg-white">
            <div className="border-b border-border p-4">
              <h2 className="text-xl font-bold">가출원 명세서 작성 도우미</h2>
              <p className="text-sm text-text-muted">
                명세서를 함께 다듬어봅시다. 어떤 부분을 수정하고 싶으신가요?
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`mb-4 flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      msg.role === 'user'
                        ? 'bg-primary text-white'
                        : 'border border-border bg-surface'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="mb-4 flex justify-start">
                  <div className="rounded-lg border border-border bg-surface p-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-border p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  placeholder="예: 발명의 효과를 더 강조해주세요"
                  className="flex-1 rounded-lg border border-border p-3 transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim() || isSending}
                  className="rounded-lg bg-primary px-6 py-3 font-semibold text-white transition-all hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

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
      className={`rounded-lg border p-4 ${
        highlight ? 'border-l-4 border-l-primary bg-white' : 'border-border bg-white'
      }`}
    >
      <h3 className="mb-3 font-semibold text-primary">{title}</h3>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  )
}
