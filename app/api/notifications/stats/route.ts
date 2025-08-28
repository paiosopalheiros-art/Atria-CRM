import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { data: notifications, error } = await supabase.from("notifications").select("*").eq("user_id", user.id)

      if (error) {
        throw error
      }

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const stats = {
        total_notifications: notifications.length,
        unread_notifications: notifications.filter((n) => !n.read_at).length,
        proposal_notifications: notifications.filter((n) => n.type === "proposal").length,
        property_notifications: notifications.filter((n) => n.type === "property").length,
        contract_notifications: notifications.filter((n) => n.type === "contract").length,
        system_notifications: notifications.filter((n) => n.type === "system").length,
        notifications_week: notifications.filter((n) => new Date(n.created_at) >= weekAgo).length,
        notifications_month: notifications.filter((n) => new Date(n.created_at) >= monthAgo).length,
      }

      // Get recent notification types from last 30 days
      const recentNotifications = notifications.filter((n) => new Date(n.created_at) >= monthAgo)
      const typeCounts = recentNotifications.reduce(
        (acc, n) => {
          acc[n.type] = (acc[n.type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      const recent_types = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)

      return ApiResponseHelper.success({
        ...stats,
        recent_types,
      })
    } catch (error) {
      console.error("Get notification stats error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar estatísticas de notificações")
    }
  })
}
