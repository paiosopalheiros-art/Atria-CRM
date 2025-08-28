import { createClient } from "@supabase/supabase-js"

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  },
)

export function splitCommission(totalValue: number, hasCaptador = true) {
  const platformPercentage = 0.1 // 10% para plataforma
  const captadorPercentage = 0.4 // 40% para captador
  const vendedorPercentage = 0.5 // 50% para vendedor

  const platformCut = Math.round(totalValue * platformPercentage * 100) / 100

  if (hasCaptador) {
    const captadorCut = Math.round(totalValue * captadorPercentage * 100) / 100
    const vendedorCut = totalValue - platformCut - captadorCut // Ajuste automático de centavos

    return {
      platformCut,
      captadorCut,
      vendedorCut,
    }
  } else {
    // Se não há captador, vendedor fica com 60% (40% + 50%)
    const vendedorCut = totalValue - platformCut // 90% para vendedor

    return {
      platformCut,
      captadorCut: 0,
      vendedorCut,
    }
  }
}
