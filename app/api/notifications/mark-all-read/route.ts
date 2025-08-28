import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { data: updatedNotifications, error } = await supabase
        .from("notifications")
        .update({
          read_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .is("read_at", null)
        .select("id")

      if (error) {
        throw error
      }

      const updatedCount = updatedNotifications?.length || 0

      return ApiResponseHelper.success({ updatedCount }, `${updatedCount} notificações marcadas como lidas`)
    } catch (error) {
      console.error("Mark all read error:", error)
      return ApiResponseHelper.serverError("Erro ao marcar notificações como lidas")
    }
  })
}
