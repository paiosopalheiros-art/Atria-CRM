import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { userIds, title, message, type, data } = await req.json()

      if (!userIds || !Array.isArray(userIds) || !title || !message || !type) {
        return ApiResponseHelper.error("Campos obrigatórios: userIds (array), title, message, type")
      }

      // Only admins can send bulk notifications
      if (user.user_type !== "admin") {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const notifications = userIds.map((userId) => ({
        user_id: userId,
        title,
        message,
        type,
        data: data ? JSON.stringify(data) : null,
      }))

      const { data: result, error } = await supabase.from("notifications").insert(notifications).select("id")

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(
        { createdCount: result.length },
        `${result.length} notificações enviadas com sucesso`,
      )
    } catch (error) {
      console.error("Send bulk notifications error:", error)
      return ApiResponseHelper.serverError("Erro ao enviar notificações")
    }
  })
}
