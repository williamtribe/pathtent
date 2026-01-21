/**
 * Patent Specification Generator API Client
 */

// 백엔드 없이 프론트엔드 UI 테스트용 모킹 모드
const MOCK_MODE = process.env.NODE_ENV === 'development' || true // 개발 시 항상 모킹 활성화

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============================================================================
// Types
// ============================================================================

export interface Question {
  id: string
  question: string
  category: string
  hint: string | null
}

export interface AnalyzeResponse {
  session_id: string
  summary: string
  questions: Question[]
}

export interface Answer {
  question_id: string
  answer: string
}

export interface Claim {
  number: number
  text: string
  is_independent: boolean
  depends_on: number | null
}

export interface PatentSpecification {
  title: string
  technical_field: string
  background_art: string
  problem_to_solve: string
  solution: string
  advantageous_effects: string
  detailed_description: string
  claims: Claim[]
  abstract: string
}

export interface GenerateResponse {
  session_id: string
  specification: PatentSpecification
}

export interface SessionStatus {
  session_id: string
  status: 'pending' | 'analyzed' | 'generating' | 'completed' | 'expired'
  created_at: string
  specification: PatentSpecification | null
}

// ============================================================================
// Mock Data
// ============================================================================

const mockQuestions: Question[] = [
  {
    id: "q1",
    question: "이 발명의 주요 기술적 특징은 무엇입니까?",
    category: "기술적 특징",
    hint: "발명의 핵심 기술적 요소를 설명해주세요"
  },
  {
    id: "q2",
    question: "이 발명의 해결하려는 기술적 문제는 무엇입니까?",
    category: "문제 해결",
    hint: "기존 기술의 한계나 해결하고자 하는 문제를 설명해주세요"
  },
  {
    id: "q3",
    question: "이 발명의 독창적인 해결 방법은 무엇입니까?",
    category: "해결 수단",
    hint: "기존 기술과 다른 새로운 해결 방법을 설명해주세요"
  },
  {
    id: "q4",
    question: "이 발명의 기대되는 효과는 무엇입니까?",
    category: "발명의 효과",
    hint: "발명이 가져올 기술적, 경제적, 사회적 효과를 설명해주세요"
  },
  {
    id: "q5",
    question: "이 발명의 산업적 적용 분야는 어디입니까?",
    category: "산업적 적용",
    hint: "발명이 적용될 수 있는 산업 분야를 설명해주세요"
  }
]

const mockSpecification: PatentSpecification = {
  title: "AI 기반 특허 명세서 자동 생성 시스템 및 방법",
  technical_field: "컴퓨터 소프트웨어 및 인공지능",
  background_art: `종래의 특허 명세서 작성 방식은 변리사나 전문가가 수작업으로 작성하는 방식이 일반적이었다.
이러한 방식은 시간과 비용이 많이 소요되며, 전문 지식이 필요한 단점이 있었다.

최근 인공지능 기술의 발전으로 다양한 분야에서 자동화가 이루어지고 있지만,
특허 명세서 작성 분야에서는 아직 효과적인 자동화 솔루션이 부족한 실정이다.`,
  problem_to_solve: `종래의 특허 명세서 작성 방식은 다음과 같은 문제점을 가지고 있었다:

1. 전문 변리사 의존도가 높아 비용이 많이 소요됨
2. 작성에 많은 시간과 노력이 필요함
3. 일관된 품질 확보가 어려움
4. 초보 발명가의 접근성이 낮음

따라서 저비용, 고효율의 특허 명세서 자동 생성 시스템의 필요성이 대두되었다.`,
  solution: `본 발명은 연구 논문이나 기술 문서를 입력받아 AI가 자동으로 특허 명세서를 생성하는 시스템을 제공한다.

구체적으로:
1. 입력된 텍스트를 AI 모델로 분석하여 핵심 기술적 특징을 추출한다
2. 추출된 정보를 바탕으로 특허 명세서의 각 섹션을 자동으로 작성한다
3. 생성된 명세서를 검토하고 수정할 수 있는 인터페이스를 제공한다

이러한 방식으로 전문 지식 없이도 고품질의 특허 명세서를 생성할 수 있다.`,
  advantageous_effects: `본 발명에 따르면 다음과 같은 효과를 얻을 수 있다:

1. 특허 명세서 작성 비용 및 시간을 대폭 절감할 수 있다
2. 일관된 품질의 특허 명세서를 생성할 수 있다
3. 초보 발명가도 쉽게 특허 출원을 준비할 수 있다
4. 대량의 특허 출원을 효율적으로 처리할 수 있다`,
  detailed_description: `본 발명의 실시예에 따른 특허 명세서 자동 생성 시스템은 다음과 같이 구성된다.

먼저, 사용자로부터 연구 논문이나 기술 문서를 입력받는다. 입력된 텍스트는 자연어 처리 AI 모델을 통해 분석된다.

분석 과정에서:
- 기술 분야 분류
- 주요 특징 추출
- 문제점 및 해결 수단 식별
- 효과 분석

이후 추출된 정보를 바탕으로 특허 명세서의 각 섹션을 자동으로 작성한다.`,
  claims: [
    {
      number: 1,
      text: "연구 논문 또는 기술 문서를 입력받아 특허 명세서를 자동으로 생성하는 시스템에 있어서, 상기 입력된 문서를 분석하여 기술적 특징을 추출하는 분석 모듈; 추출된 특징을 바탕으로 특허 명세서의 각 섹션을 작성하는 생성 모듈; 및 생성된 명세서를 출력하는 출력 모듈을 포함하는 것을 특징으로 하는 특허 명세서 자동 생성 시스템.",
      is_independent: true,
      depends_on: null
    },
    {
      number: 2,
      text: "제1항에 있어서, 상기 분석 모듈은 인공지능 모델을 이용하여 입력 문서의 기술적 특징, 문제점, 해결 수단 및 효과를 추출하는 것을 특징으로 하는 특허 명세서 자동 생성 시스템.",
      is_independent: false,
      depends_on: 1
    },
    {
      number: 3,
      text: "제1항에 있어서, 상기 생성 모듈은 추출된 정보를 바탕으로 발명의 명칭, 기술분야, 배경기술, 해결하려는 과제, 과제의 해결 수단, 발명의 효과, 발명을 실시하기 위한 구체적인 내용, 청구항 및 요약서를 자동으로 생성하는 것을 특징으로 하는 특허 명세서 자동 생성 시스템.",
      is_independent: false,
      depends_on: 1
    }
  ],
  abstract: "연구 논문이나 기술 문서를 입력받아 AI가 자동으로 특허 명세서를 생성하는 시스템 및 방법을 제공한다. 입력된 문서를 분석하여 핵심 기술적 특징을 추출하고, 이를 바탕으로 특허 명세서의 각 섹션을 자동으로 작성함으로써, 전문 지식 없이도 고품질의 특허 명세서를 손쉽게 생성할 수 있다."
}

// ============================================================================
// Mock Functions
// ============================================================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const mockAnalyzeDocument = async (text: string): Promise<AnalyzeResponse> => {
  console.log('🎭 [MOCK] Analyzing document:', text.substring(0, 100) + '...')
  await delay(2000) // 2초 딜레이로 로딩 표시

  return {
    session_id: `mock-session-${Date.now()}`,
    summary: "입력된 연구 내용을 분석한 결과, AI 기반 특허 명세서 자동 생성 시스템에 대한 발명으로 판단됩니다. 이 시스템은 연구 논문을 입력받아 특허 명세서를 자동으로 생성하는 혁신적인 솔루션입니다.",
    questions: mockQuestions
  }
}

const mockGenerateSpecification = async (sessionId: string, answers: Answer[]): Promise<GenerateResponse> => {
  console.log('🎭 [MOCK] Generating specification with answers:', answers.length)
  await delay(3000) // 3초 딜레이로 로딩 표시

  return {
    session_id: sessionId,
    specification: mockSpecification
  }
}

const mockGetSessionStatus = async (sessionId: string): Promise<SessionStatus> => {
  return {
    session_id: sessionId,
    status: 'completed',
    created_at: new Date().toISOString(),
    specification: mockSpecification
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Analyze research document and generate questions
 */
export async function analyzeDocument(text: string): Promise<AnalyzeResponse> {
  if (MOCK_MODE) {
    return mockAnalyzeDocument(text)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/patent/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Analyze PDF document
 */
export async function analyzePDF(file: File): Promise<AnalyzeResponse> {
  if (MOCK_MODE) {
    return mockAnalyzeDocument('PDF content would be extracted here')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/v1/patent/analyze/pdf`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Generate patent specification from answers
 */
export async function generateSpecification(
  sessionId: string,
  answers: Answer[]
): Promise<GenerateResponse> {
  if (MOCK_MODE) {
    return mockGenerateSpecification(sessionId, answers)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/patent/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      answers,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Get session status
 */
export async function getSessionStatus(sessionId: string): Promise<SessionStatus> {
  if (MOCK_MODE) {
    return mockGetSessionStatus(sessionId)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/patent/session/${sessionId}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}