"use client"

import type { ReactNode } from "react"
import { motion } from "motion/react"
import { Link } from "@/i18n/routing"
import { useFadeIn } from "@/hooks/use-fade-in"
import {
  FileText,
  Search,
  BarChart3,
  Cloud,
  TrendingUp,
  ArrowRight,
} from "lucide-react"

// Category 1: Patent Analysis (Active)
const patentAnalysisFeatures = [
  {
    id: "lda",
    title: "통합 키워드 분석",
    description: "자연어로 기술을 설명하면 AI가 키워드 추출, 특허 검색, 노이즈 제거, 토픽 분석까지 자동으로 수행합니다",
    icon: BarChart3,
    href: "/lda",
    status: "active" as const,
  },
  {
    id: "formula",
    title: "검색식 생성",
    description: "AI 기반 KIPRIS 특허 검색식 생성 및 키워드 확장",
    icon: Search,
    href: "/formula",
    status: "active" as const,
  },
]

// Category 2: Coming Soon
const comingSoonFeatures = [
  {
    id: "analytics",
    title: "정량 분석",
    description: "특허 데이터의 통계 분석 및 트렌드 시각화",
    icon: TrendingUp,
    href: "/analytics",
    status: "coming-soon" as const,
  },
  {
    id: "wordcloud",
    title: "워드 클라우드",
    description: "키워드 빈도 및 중요도의 시각적 표현",
    icon: Cloud,
    href: "/wordcloud",
    status: "coming-soon" as const,
  },
]

// Category 3: Patent Drafting
const patentDraftingFeatures = [
  {
    id: "generate",
    title: "명세서 작성",
    description: "연구 논문에서 AI 기반 특허 명세서 자동 작성",
    icon: FileText,
    href: "/generate",
    status: "active" as const,
  },
]

// Combined for type inference in components
const features = [...patentAnalysisFeatures, ...comingSoonFeatures, ...patentDraftingFeatures]

function FadeInWrapper({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const { ref, isVisible } = useFadeIn(0.1)

  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function FeatureCard({ feature, index }: { feature: (typeof features)[0]; index: number }) {
  const isActive = feature.status === "active"

  return (
    <FadeInWrapper delay={index * 100}>
      <motion.div
        whileHover={isActive ? { scale: 1.02, y: -4 } : {}}
        whileTap={isActive ? { scale: 0.98 } : {}}
        className="h-full"
      >
        {isActive ? (
          <Link href={feature.href} className="block h-full">
            <CardContent feature={feature} isActive={isActive} />
          </Link>
        ) : (
          <div className="h-full cursor-not-allowed">
            <CardContent feature={feature} isActive={isActive} />
          </div>
        )}
      </motion.div>
    </FadeInWrapper>
  )
}

function CardContent({ feature, isActive }: { feature: (typeof features)[0]; isActive: boolean }) {
  const Icon = feature.icon

  return (
    <div
      className={`relative h-full overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 ${
        isActive
          ? "border-border hover:border-primary/30 hover:shadow-lg"
          : "border-border/50 opacity-70"
      }`}
    >
      <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-blue-400" />

      {!isActive && (
        <div className="absolute top-4 right-4">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
            Coming Soon
          </span>
        </div>
      )}

      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>

      <h3 className="text-text mb-2 text-xl font-bold">{feature.title}</h3>
      <p className="text-text-muted mb-4 text-sm leading-relaxed">{feature.description}</p>

      {isActive && (
        <div className="text-primary flex items-center gap-2 text-sm font-medium">
          <span>Get Started</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <main className="bg-surface min-h-screen w-full">
      <section className="relative overflow-hidden bg-white px-6 py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="from-primary/5 absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br to-transparent" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-rose-500/5 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <FadeInWrapper>
            <h1 className="text-center text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              <span className="text-text">Patent Analysis</span>{" "}
              <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>
          </FadeInWrapper>

          <FadeInWrapper delay={100}>
            <p className="text-text-muted mx-auto mt-6 max-w-2xl text-center text-lg md:text-xl">
              Comprehensive tools for patent research, analysis, and visualization.
              <br className="hidden md:block" />
              Start exploring with our AI-powered analysis modules.
            </p>
          </FadeInWrapper>
        </div>
       </section>

       {/* Category 1: Patent Analysis */}
      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <FadeInWrapper>
            <div className="mb-10 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-rose-500 to-orange-500" />
              <h2 className="text-text-muted text-sm font-semibold tracking-wider uppercase">
                특허 분석
              </h2>
            </div>
          </FadeInWrapper>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {patentAnalysisFeatures.map((feature, index) => (
              <FeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Category 2: Patent Drafting */}
      <section className="px-6 py-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <FadeInWrapper>
            <div className="mb-10 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
              <h2 className="text-text-muted text-sm font-semibold tracking-wider uppercase">
                명세서 작성
              </h2>
            </div>
          </FadeInWrapper>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {patentDraftingFeatures.map((feature, index) => (
              <FeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Category 3: Coming Soon */}
      <section className="px-6 pt-8 pb-16 md:pt-12 md:pb-24">
        <div className="mx-auto max-w-7xl">
          <FadeInWrapper>
            <div className="mb-10 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-500" />
              <h2 className="text-text-muted text-sm font-semibold tracking-wider uppercase">
                Coming Soon
              </h2>
            </div>
          </FadeInWrapper>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {comingSoonFeatures.map((feature, index) => (
              <FeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
