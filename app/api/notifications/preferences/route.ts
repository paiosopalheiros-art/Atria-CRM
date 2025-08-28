import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("notification_preferences")
        .eq("id", user.id)
        .single()

      if (error || !data) {
        return ApiResponseHelper.notFound("Usuário não encontrado")
      }

      const preferences = data.notification_preferences || {
        email: true,
        push: true,
        proposals: true,
        properties: true,
        contracts: true,
        system: true,
      }

      return ApiResponseHelper.success(preferences)
    } catch (error) {
      console.error("Get notification preferences error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar preferências de notificação")
    }
  })
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const preferences = await req.json()

      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          notification_preferences: preferences,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("notification_preferences")
        .single()

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(
        data.notification_preferences,
        "Preferências de notificação atualizadas com sucesso",
      )
    } catch (error) {
      console.error("Update notification preferences error:", error)
      return ApiResponseHelper.serverError("Erro ao atualizar preferências de notificação")
    }
  })
}
