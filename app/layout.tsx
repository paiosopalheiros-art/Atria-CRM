import type { Metadata } from "next"
import type React from "react"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import ClientWrapper from "@/components/client-wrapper"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Atria - CRM Imobiliário",
  description: "Plataforma completa de CRM para imobiliárias",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} antialiased`}>
      <head>
        {/* CSP via meta para liberar o endpoint do Speed Insights no preview do v0 */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="
            default-src 'self';
            script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;
            style-src 'self' 'unsafe-inline' https:;
            img-src 'self' data: blob: https:;
            font-src 'self' data: https:;
            frame-src 'self' https:;
            frame-ancestors 'self';
            connect-src
              'self'
              https://v0.dev
              https://v0.app
              https://v0chat.vercel.sh
              https://vercel.live/
              https://vercel.com
              https://*.pusher.com/
              wss://*.pusher.com/
              https://blob.vercel-storage.com
              https://*.blob.vercel-storage.com
              https://blobs.vusercontent.net
              https://fides-vercel.us.fides.ethyca.com/api/v1/
              https://cdn-api.ethyca.com/location
              https://privacy-vercel.us.fides.ethyca.com/api/v1/
              https://api.getkoala.com
              https://*.sentry.io/api/
              https://api.v0.dev;
          "
        />
      </head>
      <body className="min-h-screen bg-background font-sans">
        <ClientWrapper>
          <AuthProvider>{children}</AuthProvider>
        </ClientWrapper>
      </body>
    </html>
  )
}
