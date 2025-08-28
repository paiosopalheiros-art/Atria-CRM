import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params

      const { data: property, error } = await supabase
        .from("properties")
        .select(`
          *,
          users!properties_owner_id_fkey(full_name, phone, email)
        `)
        .eq("id", id)
        .single()

      if (error || !property) {
        return ApiResponseHelper.notFound("Propriedade não encontrada")
      }

      // Check if user can view this property
      if (user.user_type !== "admin" && property.approval_status !== "approved") {
        return ApiResponseHelper.error("Propriedade não disponível", 403)
      }

      return ApiResponseHelper.success(property)
    } catch (error) {
      console.error("Get property error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar propriedade")
    }
  })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params
      const updates = await req.json()

      const { data: property, error: fetchError } = await supabase.from("properties").select("*").eq("id", id).single()

      if (fetchError || !property) {
        return ApiResponseHelper.notFound("Propriedade não encontrada")
      }

      if (user.user_type !== "admin" && property.owner_id !== user.id) {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      // Build update object with allowed fields
      const allowedFields = [
        "title",
        "description",
        "price",
        "property_type",
        "bedrooms",
        "bathrooms",
        "area",
        "address",
        "city",
        "state",
        "zip_code",
        "latitude",
        "longitude",
        "images",
        "features",
        "status",
      ]

      if (user.user_type === "admin") {
        allowedFields.push("approval_status")
      }

      const updateData = Object.keys(updates)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {})

      if (Object.keys(updateData).length === 0) {
        return ApiResponseHelper.error("Nenhum campo válido para atualizar")
      }

      const { data: updatedProperty, error } = await supabase
        .from("properties")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(updatedProperty, "Propriedade atualizada com sucesso")
    } catch (error) {
      console.error("Update property error:", error)
      return ApiResponseHelper.serverError("Erro ao atualizar propriedade")
    }
  })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params

      const { data: property, error: fetchError } = await supabase.from("properties").select("*").eq("id", id).single()

      if (fetchError || !property) {
        return ApiResponseHelper.notFound("Propriedade não encontrada")
      }

      if (user.user_type !== "admin" && property.owner_id !== user.id) {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const { error } = await supabase.from("properties").delete().eq("id", id)

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(null, "Propriedade removida com sucesso")
    } catch (error) {
      console.error("Delete property error:", error)
      return ApiResponseHelper.serverError("Erro ao remover propriedade")
    }
  })
}
