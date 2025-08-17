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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} antialiased`}>
      <head>
        <title>Atria - CRM Imobiliário</title>
        <meta name="description" content="Plataforma completa de CRM para imobiliárias" />
      </head>
      <body className="min-h-screen bg-background font-sans">
        <ClientWrapper>
          <AuthProvider>{children}</AuthProvider>
        </ClientWrapper>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
