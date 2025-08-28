import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const status = searchParams.get("status")
      const propertyId = searchParams.get("propertyId")

      let query = supabase.from("contract_requests").select(`
        *,
        properties!contract_requests_property_id_fkey(title, price),
        requester: users!contract_requests_requester_id_fkey(full_name),
        owner: users!contract_requests_owner_id_fkey(full_name)
      `)

      // Filter based on user type
      if (user.user_type !== "admin") {
        query = query.or(`requester_id.eq.${user.id},owner_id.eq.${user.id}`)
      }

      if (status) {
        query = query.eq("status", status)
      }

      if (propertyId) {
        query = query.eq("property_id", propertyId)
      }

      const { data: contractRequests, error } = await query.order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(contractRequests || [])
    } catch (error) {
      console.error("Get contract requests error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar solicitações de contrato")
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { propertyId, message, experience, references, personalInfo } = await req.json()

      if (!propertyId || !message) {
        return ApiResponseHelper.error("Campos obrigatórios: propertyId e message")
      }

      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single()

      if (propertyError || !property) {
        return ApiResponseHelper.notFound("Propriedade não encontrada")
      }

      // Check if user already has a pending request for this property
      const { data: existingRequest, error: checkError } = await supabase
        .from("contract_requests")
        .select("id")
        .eq("property_id", propertyId)
        .eq("requester_id", user.id)
        .eq("status", "pending")
        .limit(1)

      if (existingRequest && existingRequest.length > 0) {
        return ApiResponseHelper.error("Você já possui uma solicitação pendente para esta propriedade")
      }

      // Create contract request
      const { data: newRequest, error } = await supabase
        .from("contract_requests")
        .insert({
          property_id: propertyId,
          requester_id: user.id,
          owner_id: property.owner_id,
          message,
          experience,
          references,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Create notification for property owner
      await supabase.from("notifications").insert({
        user_id: property.owner_id,
        title: "Nova Solicitação de Contrato",
        message: `${user.full_name} solicitou um contrato para a propriedade "${property.title}".`,
        type: "contract_request",
      })

      return ApiResponseHelper.success(newRequest, "Solicitação de contrato enviada com sucesso")
    } catch (error) {
      console.error("Create contract request error:", error)
      return ApiResponseHelper.serverError("Erro ao criar solicitação de contrato")
    }
  })
}
