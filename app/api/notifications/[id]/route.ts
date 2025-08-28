import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params
      const { read } = await req.json()

      const { data: notification, error: fetchError } = await supabase
        .from("notifications")
        .select("user_id")
        .eq("id", id)
        .single()

      if (fetchError || !notification) {
        return ApiResponseHelper.notFound("Notificação não encontrada")
      }

      if (notification.user_id !== user.id) {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const { data: updatedNotification, error } = await supabase
        .from("notifications")
        .update({ read_at: read ? new Date().toISOString() : null })
        .eq("id", id)
        .select("id, title, message, type, data, read_at, created_at")
        .single()

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(
        {
          ...updatedNotification,
          read: !!updatedNotification.read_at,
          data: updatedNotification.data ? JSON.parse(updatedNotification.data) : null,
        },
        `Notificação marcada como ${read ? "lida" : "não lida"}`,
      )
    } catch (error) {
      console.error("Update notification error:", error)
      return ApiResponseHelper.serverError("Erro ao atualizar notificação")
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params

      const { data: notification, error: fetchError } = await supabase
        .from("notifications")
        .select("user_id")
        .eq("id", id)
        .single()

      if (fetchError || !notification) {
        return ApiResponseHelper.notFound("Notificação não encontrada")
      }

      if (notification.user_id !== user.id) {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(null, "Notificação deletada com sucesso")
    } catch (error) {
      console.error("Delete notification error:", error)
      return ApiResponseHelper.serverError("Erro ao deletar notificação")
    }
  })
}
