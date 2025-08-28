import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email e senha são obrigatórios" }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Login error:", error.message)
      return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 })
    }

    if (!data.user) {
      return NextResponse.json({ error: "Falha na autenticação" }, { status: 401 })
    }

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
