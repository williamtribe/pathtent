/**
 * Patent Specification Generator API Client
 */

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
// API Functions
// ============================================================================

/**
 * Analyze research document and generate questions
 */
export async function analyzeDocument(text: string): Promise<AnalyzeResponse> {
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
  const response = await fetch(`${API_BASE_URL}/api/v1/patent/session/${sessionId}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}
