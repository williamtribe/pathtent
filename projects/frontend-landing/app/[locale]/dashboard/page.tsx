"use client"

import type { ReactNode } from "react"
import { motion } from "motion/react"
import { Link } from "@/i18n/routing"
import { useFadeIn } from "@/hooks/use-fade-in"
import {
  FileText,
  Search,
  Network,
  BarChart3,
  Cloud,
  TrendingUp,
  ArrowRight,
} from "lucide-react"

const features = [
  {
    id: "generate",
    title: "Patent Drafting",
    description: "AI-powered patent specification drafting from research papers",
    icon: FileText,
    href: "/generate",
    status: "active" as const,
  },
  {
    id: "formula",
    title: "Search Formula Generator",
    description: "AI-powered patent search formula generation with keyword expansion",
    icon: Search,
    href: "/formula",
    status: "active" as const,
  },
  {
    id: "sna",
    title: "SNA Analysis",
    description: "Social Network Analysis for patent citation and collaboration patterns",
    icon: Network,
    href: "/sna",
    status: "active" as const,
  },
  // @TODO-13 — Change LDA status to active
  {
    id: "lda",
    title: "LDA Clustering",
    description: "Topic modeling and document clustering using LDA algorithm",
    icon: BarChart3,
    href: "/lda",
    status: "active" as const,
  },
  {
    id: "wordcloud",
    title: "Word Cloud",
    description: "Visual representation of keyword frequency and importance",
    icon: Cloud,
    href: "/wordcloud",
    status: "coming-soon" as const,
  },
  {
    id: "analytics",
    title: "Quantitative Analysis",
    description: "Statistical analysis and trend visualization of patent data",
    icon: TrendingUp,
    href: "/analytics",
    status: "coming-soon" as const,
  },
]

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

      <section className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <FadeInWrapper>
            <div className="mb-10 flex items-center gap-3">
              <div className="h-1 w-8 rounded-full bg-gradient-to-r from-rose-500 to-orange-500" />
              <h2 className="text-text-muted text-sm font-semibold tracking-wider uppercase">
                Analysis Modules
              </h2>
            </div>
          </FadeInWrapper>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <FeatureCard key={feature.id} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
