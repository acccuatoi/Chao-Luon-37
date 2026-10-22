import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Public_Sans, JetBrains_Mono } from 'next/font/google'
import { TideCloakProvider } from '@tidecloak/nextjs'
import tcConfig from '../tidecloak.json'
import './globals.css'

const sans = Public_Sans({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'SentinelAgent',
  description: 'An AI agent that can only propose payments. Two different people must approve before anything runs.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <TideCloakProvider config={tcConfig}>{children}</TideCloakProvider>
      </body>
    </html>
  )
}
