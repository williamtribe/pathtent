'use client'

import { motion, Variants } from 'motion/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { ArrowRight, Check, Search, Database, Cpu, FileText } from 'lucide-react'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
}

export default function Home() {
  const t = useTranslations('home')

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-text">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center border-b border-border bg-white px-6 py-24 text-center md:py-32">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative z-10 max-w-4xl"
        >
          <motion.div
            variants={itemVariants}
            className="mb-6 inline-block rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-primary"
          >
            New: Gemini 2.0 Integration
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl"
          >
            {t.rich('hero.title', { br: () => <br /> })}
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-10 max-w-2xl text-xl text-text-muted md:text-2xl"
          >
            {t('hero.subtitle')}
          </motion.p>

          <Link href="/generate">
            <motion.button
              variants={itemVariants}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-primary-hover"
            >
              {t('hero.cta')} <ArrowRight className="h-5 w-5" />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section className="border-b border-border bg-surface px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold md:text-5xl">{t('howItWorks.title')}</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative flex flex-col rounded-lg border border-border bg-white p-6"
              >
                <div className="absolute -top-4 left-1/2 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
                  {step}
                </div>
                <div className="mt-4 flex flex-1 flex-col items-center text-center">
                  <div className="mb-4 rounded-lg bg-secondary p-3">
                    {step === 1 && <FileText size={28} className="text-primary" />}
                    {step === 2 && <Cpu size={28} className="text-primary" />}
                    {step === 3 && <Search size={28} className="text-primary" />}
                    {step === 4 && <Database size={28} className="text-primary" />}
                    {step === 5 && <Check size={28} className="text-primary" />}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{t(`howItWorks.step${step}.title`)}</h3>
                  <p className="text-sm text-text-muted">{t(`howItWorks.step${step}.desc`)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-4xl font-bold md:text-5xl">{t('features.title')}</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { id: 'feature1', icon: Cpu },
              { id: 'feature2', icon: FileText },
              { id: 'feature3', icon: Database },
              { id: 'feature4', icon: Search },
            ].map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
                className="flex items-start gap-6 rounded-lg border border-border bg-white p-8 transition-all hover:border-primary"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <feature.icon size={28} className="text-primary" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-semibold">{t(`features.${feature.id}`)}</h3>
                  <p className="text-text-muted">KIPRIS API & Gemini</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/sna" className="inline-flex items-center gap-2 text-primary hover:underline font-medium">
              IPC 네트워크 분석 도구 살펴보기 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-surface py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl px-6"
        >
          <h2 className="mb-8 text-4xl font-bold md:text-5xl">{t('ctaSection.title')}</h2>
          <Link href="/generate">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block rounded-lg bg-primary px-10 py-5 text-lg font-semibold text-white transition-all hover:bg-primary-hover"
            >
              {t('ctaSection.button')}
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </main>
  )
}
