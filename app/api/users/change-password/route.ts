import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { currentPassword, newPassword } = await req.json()

      if (!currentPassword || !newPassword) {
        return ApiResponseHelper.error("Campos obrigatórios: currentPassword, newPassword")
      }

      if (newPassword.length < 6) {
        return ApiResponseHelper.error("Nova senha deve ter pelo menos 6 caracteres")
      }

      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("password_hash")
        .eq("id", user.id)
        .single()

      if (fetchError || !userData) {
        return ApiResponseHelper.notFound("Usuário não encontrado")
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash)

      if (!isCurrentPasswordValid) {
        return ApiResponseHelper.error("Senha atual incorreta")
      }

      // Hash new password
      const saltRounds = 12
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds)

      const { error } = await supabase.from("users").update({ password_hash: newPasswordHash }).eq("id", user.id)

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(null, "Senha alterada com sucesso")
    } catch (error) {
      console.error("Change password error:", error)
      return ApiResponseHelper.serverError("Erro ao alterar senha")
    }
  })
}
