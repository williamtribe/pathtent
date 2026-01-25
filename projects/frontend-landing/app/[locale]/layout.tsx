import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Inter, IBM_Plex_Sans } from 'next/font/google'
import { Header } from '@/components/layout/header'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const ibmPlexSans = IBM_Plex_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
})

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: 'PatentAI - AI 기반 특허 명세서 생성',
  description: '연구 논문을 입력하면 AI가 특허 명세서를 자동으로 작성해드립니다.',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`
        ${GeistSans.variable}
        ${GeistMono.variable}
        ${inter.variable}
        ${ibmPlexSans.variable}
      `}
    >
      <body className="font-[family-name:var(--font-inter)] bg-white text-text">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <div className="pt-16">{children}</div>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
