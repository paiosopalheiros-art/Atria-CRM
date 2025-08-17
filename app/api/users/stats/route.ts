import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Only admins can view user stats
      if (user.user_type !== "admin") {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const { data: users, error } = await supabase
        .from("users")
        .select("user_type, is_active, created_at, last_login_at")

      if (error) {
        throw error
      }

      // Calculate stats from the data
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const stats = {
        total_users: users?.length || 0,
        admin_users: users?.filter((u) => u.user_type === "admin").length || 0,
        partner_users: users?.filter((u) => u.user_type === "partner").length || 0,
        captador_users: users?.filter((u) => u.user_type === "captador").length || 0,
        active_users: users?.filter((u) => u.is_active === true).length || 0,
        inactive_users: users?.filter((u) => u.is_active === false).length || 0,
        new_users_week: users?.filter((u) => new Date(u.created_at) >= weekAgo).length || 0,
        new_users_month: users?.filter((u) => new Date(u.created_at) >= monthAgo).length || 0,
        active_users_week: users?.filter((u) => u.last_login_at && new Date(u.last_login_at) >= weekAgo).length || 0,
      }

      // Get top users by properties
      const { data: topUsers, error: topUsersError } = await supabase
        .from("users")
        .select(`
          id, full_name, user_type,
          properties!properties_owner_id_fkey(id)
        `)
        .eq("is_active", true)
        .limit(10)

      if (topUsersError) {
        throw topUsersError
      }

      const topUsersWithCount = (topUsers || [])
        .map((user) => ({
          id: user.id,
          full_name: user.full_name,
          user_type: user.user_type,
          property_count: user.properties?.length || 0,
        }))
        .sort((a, b) => b.property_count - a.property_count)
        .slice(0, 10)

      return ApiResponseHelper.success({
        ...stats,
        top_users: topUsersWithCount,
      })
    } catch (error) {
      console.error("Get user stats error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar estatísticas de usuários")
    }
  })
}
