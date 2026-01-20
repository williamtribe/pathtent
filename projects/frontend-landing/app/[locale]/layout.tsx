import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Inter, IBM_Plex_Sans } from 'next/font/google'
import '@fontsource-variable/mona-sans'
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
  title: 'projects/frontend-landing',
  description: 'Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui + next-intl',
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
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
