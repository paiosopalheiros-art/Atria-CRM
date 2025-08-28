"use client"
import type React from "react"
import { DM_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { useEffect } from "react"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
})

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const reasonString = typeof reason === "string" ? reason : reason?.message || String(reason)

      if (
        reasonString &&
        (reasonString.includes("MetaMask") ||
          reasonString.includes("Failed to connect to MetaMask") ||
          reasonString.includes("ethereum") ||
          reasonString.includes("web3"))
      ) {
        console.log("[v0] Silencing MetaMask/Web3 error (not relevant for this CRM):", reasonString)
        event.preventDefault()
        return
      }
    }

    const handleError = (event: ErrorEvent) => {
      if (
        event.message &&
        (event.message.includes("MetaMask") || event.message.includes("ethereum") || event.message.includes("web3"))
      ) {
        console.log("[v0] Silencing MetaMask/Web3 error (not relevant for this CRM):", event.message)
        event.preventDefault()
        return
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("error", handleError)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      window.removeEventListener("error", handleError)
    }
  }, [])

  return (
    <html lang="pt-BR" className={`${dmSans.variable} antialiased`}>
      <head>
        <title>Atria - CRM Imobiliário</title>
        <meta name="description" content="Plataforma completa de CRM para imobiliárias" />
      </head>
      <body className="min-h-screen bg-background font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
