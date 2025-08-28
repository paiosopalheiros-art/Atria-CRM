import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

const VALID_INVITE_CODES = {
  ADMIN2024: "admin",
  PARTNER2024: "partner",
  CAPTADOR2024: "captador",
}

export async function POST(request: NextRequest) {
  try {
    const { inviteCode, fullName, email, password, cpf, rg, creci, phone, address } = await request.json()

    // Validate required fields
    if (!inviteCode || !fullName || !email || !password) {
      return NextResponse.json({ error: "Campos obrigatórios não preenchidos" }, { status: 400 })
    }

    // Validate invite code
    const userType = VALID_INVITE_CODES[inviteCode as keyof typeof VALID_INVITE_CODES]
    if (!userType) {
      return NextResponse.json({ error: "Código de convite inválido" }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${request.nextUrl.origin}`,
        data: {
          full_name: fullName,
          phone: phone || null,
          creci: creci || null,
          invite_code: inviteCode,
          user_type: userType,
        },
      },
    })

    if (error) {
      console.error("Registration error:", error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Falha no registro" }, { status: 400 })
    }

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
