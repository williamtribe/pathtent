"use client"

import { motion } from "motion/react"
import { CheckCircle, Circle, Loader2, BarChart3 } from "lucide-react"

export interface ExcludedSummary {
  duplicate: number
  ipc_excluded: number
  ipc_not_included: number
  keyword_missing: number
  keyword_excluded: number
  low_similarity: number
}

export interface NoiseRemovalResult {
  input_count: number
  step1_count: number
  step2_count: number
  step3_count: number
  step4_count: number | null
  final_count: number
  excluded_summary: ExcludedSummary
}

interface ResultsPanelProps {
  result: NoiseRemovalResult | null
  isLoading: boolean
}

interface StepItemProps {
  number: number
  label: string
  beforeCount: number
  afterCount: number
  isActive: boolean
  isComplete: boolean
}

function StepItem({ number, label, beforeCount, afterCount, isActive, isComplete }: StepItemProps) {
  const removed = beforeCount - afterCount
  const percentage = beforeCount > 0 ? ((removed / beforeCount) * 100).toFixed(1) : "0.0"

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: number * 0.1 }}
      className={`flex items-center gap-4 rounded-lg p-4 ${
        isActive ? "bg-blue-50 border border-blue-200" : "bg-slate-50"
      }`}
    >
      <div className="flex-shrink-0">
        {isComplete ? (
          <CheckCircle className="h-6 w-6 text-green-600" />
        ) : isActive ? (
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        ) : (
          <Circle className="h-6 w-6 text-slate-300" />
        )}
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span className="font-medium text-slate-900">
            {number}차 {label}
          </span>
          {isComplete && (
            <span className="text-sm text-slate-500">-{percentage}%</span>
          )}
        </div>
        {isComplete && (
          <div className="mt-1 text-sm text-slate-600">
            {beforeCount.toLocaleString()} → {afterCount.toLocaleString()}건
            <span className="ml-2 text-red-600">(-{removed.toLocaleString()})</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ResultsPanel({ result, isLoading }: ResultsPanelProps) {
  if (!result && !isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-center text-slate-500">
          <BarChart3 className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p>설정을 구성하고 노이즈 제거를 실행하세요.</p>
        </div>
      </div>
    )
  }

  const steps = result
    ? [
        {
          number: 1,
          label: "중복 제거",
          beforeCount: result.input_count,
          afterCount: result.step1_count,
        },
        {
          number: 2,
          label: "IPC 필터링",
          beforeCount: result.step1_count,
          afterCount: result.step2_count,
        },
        {
          number: 3,
          label: "키워드 매칭",
          beforeCount: result.step2_count,
          afterCount: result.step3_count,
        },
        ...(result.step4_count !== null
          ? [
              {
                number: 4,
                label: "임베딩 필터링",
                beforeCount: result.step3_count,
                afterCount: result.step4_count,
              },
            ]
          : []),
      ]
    : []

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-semibold text-slate-900">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        처리 결과
      </h2>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => (
          <StepItem
            key={step.number}
            number={step.number}
            label={step.label}
            beforeCount={step.beforeCount}
            afterCount={step.afterCount}
            isActive={isLoading}
            isComplete={!isLoading}
          />
        ))}

        {result?.step4_count === null && (
          <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4 text-slate-400">
            <Circle className="h-6 w-6" />
            <span>4차 임베딩 필터링 (미사용)</span>
          </div>
        )}
      </div>

      {/* Final Result */}
      {result && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 border-t border-slate-200 pt-6"
        >
          <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="text-sm font-medium opacity-90">최종 유효 데이터</div>
            <div className="mt-1 text-4xl font-bold">{result.final_count.toLocaleString()}건</div>
            <div className="mt-2 text-sm opacity-75">
              입력 {result.input_count.toLocaleString()}건 중{" "}
              {result.input_count > 0
                ? ((result.final_count / result.input_count) * 100).toFixed(1)
                : "0.0"}% 유지
            </div>
          </div>

          {/* Excluded Summary */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">제외 사유별 통계</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {result.excluded_summary.duplicate > 0 && (
                <div className="rounded bg-slate-100 px-3 py-2">
                  <span className="text-slate-600">중복: </span>
                  <span className="font-medium">{result.excluded_summary.duplicate.toLocaleString()}</span>
                </div>
              )}
              {result.excluded_summary.ipc_excluded > 0 && (
                <div className="rounded bg-slate-100 px-3 py-2">
                  <span className="text-slate-600">IPC 제외: </span>
                  <span className="font-medium">{result.excluded_summary.ipc_excluded.toLocaleString()}</span>
                </div>
              )}
              {result.excluded_summary.ipc_not_included > 0 && (
                <div className="rounded bg-slate-100 px-3 py-2">
                  <span className="text-slate-600">IPC 미포함: </span>
                  <span className="font-medium">{result.excluded_summary.ipc_not_included.toLocaleString()}</span>
                </div>
              )}
              {result.excluded_summary.keyword_missing > 0 && (
                <div className="rounded bg-slate-100 px-3 py-2">
                  <span className="text-slate-600">키워드 없음: </span>
                  <span className="font-medium">{result.excluded_summary.keyword_missing.toLocaleString()}</span>
                </div>
              )}
              {result.excluded_summary.keyword_excluded > 0 && (
                <div className="rounded bg-slate-100 px-3 py-2">
                  <span className="text-slate-600">키워드 제외: </span>
                  <span className="font-medium">{result.excluded_summary.keyword_excluded.toLocaleString()}</span>
                </div>
              )}
              {result.excluded_summary.low_similarity > 0 && (
                <div className="rounded bg-slate-100 px-3 py-2">
                  <span className="text-slate-600">유사도 낮음: </span>
                  <span className="font-medium">{result.excluded_summary.low_similarity.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
