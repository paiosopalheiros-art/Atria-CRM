import { type NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Preference } from "mercadopago"

export async function POST(request: NextRequest) {
  try {
    const { plan, customer, amount } = await request.json()

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

    if (!accessToken) {
      console.error("[v0] MERCADOPAGO_ACCESS_TOKEN não configurado")
      return NextResponse.json(
        {
          error: "Mercado Pago não configurado. Configure o token de acesso.",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Configurando Mercado Pago com token:", accessToken.substring(0, 10) + "...")

    // Configurar Mercado Pago
    const client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
        sandbox: process.env.NODE_ENV === "development",
      },
    })

    const preference = new Preference(client)

    const preferenceData = {
      items: [
        {
          id: `atria-${plan}`,
          title: `Atria CRM - Plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
          quantity: 1,
          unit_price: amount,
          currency_id: "BRL",
        },
      ],
      payer: {
        name: customer.name,
        email: customer.email,
        phone: {
          number: customer.phone,
        },
        identification: {
          type: "CPF",
          number: customer.cpf,
        },
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/pending`,
      },
      auto_return: "approved",
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/mercadopago/webhook`,
      external_reference: JSON.stringify({
        plan,
        customer,
        timestamp: Date.now(),
      }),
    }

    console.log("[v0] Criando preferência para plano:", plan, "valor:", amount)

    const response = await preference.create({ body: preferenceData })

    console.log("[v0] Preferência criada com sucesso:", response.id)

    return NextResponse.json({
      preference_id: response.id,
      init_point: response.init_point,
    })
  } catch (error: any) {
    console.error("[v0] Erro detalhado ao criar preferência:", {
      message: error.message,
      status: error.status,
      cause: error.cause,
      stack: error.stack,
    })

    if (error.message?.includes("unauthorized")) {
      return NextResponse.json(
        {
          error: "Token de acesso do Mercado Pago inválido ou sem permissões. Verifique suas credenciais.",
        },
        { status: 401 },
      )
    }

    return NextResponse.json(
      {
        error: "Erro ao processar pagamento. Tente novamente.",
      },
      { status: 500 },
    )
  }
}
