import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = Number.parseInt(searchParams.get("page") || "1")
      const limit = Number.parseInt(searchParams.get("limit") || "20")
      const type = searchParams.get("type")
      const unreadOnly = searchParams.get("unreadOnly") === "true"

      const offset = (page - 1) * limit

      let query = supabase
        .from("notifications")
        .select("id, title, message, type, data, read_at, created_at", { count: "exact" })
        .eq("user_id", user.id)

      if (type) {
        query = query.eq("type", type)
      }

      if (unreadOnly) {
        query = query.is("read_at", null)
      }

      const {
        data: notifications,
        count,
        error,
      } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      // Get unread count
      const { count: unreadCount, error: unreadError } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null)

      if (unreadError) {
        throw unreadError
      }

      return ApiResponseHelper.success({
        notifications: (notifications || []).map((row) => ({
          ...row,
          read: !!row.read_at,
          data: row.data ? JSON.parse(row.data) : null,
        })),
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
        unreadCount: unreadCount || 0,
      })
    } catch (error) {
      console.error("Get notifications error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar notificações")
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { userId, title, message, type, data } = await req.json()

      if (!userId || !title || !message || !type) {
        return ApiResponseHelper.error("Campos obrigatórios: userId, title, message, type")
      }

      // Only admins can create notifications for other users
      if (user.user_type !== "admin" && userId !== user.id) {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const { data: newNotification, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          title,
          message,
          type,
          data: data ? JSON.stringify(data) : null,
        })
        .select("id, title, message, type, data, created_at")
        .single()

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(
        {
          ...newNotification,
          read: false,
          data: newNotification.data ? JSON.parse(newNotification.data) : null,
        },
        "Notificação criada com sucesso",
      )
    } catch (error) {
      console.error("Create notification error:", error)
      return ApiResponseHelper.serverError("Erro ao criar notificação")
    }
  })
}
