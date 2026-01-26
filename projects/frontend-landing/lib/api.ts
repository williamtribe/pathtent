/**
 * Patent Specification Generator API Client
 */

// Mock mode for frontend UI testing without backend
const MOCK_MODE = false

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============================================================================
// Types
// ============================================================================

export interface Question {
  id: string
  question: string
  category: string
  hint: string | null
  choices: string[] | null
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
  title_en: string
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
    question: "이 발명의 주요 기술 분야는 무엇입니까?",
    category: "기술",
    hint: "발명의 핵심 기술 분야를 선택하세요",
    choices: ["AI/머신러닝", "IoT", "클라우드 컴퓨팅", "블록체인", "로봇공학", "기타"]
  },
  {
    id: "q2",
    question: "이 발명의 해결하려는 기술적 문제는 무엇입니까?",
    category: "배경",
    hint: "기존 기술의 한계나 해결하고자 하는 문제를 설명해주세요",
    choices: null
  },
  {
    id: "q3",
    question: "이 발명의 독창적인 해결 방법은 무엇입니까?",
    category: "기술",
    hint: "기존 기술과 다른 새로운 해결 방법을 설명해주세요",
    choices: null
  },
  {
    id: "q4",
    question: "이 발명의 주요 효과는 무엇입니까?",
    category: "효과",
    hint: "발명이 가져올 주요 효과를 선택하세요",
    choices: ["비용 절감", "시간 단축", "품질 향상", "안전성 향상", "편의성 향상", "기타"]
  },
  {
    id: "q5",
    question: "이 발명의 산업적 적용 분야는 어디입니까?",
    category: "적용분야",
    hint: "발명이 적용될 수 있는 산업 분야를 선택하세요",
    choices: ["제조", "의료", "통신", "금융", "교육", "농업", "기타"]
  }
]

const mockSpecification: PatentSpecification = {
  title: "AI 기반 특허 명세서 자동 생성 시스템 및 방법",
  title_en: "AI-Based Patent Specification Automatic Generation System and Method",
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
  await delay(2000) // 2 second delay for loading display

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

// ============================================================================
// Formula Types
// ============================================================================

export interface FormulaOptions {
  include_ipc?: boolean
  include_synonyms?: boolean
  target_precision?: 'high' | 'balanced' | 'recall'
}

export interface FormulaResult {
  formula: string
  keywords: string[]
  synonyms: Record<string, string[]>
  ipc_codes: string[]
  excluded_terms: string[]
  explanation: string
  tips: string[]
}

export interface FormulaBlock {
  id: string
  name: string
  field: string // TAC, TI, AB, CL, IPC
  keywords: string[]
  operator: string // OR, AND
  ipc_codes: string[] // Per-category IPC codes from embedding search
  enabled: boolean // Whether this block is included in the formula
}

export interface FormulaBlocksResponse {
  blocks: FormulaBlock[]
  block_operators: string[] // AND/OR between blocks
  assembled_formula: string
  ipc_codes: string[]
  excluded_terms: string[]
  explanation: string
  tips: string[]
}

export interface FormulaAssembleResponse {
  assembled_formula: string
}

// ============================================================================
// Formula API
// ============================================================================

/**
 * Generate a KIPRIS search formula from invention description
 */
export async function generateFormula(
  text: string,
  options?: FormulaOptions,
): Promise<FormulaResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/formula/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, options }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Improve an existing KIPRIS search formula based on feedback
 */
export async function improveFormula(
  originalFormula: string,
  originalKeywords: string[],
  originalSynonyms: Record<string, string[]>,
  originalExcludedTerms: string[],
  feedback: 'too_many' | 'too_few' | 'noisy',
  additionalContext?: string,
): Promise<FormulaResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/formula/improve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      original_formula: originalFormula,
      original_keywords: originalKeywords,
      original_synonyms: originalSynonyms,
      original_excluded_terms: originalExcludedTerms,
      feedback,
      additional_context: additionalContext,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Generate a block-based KIPRIS search formula from invention description
 */
export async function generateFormulaBlocks(
  text: string,
  options?: FormulaOptions,
): Promise<FormulaBlocksResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/formula/generate-blocks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, options }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Assemble a KIPRIS search formula from user-edited blocks
 */
export async function assembleFormula(
  blocks: FormulaBlock[],
  blockOperators: string[],
  ipcCodes?: string[],
  excludedTerms?: string[],
): Promise<FormulaAssembleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/formula/assemble`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      blocks,
      block_operators: blockOperators,
      ipc_codes: ipcCodes || [],
      excluded_terms: excludedTerms || [],
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// Collection Types
// ============================================================================

// @TODO-11 — Add collection and LDA API functions
export interface CollectRequest {
  formula: string
  max_results?: number
}

export interface PatentItem {
  application_number: string
  title: string
  abstract: string | null
  ipc_codes: string[]
  applicant: string | null
  application_date: string | null
  publication_number: string | null
  register_number: string | null
}

export interface CollectResponse {
  patents: PatentItem[]
  total: number
  collected: number
  formula: string
}

// ============================================================================
// LDA Types
// ============================================================================

export interface TopicCoordinate {
  x: number
  y: number
}

export interface Topic {
  id: number
  keywords: string[]
  keyword_weights?: number[]
  weight: number
  coordinate?: TopicCoordinate | null
  label?: string
}

export interface DocumentTopic {
  patent_id: string
  topic_id: number
  probability: number
  topic_distribution: number[]
}

export interface YearlyCount {
  year: number
  count: number
}

export interface TechFieldCount {
  field: string
  count: number
  percentage: number
}

export interface IPCCount {
  code: string
  description: string
  count: number
  percentage: number
}

export interface QuantitativeResult {
  yearly_trend: YearlyCount[]
  tech_field_distribution: TechFieldCount[]
  ipc_distribution: IPCCount[]
}

export interface PatentMetadata {
  application_date?: string | null
  ipc_codes: string[]
}

export interface PatentForLDA {
  id: string
  text: string
  metadata?: PatentMetadata | null
}

export interface LDARequest {
  patents: PatentForLDA[]
  num_topics?: number | "auto"
  min_df?: number
  max_df?: number
}

export interface LDAResponse {
  topics: Topic[]
  documents: DocumentTopic[]
  coherence_score: number
  num_topics: number
  vocabulary_size: number
  quantitative?: QuantitativeResult | null
}

// ============================================================================
// Collection API
// ============================================================================

const mockCollectPatents = async (request: CollectRequest): Promise<CollectResponse> => {
  console.log('[MOCK] Collecting patents:', request.formula)
  await delay(2000)
  const mockPatents: PatentItem[] = Array.from({ length: Math.min(request.max_results || 100, 20) }, (_, i) => ({
    application_number: `1020240${String(i + 1).padStart(6, '0')}`,
    title: `Mock Patent ${i + 1}: ${request.formula} Technology`,
    abstract: `This invention relates to ${request.formula} with improved efficiency and performance.`,
    ipc_codes: ['G06F', 'H04L'],
    applicant: 'Mock Company Inc.',
    application_date: '2024-01-15',
    publication_number: null,
    register_number: null,
  }))
  return {
    patents: mockPatents,
    total: 100,
    collected: mockPatents.length,
    formula: request.formula,
  }
}

/**
 * Collect patents from KIPRIS using a search formula
 */
export async function collectPatents(request: CollectRequest): Promise<CollectResponse> {
  if (MOCK_MODE) {
    return mockCollectPatents(request)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/patent/collect`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// LDA API
// ============================================================================

const mockAnalyzeLDA = async (request: LDARequest): Promise<LDAResponse> => {
  console.log('[MOCK] Analyzing LDA:', request.patents.length, 'documents')
  await delay(3000)
  const numTopics = request.num_topics === 'auto' ? 5 : request.num_topics || 5
  return {
    topics: Array.from({ length: numTopics }, (_, i) => ({
      id: i,
      keywords: [`keyword${i + 1}a`, `keyword${i + 1}b`, `keyword${i + 1}c`, `keyword${i + 1}d`, `keyword${i + 1}e`],
      weight: 0.2 - i * 0.02,
    })),
    documents: request.patents.map((p, i) => ({
      patent_id: p.id,
      topic_id: i % numTopics,
      probability: 0.7 + Math.random() * 0.3,
      topic_distribution: Array.from({ length: numTopics }, () => Math.random()),
    })),
    coherence_score: 0.45,
    num_topics: numTopics,
    vocabulary_size: 1500,
  }
}

/**
 * Perform LDA topic modeling on patent texts
 */
export async function analyzeLDA(request: LDARequest): Promise<LDAResponse> {
  if (MOCK_MODE) {
    return mockAnalyzeLDA(request)
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/analysis/lda`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    // Handle Pydantic validation errors (array of objects)
    let message = `HTTP ${response.status}`
    if (typeof error.detail === 'string') {
      message = error.detail
    } else if (Array.isArray(error.detail) && error.detail.length > 0) {
      message = error.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(', ')
    }
    throw new Error(message)
  }

  return response.json()
}



// ============================================================================
// SNA Types
// ============================================================================

export interface SNANode {
  id: number
  name: string
  label: string
  frequency: number
}

export interface SNAEdge {
  source: number
  target: number
  weight: number
}

export interface YearlyData {
  year: number
  nodes: SNANode[]
  edges: SNAEdge[]
  patent_count: number
}

export interface SNAResult {
  nodes: SNANode[]
  edges: SNAEdge[]
  total_patents: number
  code_length: number
  year_range: [number, number] | null
  yearly_data: YearlyData[] | null
}

export interface SNAParams {
  word: string
  codeLength?: number
  pageSize?: number
  startYear?: number
  endYear?: number
  includeYearly?: boolean
  enableFilter?: boolean
  minSimilarity?: number
}

// ============================================================================
// SNA API
// ============================================================================

export async function analyzeSNA(params: SNAParams): Promise<SNAResult> {
  const searchParams = new URLSearchParams({
    word: params.word,
    code_length: (params.codeLength ?? 4).toString(),
    page_size: (params.pageSize ?? 500).toString(),
    include_yearly: (params.includeYearly ?? true).toString(),
  })

  if (params.startYear) {
    searchParams.set('start_year', params.startYear.toString())
  }
  if (params.endYear) {
    searchParams.set('end_year', params.endYear.toString())
  }
  if (params.enableFilter !== undefined) {
    searchParams.set('enable_filter', params.enableFilter.toString())
  }
  if (params.minSimilarity !== undefined) {
    searchParams.set('min_similarity', params.minSimilarity.toString())
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/patent/sna/free?${searchParams}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

/**
 * Download patent specification as Word document
 */
export async function downloadPatentWord(sessionId: string, title: string): Promise<void> {
  if (MOCK_MODE) {
    console.log('🎭 [MOCK] Downloading Word document for session:', sessionId)
    alert('MOCK mode: Word file will be downloaded when connected to actual backend.')
    return
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/patent/download/${sessionId}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/\s+/g, '_')}.docx`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}

// ============================================================================
// ============================================================================

export interface FreeSearchResult {
  serial_number?: string | null
  application_number?: string | null
  application_date?: string | null
  invention_name?: string | null
  abstract?: string | null
  ipc_number?: string | null
  applicant?: string | null
  drawing_path?: string | null
  registration_status?: string | null
}

export interface NoiseRemovalConfig {
  embedding_query: string
  embedding_threshold: number
}

export interface ExcludedSummary {
  duplicate: number
  low_similarity: number
}

export interface NoiseRemovalResult {
  input_count: number
  after_dedup_count: number
  final_count: number
  valid_patents: FreeSearchResult[]
  excluded_summary: ExcludedSummary
}

export interface NoiseRemovalRequest {
  patents: FreeSearchResult[]
  config: NoiseRemovalConfig
}

export interface NoiseRemovalResponse {
  result: NoiseRemovalResult
  excluded_patents: unknown[] | null
}

/**
 * Process patents through the 2-step noise removal pipeline
 */
export async function processNoiseRemoval(
  request: NoiseRemovalRequest
): Promise<NoiseRemovalResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/noise-removal/process`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// KIPRIS Direct Search API
// ============================================================================

export interface KIPRISSearchRequest {
  keywords: string[]
  synonyms?: Record<string, string[]>
  max_results?: number
}

export interface KIPRISSearchResponse {
  patents: FreeSearchResult[]
  total_found: number
  collected: number
  search_query: string
}

/**
 * Search KIPRIS directly using keywords
 */
export async function searchKIPRIS(
  request: KIPRISSearchRequest
): Promise<KIPRISSearchResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/kipris/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

// ============================================================================
// Unified Analysis Pipeline Types and API
// ============================================================================

export interface PipelineRequest {
  description: string
  max_patents?: number
  num_topics?: number | "auto"
  enable_noise_removal?: boolean
  noise_removal_config?: NoiseRemovalConfig | null
}

export interface PipelineStepResult {
  step: string
  status: string
  count?: number | null
  message?: string | null
}

export interface SearchResultSummary {
  total_found: number
  collected: number
  search_keywords: string[]
}

export interface NoiseRemovalSummary {
  input_count: number
  after_dedup_count: number
  output_count: number
  duplicate_removed: number
  low_similarity_removed: number
}

export interface PipelineResponse {
  steps: PipelineStepResult[]
  generated_keywords: string[]
  generated_synonyms: Record<string, string[]>
  generated_ipc_codes: string[]
  generated_noise_config: NoiseRemovalConfig | null
  search_summary: SearchResultSummary | null
  noise_removal_summary: NoiseRemovalSummary | null
  filtered_patents: FreeSearchResult[]
  lda_result: LDAResponse | null
  error: string | null
}

/**
 * Run unified analysis pipeline: NL → Keywords → Search → Noise Removal → LDA
 */
export async function runAnalysisPipeline(
  request: PipelineRequest
): Promise<PipelineResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/analysis/pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Unknown error" }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}