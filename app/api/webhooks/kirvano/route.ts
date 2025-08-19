import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { createHash } from "crypto"

// GET endpoint para healthcheck
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "kirvano-webhook",
  })
}

// POST endpoint para processar webhooks
export async function POST(req: NextRequest) {
  try {
    // Ler raw body
    const raw = await req.text()

    // Verificar autorização por token
    const expectedToken = process.env.KIRVANO_WEBHOOK_TOKEN
    if (!expectedToken) {
      return NextResponse.json({ error: "webhook token not configured" }, { status: 500 })
    }

    // Buscar token em ordem de prioridade
    const url = new URL(req.url)
    const queryToken = url.searchParams.get("token")
    const headerToken = req.headers.get("x-webhook-token")
    const authHeader = req.headers.get("authorization")
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    const receivedToken = queryToken || headerToken || bearerToken

    if (receivedToken !== expectedToken) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    // Parse JSON com fallback
    let evt: any
    try {
      evt = JSON.parse(raw)
    } catch {
      return NextResponse.json({ error: "invalid json" }, { status: 400 })
    }

    // Gerar ID do evento
    const eventId = evt.id || createHash("sha1").update(raw).digest("hex")
    const type = evt.type || "unknown"

    // Verificar idempotência
    const { data: existingEvent } = await supabaseAdmin.from("billing_events").select("id").eq("id", eventId).single()

    if (existingEvent) {
      return NextResponse.json({
        ok: true,
        idempotent: true,
      })
    }

    // Inserir evento bruto
    await supabaseAdmin.from("billing_events").insert({
      id: eventId,
      type,
      payload: evt,
    })

    // Extrair campos comuns
    const data = evt.data || {}
    const email = data.email || data.customer_email
    const productId = data.product_id
    const offerId = data.offer_id
    const amountCents = data.amount_cents || data.amount
    const currency = data.currency || "BRL"
    const subscriptionId = data.subscription_id
    const currentPeriodEnd = data.current_period_end

    // Mapear produto para plano - IDs devem vir do dashboard da Kirvano
    const planMap: Record<string, "pro" | "elite"> = {}

    // Verificar se as variáveis de ambiente estão configuradas
    if (process.env.KIRVANO_PRODUCT_PRO) {
      planMap[process.env.KIRVANO_PRODUCT_PRO] = "pro"
    }
    if (process.env.KIRVANO_PRODUCT_ELITE) {
      planMap[process.env.KIRVANO_PRODUCT_ELITE] = "elite"
    }

    console.log("[v0] Kirvano product mapping:", {
      productId,
      availableProducts: Object.keys(planMap),
      webhookUrl: "https://crmatria.vercel.app/api/webhooks/kirvano",
    })

    const plan = productId ? (planMap[productId] ?? null) : null

    if (productId && !plan) {
      console.warn("[v0] Unknown product ID received:", productId, "Available:", Object.keys(planMap))
    }

    // Processar por tipo de evento
    switch (type) {
      case "order.paid":
      case "checkout.paid":
      case "payment.succeeded":
        // Upsert payment
        await supabaseAdmin.from("payments").upsert({
          id: eventId,
          customer_email: email,
          product_id: productId,
          offer_id: offerId,
          amount_cents: amountCents,
          currency,
          status: "paid",
        })

        // Se houver subscription_id e plan, upsert subscription
        if (subscriptionId && plan) {
          await supabaseAdmin.from("subscriptions").upsert({
            kirvano_subscription_id: subscriptionId,
            customer_email: email,
            plan,
            status: "active",
            current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
        }
        break

      case "subscription.started":
      case "subscription.renewed":
      case "subscription.reactivated":
        if (subscriptionId) {
          await supabaseAdmin.from("subscriptions").upsert({
            kirvano_subscription_id: subscriptionId,
            customer_email: email,
            plan: plan || "pro",
            status: "active",
            current_period_end: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : null,
            updated_at: new Date().toISOString(),
          })
        }
        break

      case "subscription.canceled":
      case "subscription.expired":
        if (subscriptionId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("kirvano_subscription_id", subscriptionId)
        }
        break

      case "refund.created":
        await supabaseAdmin.from("payments").update({ status: "refunded" }).eq("id", eventId)
        break
    }

    // Espelhar plano no perfil do usuário (opcional)
    if (email && plan && ["subscription.started", "subscription.renewed", "order.paid"].includes(type)) {
      await supabaseAdmin
        .from("user_profiles")
        .update({
          plan,
          plan_renews_at: currentPeriodEnd ? new Date(currentPeriodEnd).toISOString() : null,
        })
        .eq("email", email)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Kirvano webhook error:", error)
    return NextResponse.json({ error: "internal server error" }, { status: 500 })
  }
}
