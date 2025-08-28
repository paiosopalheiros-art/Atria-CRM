"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

interface CheckoutButtonProps {
  plan: "pro" | "elite"
  className?: string
  children?: React.ReactNode
}

export default function CheckoutButton({ plan, className, children }: CheckoutButtonProps) {
  const handleCheckout = () => {
    const checkoutUrl =
      plan === "pro" ? process.env.NEXT_PUBLIC_KIRVANO_CHECKOUT_PRO : process.env.NEXT_PUBLIC_KIRVANO_CHECKOUT_ELITE

    if (!checkoutUrl) {
      alert("Link de checkout não configurado")
      return
    }

    window.location.href = checkoutUrl
  }

  const isConfigured =
    plan === "pro" ? !!process.env.NEXT_PUBLIC_KIRVANO_CHECKOUT_PRO : !!process.env.NEXT_PUBLIC_KIRVANO_CHECKOUT_ELITE

  return (
    <Button
      onClick={handleCheckout}
      disabled={!isConfigured}
      className={className}
      title={!isConfigured ? "Link de checkout não configurado" : undefined}
    >
      {children || `Assinar ${plan.toUpperCase()}`}
      <ExternalLink className="ml-2 h-4 w-4" />
    </Button>
  )
}
