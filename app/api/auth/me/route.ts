import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 401 })
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
