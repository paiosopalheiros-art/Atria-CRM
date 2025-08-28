import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Only admins can manage invite codes
      if (user.user_type !== "admin") {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const { data: inviteCodes, error } = await supabase
        .from("invite_codes")
        .select("id, code, user_type, is_active, max_uses, current_uses, expires_at, created_at")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(inviteCodes || [])
    } catch (error) {
      console.error("Get invite codes error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar códigos de convite")
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Only admins can create invite codes
      if (user.user_type !== "admin") {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const { userType, maxUses = 1, expiresInDays = 30 } = await req.json()

      if (!userType || !["admin", "partner", "captador"].includes(userType)) {
        return ApiResponseHelper.error("Tipo de usuário inválido")
      }

      const code = `${userType.toUpperCase()}${Date.now().toString().slice(-6)}`

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)

      const { data: newInviteCode, error } = await supabase
        .from("invite_codes")
        .insert({
          code,
          user_type: userType,
          max_uses: maxUses,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(newInviteCode, "Código de convite criado com sucesso")
    } catch (error) {
      console.error("Create invite code error:", error)
      return ApiResponseHelper.serverError("Erro ao criar código de convite")
    }
  })
}
