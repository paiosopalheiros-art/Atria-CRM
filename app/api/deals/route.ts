import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin, splitCommission } from "@/lib/supabaseAdmin"

// API para fechamento de vendas com nova regra 10/40/50
export async function POST(request: NextRequest) {
  try {
    const { publicationId, sellerId, captorId, grossValue, commissionValue } = await request.json()

    if (!publicationId || !sellerId || !grossValue || !commissionValue) {
      return NextResponse.json(
        {
          error: "Missing required fields: publicationId, sellerId, grossValue, commissionValue",
        },
        { status: 400 },
      )
    }

    // Calcular split de comissão
    const hasCaptor = Boolean(captorId)
    const { platform, captor, seller } = splitCommission(commissionValue, hasCaptor)

    // Inserir deal
    const { data, error } = await supabaseAdmin
      .from("deals")
      .insert({
        publication_id: publicationId,
        seller_id: sellerId,
        captor_id: captorId || null,
        gross_value: grossValue,
        commission_value: commissionValue,
        platform_cut: platform,
        captor_cut: captor,
        seller_cut: seller,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      deal: data,
      breakdown: {
        total: commissionValue,
        platform: platform,
        captor: captor,
        seller: seller,
        percentages: hasCaptor ? "10% / 40% / 50%" : "10% / 0% / 60%",
      },
    })
  } catch (error) {
    console.error("[API] Error creating deal:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
