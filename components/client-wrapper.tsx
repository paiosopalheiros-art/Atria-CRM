"use client"
import { useEffect } from "react"
import type React from "react"

interface ClientWrapperProps {
  children: React.ReactNode
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === "string" && event.reason.includes("MetaMask")) {
        console.log("[v0] Silencing MetaMask error (not relevant for this CRM):", event.reason)
        event.preventDefault()
      }
    }

    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes("MetaMask")) {
        console.log("[v0] Silencing MetaMask error (not relevant for this CRM):", event.message)
        event.preventDefault()
      }
    }

    window.addEventListener("unhandledrejection", handleUnhandledRejection)
    window.addEventListener("error", handleError)

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
      window.removeEventListener("error", handleError)
    }
  }, [])

  return <>{children}</>
}
