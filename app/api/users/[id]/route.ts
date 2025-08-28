import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params

      // Users can only view their own profile or admins can view any
      if (user.user_type !== "admin" && user.id !== id) {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select(`
          id, full_name, email, phone, creci, user_type, created_at, updated_at,
          bio, is_active, last_login_at, notification_preferences
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        return ApiResponseHelper.notFound("Usuário não encontrado")
      }

      return ApiResponseHelper.success(data)
    } catch (error) {
      console.error("Get user error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar usuário")
    }
  })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params
      const updates = await req.json()

      // Users can only update their own profile or admins can update any
      if (user.user_type !== "admin" && user.id !== id) {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      // Build update object
      const allowedFields = ["full_name", "phone", "creci", "bio", "notification_preferences"]
      if (user.user_type === "admin") {
        allowedFields.push("user_type", "is_active")
      }

      const updateData = Object.keys(updates)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updates[key]
          return obj
        }, {} as any)

      if (Object.keys(updateData).length === 0) {
        return ApiResponseHelper.error("Nenhum campo válido para atualizar")
      }

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from("user_profiles")
        .update(updateData)
        .eq("id", id)
        .select("id, full_name, email, phone, creci, user_type, bio, is_active, notification_preferences")
        .single()

      if (error || !data) {
        return ApiResponseHelper.notFound("Usuário não encontrado")
      }

      return ApiResponseHelper.success(data, "Usuário atualizado com sucesso")
    } catch (error) {
      console.error("Update user error:", error)
      return ApiResponseHelper.serverError("Erro ao atualizar usuário")
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params

      // Only admins can delete users
      if (user.user_type !== "admin") {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      // Don't allow deleting self
      if (user.id === id) {
        return ApiResponseHelper.error("Não é possível deletar sua própria conta")
      }

      // Soft delete by setting is_active to false
      const { data, error } = await supabase
        .from("user_profiles")
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("is_active", true)
        .select("id")
        .single()

      if (error || !data) {
        return ApiResponseHelper.notFound("Usuário não encontrado ou já desativado")
      }

      return ApiResponseHelper.success(null, "Usuário desativado com sucesso")
    } catch (error) {
      console.error("Delete user error:", error)
      return ApiResponseHelper.serverError("Erro ao desativar usuário")
    }
  })
}
