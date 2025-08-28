import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params

      const { data: contract, error } = await supabase
        .from("contracts")
        .select(`
          *,\
properties!
contracts_property_id_fkey(title, price, address),\
captador: users!
contracts_captador_id_fkey(full_name, email),\
partner: users!
contracts_partner_id_fkey(full_name, email)
        `)
        .eq("id", id)
        .single()

      if (error || !contract) {
        return ApiResponseHelper.notFound("Contrato não encontrado")
      }

      // Check permissions
      if (user.user_type !== "admin" && contract.captador_id !== user.id && contract.partner_id !== user.id) {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      return ApiResponseHelper.success(contract)
    } catch (error) {
      console.error("Get contract error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar contrato")
    }
  })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params
      const updates = await req.json()

      const { data: contract, error: fetchError } = await supabase.from("contracts").select("*").eq("id", id).single()

      if (fetchError || !contract) {
        return ApiResponseHelper.notFound("Contrato não encontrado")
      }

      // Check permissions
      if (user.user_type !== "admin" && contract.captador_id !== user.id && contract.partner_id !== user.id) {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      // Build update object with allowed fields
      const allowedFields = ["terms_and_conditions", "status"]
      if (user.user_type === "admin") {
        allowedFields.push("captador_percentage", "partner_percentage", "platform_percentage")
      }

      const updateData = Object.keys(updates)
        .filter((key) => allowedFields.includes(key))
        .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {})

      if (Object.keys(updateData).length === 0) {
        return ApiResponseHelper.error("Nenhum campo válido para atualizar")
      }

      // Add signed_at timestamp if status is being changed to signed
      if (updates.status === "signed" && contract.status !== "signed") {
        updateData.signed_at = new Date().toISOString()
      }

      const { data: updatedContract, error } = await supabase
        .from("contracts")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(updatedContract, "Contrato atualizado com sucesso")
    } catch (error) {
      console.error("Update contract error:", error)
      return ApiResponseHelper.serverError("Erro ao atualizar contrato")
    }
  })
}
