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

const cardHoverVariants: Variants = {
  hover: { 
    translateY: -4, 
    translateX: -4, 
    boxShadow: '8px 8px 0px 0px #000000',
    transition: { duration: 0.2 } 
  },
  tap: { 
    translateY: 0, 
    translateX: 0, 
    boxShadow: '0px 0px 0px 0px #000000',
    transition: { duration: 0.1 } 
  }
}

export default function Home() {
  const t = useTranslations('home')

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-white text-nb-black selection:bg-nb-pink selection:text-white">
      <section className="relative flex flex-col items-center justify-center border-b-4 border-nb-black bg-white px-6 py-24 text-center md:py-32">
        <div className="absolute top-10 right-10 h-16 w-16 animate-bounce rounded-full border-4 border-nb-black bg-nb-yellow shadow-neo md:h-24 md:w-24" />
        <div className="absolute bottom-20 left-10 h-12 w-12 rotate-12 border-4 border-nb-black bg-nb-blue shadow-neo md:h-20 md:w-20" />
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative z-10 max-w-4xl"
        >
          <motion.div variants={itemVariants} className="mb-6 inline-block rotate-[-2deg] rounded-lg border-4 border-nb-black bg-nb-green px-4 py-2 text-xl font-bold uppercase shadow-neo">
            New: Gemini 2.0 Integration
          </motion.div>
          
          <motion.h1 variants={itemVariants} className="mb-6 text-5xl font-black leading-tight tracking-tight uppercase md:text-7xl lg:text-8xl">
            {t.rich('hero.title', { br: () => <br /> })}
          </motion.h1>
          
          <motion.p variants={itemVariants} className="mx-auto mb-10 max-w-2xl text-xl font-bold text-gray-800 md:text-2xl">
            {t('hero.subtitle')}
          </motion.p>
          
          <Link href="/generate">
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05, boxShadow: '8px 8px 0px 0px #000000' }}
              whileTap={{ scale: 0.95, boxShadow: '0px 0px 0px 0px #000000', translateY: 4, translateX: 4 }}
              className="inline-flex items-center gap-2 rounded-xl border-4 border-nb-black bg-nb-pink px-8 py-4 text-2xl font-black uppercase text-white shadow-neo transition-all"
            >
              {t('hero.cta')} <ArrowRight className="h-8 w-8 stroke-[3]" />
            </motion.button>
          </Link>
        </motion.div>
      </section>

      <section className="border-b-4 border-nb-black bg-nb-yellow px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="inline-block rounded-lg border-4 border-nb-black bg-white px-8 py-4 text-4xl font-black uppercase shadow-neo md:text-5xl">
              {t('howItWorks.title')}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative flex flex-col rounded-xl border-4 border-nb-black bg-white p-6 shadow-neo"
              >
                <div className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-4 border-nb-black bg-nb-blue text-xl font-black text-white shadow-sm">
                  {step}
                </div>
                <div className="mt-6 flex flex-1 flex-col items-center text-center">
                  <div className="mb-4 rounded-full border-2 border-nb-black bg-gray-100 p-3">
                     {step === 1 && <FileText size={32} />}
                     {step === 2 && <Cpu size={32} />}
                     {step === 3 && <Search size={32} />}
                     {step === 4 && <Database size={32} />}
                     {step === 5 && <Check size={32} />}
                  </div>
                  <h3 className="mb-2 text-xl font-black uppercase">{t(`howItWorks.step${step}.title`)}</h3>
                  <p className="text-sm font-bold text-gray-600">{t(`howItWorks.step${step}.desc`)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <h2 className="mb-16 text-center text-4xl font-black uppercase md:text-6xl">
            {t('features.title')}
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2">
            {[
              { id: 'feature1', color: 'bg-nb-pink', icon: Cpu },
              { id: 'feature2', color: 'bg-nb-blue', icon: FileText },
              { id: 'feature3', color: 'bg-nb-green', icon: Database },
              { id: 'feature4', color: 'bg-nb-yellow', icon: Search },
            ].map((feature, idx) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover="hover"
                variants={cardHoverVariants}
                className={`flex items-start gap-6 rounded-xl border-4 border-nb-black ${feature.color} p-8 shadow-neo`}
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-4 border-nb-black bg-white shadow-sm">
                  <feature.icon size={32} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="mb-2 text-2xl font-black uppercase text-nb-black">
                    {t(`features.${feature.id}`)}
                  </h3>
                  <p className="text-lg font-bold opacity-80">
                    KIPRIS API & Gemini
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t-4 border-nb-black bg-nb-black py-24 text-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl px-6"
        >
          <h2 className="mb-8 text-4xl font-black uppercase md:text-6xl">
            {t('ctaSection.title')}
          </h2>
          <Link href="/generate">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '8px 8px 0px 0px #ffffff' }}
              whileTap={{ scale: 0.95, boxShadow: '0px 0px 0px 0px #ffffff', translateY: 4, translateX: 4 }}
              className="inline-block rounded-xl border-4 border-white bg-nb-blue px-10 py-5 text-2xl font-black uppercase text-white shadow-[4px_4px_0px_0px_#ffffff] transition-all"
            >
              {t('ctaSection.button')}
            </motion.button>
          </Link>
        </motion.div>
      </section>
    </main>
  )
}
