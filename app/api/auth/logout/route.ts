import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerSupabase } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Logout error:", error.message)
      return NextResponse.json({ error: "Erro ao fazer logout" }, { status: 400 })
    }

    return NextResponse.json({ message: "Logout realizado com sucesso" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
