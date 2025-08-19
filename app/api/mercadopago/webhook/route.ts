import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verificar se é uma notificação de pagamento
    if (body.type === "payment") {
      const paymentId = body.data.id

      // Buscar detalhes do pagamento no Mercado Pago
      const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        },
      })

      const paymentData = await paymentResponse.json()

      if (paymentData.status === "approved") {
        // Pagamento aprovado - ativar benefícios
        const externalReference = JSON.parse(paymentData.external_reference)
        const { plan, customer } = externalReference

        const supabase = createClient()

        // Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: customer.email,
          password: "temp-password-" + Math.random().toString(36).substring(7),
          user_metadata: {
            full_name: customer.name,
            phone: customer.phone,
            plan: plan,
          },
        })

        if (authError) {
          console.error("Erro ao criar usuário:", authError)
          return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
        }

        // Criar perfil do usuário com plano ativo
        if (authData.user) {
          const { error: profileError } = await supabase.from("user_profiles").insert({
            user_id: authData.user.id,
            full_name: customer.name,
            email: customer.email,
            phone: customer.phone,
            user_type: "partner",
            subscription_plan: plan,
            subscription_status: "active",
            subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
          })

          if (profileError) {
            console.error("Erro ao criar perfil:", profileError)
          }

          // Registrar pagamento
          await supabase.from("payments").insert({
            user_id: authData.user.id,
            plan: plan,
            amount: paymentData.transaction_amount,
            payment_id: paymentId,
            status: "approved",
            payment_method: paymentData.payment_method_id,
          })
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Erro no webhook:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
