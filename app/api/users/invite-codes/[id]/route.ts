import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      // Only admins can manage invite codes
      if (user.user_type !== "admin") {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const { id } = params
      const { isActive } = await req.json()

      const { data, error } = await supabase
        .from("invite_codes")
        .update({
          is_active: isActive,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error || !data) {
        return ApiResponseHelper.notFound("Código de convite não encontrado")
      }

      return ApiResponseHelper.success(data, `Código ${isActive ? "ativado" : "desativado"} com sucesso`)
    } catch (error) {
      console.error("Update invite code error:", error)
      return ApiResponseHelper.serverError("Erro ao atualizar código de convite")
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      // Only admins can delete invite codes
      if (user.user_type !== "admin") {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const { id } = params

      const { data, error } = await supabase.from("invite_codes").delete().eq("id", id).select("id").single()

      if (error || !data) {
        return ApiResponseHelper.notFound("Código de convite não encontrado")
      }

      return ApiResponseHelper.success(null, "Código de convite deletado com sucesso")
    } catch (error) {
      console.error("Delete invite code error:", error)
      return ApiResponseHelper.serverError("Erro ao deletar código de convite")
    }
  })
}
