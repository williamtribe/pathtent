"use client"

import { motion } from "motion/react"
import { Link } from "@/i18n/routing"
import { ArrowRight } from "lucide-react"
import Threads from "@/components/ui/threads"
import TargetCursor from "@/components/ui/target-cursor"
import ScrollTyping from "@/components/ui/scroll-typing"
import FadeContent from "@/components/ui/fade-content"

export default function Home() {
  return (
    <>
      <TargetCursor targetSelector=".cursor-target" />

      <main className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-white to-black text-text">
        {/* Hero Section - Full viewport */}
        <section className="relative flex min-h-screen flex-col items-center justify-center px-6">
          {/* Threads Background - aligned with Pathtent text */}
          <div className="pointer-events-none absolute inset-0 -translate-y-[20%] opacity-30">
            <Threads color={[0.18, 0.34, 0.99]} amplitude={2} distance={0.3} />
          </div>

          {/* Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-10 max-w-5xl text-center"
          >
            <h1 className="mb-8 text-6xl font-bold tracking-tight text-text md:text-8xl lg:text-9xl">
              Pathtent
            </h1>

            <p className="mx-auto mb-12 max-w-2xl text-xl text-text-muted md:text-2xl">
              AI-powered patent drafting. From idea to filing, simplified.
            </p>

            <Link href="/generate">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-target inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-hover"
              >
                Start Creating <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-12 w-6 rounded-full border-2 border-text/20"
            >
              <motion.div
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mt-2 h-2 w-1 rounded-full bg-text/30"
              />
            </motion.div>
          </motion.div>
        </section>

        {/* Tagline Section - Scroll-hijacked Typing Animation */}
        <ScrollTyping
          text="Revolutionizing Revolutions."
          className="text-5xl font-bold tracking-tight text-text md:text-7xl lg:text-8xl"
        />

        {/* Problem Statement */}
        <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24">
          <div className="max-w-4xl text-center">
            <FadeContent className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
              The Problem
            </FadeContent>
            <FadeContent className="text-3xl font-medium leading-relaxed text-white/60 md:text-4xl lg:text-5xl">
              Patent drafting is{" "}
              <span className="text-white">complex</span>,{" "}
              <span className="text-white">expensive</span>, and{" "}
              <span className="text-white">time-consuming</span>.
            </FadeContent>
          </div>
        </section>

        {/* Solution Statement */}
        <section className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24">
          <div className="max-w-4xl text-center">
            <FadeContent className="mb-8 text-sm font-medium uppercase tracking-widest text-primary">
              The Solution
            </FadeContent>
            <div className="space-y-6 text-3xl font-medium leading-relaxed md:text-4xl lg:text-5xl">
              <FadeContent className="text-white/60">
                <span className="text-white">AI</span> that understands patents.
              </FadeContent>
              <FadeContent className="text-white/60">
                <span className="text-white">Automation</span> that saves weeks.
              </FadeContent>
              <FadeContent className="text-white/60">
                <span className="text-white">Quality</span> you can trust.
              </FadeContent>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="mb-8 text-4xl font-bold text-white md:text-6xl">Ready to innovate?</h2>

            <Link href="/generate">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="cursor-target inline-flex items-center gap-3 rounded-full bg-primary px-10 py-5 text-xl font-semibold text-white transition-all hover:bg-primary-hover"
              >
                Get Started <ArrowRight className="h-6 w-6" />
              </motion.button>
            </Link>
          </motion.div>
        </section>
      </main>
    </>
  )
}
