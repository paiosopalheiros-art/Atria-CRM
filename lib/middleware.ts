import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { createClient } from "@/lib/supabase/server"

export interface AuthenticatedUser {
  id: string
  email: string
  user_type: "admin" | "partner" | "captador"
  full_name: string
}

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<Response>,
): Promise<Response> {
  try {
    const supabase = createClient()

    // Get session from Supabase
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return ApiResponseHelper.error("Token de autenticação necessário", 401)
    }

    // Get user profile from database
    const { data: user, error } = await supabase
      .from("user_profiles")
      .select("id, email, user_type, full_name, is_active")
      .eq("id", session.user.id)
      .single()

    if (error || !user) {
      return ApiResponseHelper.error("Usuário não encontrado", 401)
    }

    if (!user.is_active) {
      return ApiResponseHelper.error("Conta desativada", 401)
    }

    // Update last login
    await supabase.from("user_profiles").update({ last_login_at: new Date().toISOString() }).eq("id", user.id)

    return handler(request, user)
  } catch (error) {
    console.error("Auth middleware error:", error)
    return ApiResponseHelper.error("Erro de autenticação", 401)
  }
}

export async function withAdminAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: AuthenticatedUser) => Promise<Response>,
): Promise<Response> {
  return withAuth(request, async (req, user) => {
    if (user.user_type !== "admin") {
      return ApiResponseHelper.error("Acesso negado. Apenas administradores podem acessar esta funcionalidade.", 403)
    }
    return handler(req, user)
  })
}
