import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// [CREDITOS] Credit System Helper Functions
export type PropertySource = "creci" | "user"
export type PropertyTier = "baixo" | "medio" | "luxo"

export interface PropertyCreditParams {
  source: PropertySource
  tier?: PropertyTier
}

export interface SpendCreditsParams {
  supabase: any
  userId: string
  amount: number
  reason: string
  propertyId?: string
  meta?: Record<string, any>
}

export interface SpendCreditsResult {
  ok: boolean
  error?: string
}

export function getPropertyCreditCost({ source, tier }: PropertyCreditParams): number {
  if (source === "creci") {
    return 3
  }

  if (source === "user") {
    switch (tier) {
      case "baixo":
        return 5
      case "medio":
        return 10
      case "luxo":
        return 15
      default:
        return 5 // default to baixo
    }
  }

  return 5 // fallback
}

export async function spendCreditsClient({
  supabase,
  userId,
  amount,
  reason,
  propertyId,
  meta = {},
}: SpendCreditsParams): Promise<SpendCreditsResult> {
  try {
    console.log("[v0] Attempting to spend credits:", { userId, amount, reason, propertyId })

    const { data, error } = await supabase.rpc("spend_credits", {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_property_id: propertyId || null,
      p_meta: meta,
    })

    if (error) {
      console.error("[v0] Error spending credits:", error)
      return { ok: false, error: error.message }
    }

    if (data === false) {
      console.log("[v0] Insufficient credits for transaction")
      return { ok: false, error: "Saldo insuficiente" }
    }

    console.log("[v0] Credits spent successfully")
    return { ok: true }
  } catch (err) {
    console.error("[v0] Exception spending credits:", err)
    return { ok: false, error: "Erro interno ao processar créditos" }
  }
}

export async function getMyCreditBalance(supabase: any): Promise<number> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return 0

    const { data, error } = await supabase
      .from("user_credit_balances")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("[v0] Error fetching credit balance:", error)
      return 0
    }

    return data?.balance || 0
  } catch (err) {
    console.error("[v0] Exception fetching credit balance:", err)
    return 0
  }
}
