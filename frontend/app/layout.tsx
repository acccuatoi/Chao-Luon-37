import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import {
  TideCloakProvider
} from '@tidecloak/nextjs'
import tcConfig from '../tidecloak.json'


export const metadata: Metadata = {
  title: 'SentinelAgent',
  description: 'SentinelAgent (Cháo Lươn 37) - Quorum-Governed AI Agent with Multi-Party Approval',
}

interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>
        <TideCloakProvider config={tcConfig}>
          {children}
        </TideCloakProvider>
      </body>
    </html>
  )
}
