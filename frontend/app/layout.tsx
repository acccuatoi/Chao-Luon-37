import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Public_Sans, JetBrains_Mono } from 'next/font/google'
import { TideCloakProvider } from '@tidecloak/nextjs'
import rawConfig from '../tidecloak.json'

// The SDK enforces DPoP ("strict") by default. In the browser its metadata fetch to TideCloak fails, so init
// threw and the session was not restored on reload. Our backend verifies plain Bearer tokens, so DPoP is off.
// Sender-constrained (DPoP) tokens are on the roadmap; see README "Known limitations".
const tcConfig = { ...rawConfig, useDPoP: false } as typeof rawConfig
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
