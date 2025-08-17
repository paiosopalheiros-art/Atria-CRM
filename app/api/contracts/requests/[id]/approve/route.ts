import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (req, user) => {
    try {
      const { id } = params
      const { action, reason } = await req.json() // action: 'approve' or 'reject'

      if (!["approve", "reject"].includes(action)) {
        return ApiResponseHelper.error("Ação deve ser 'approve' ou 'reject'")
      }

      const { data: contractRequest, error: requestError } = await supabase
        .from("contract_requests")
        .select(`
          *,
          properties!inner(title, price, owner_id)
        `)
        .eq("id", id)
        .single()

      if (requestError || !contractRequest) {
        return ApiResponseHelper.notFound("Solicitação de contrato não encontrada")
      }

      // Check if user is the property owner or admin
      if (user.user_type !== "admin" && contractRequest.properties.owner_id !== user.id) {
        return ApiResponseHelper.error("Apenas o proprietário ou admin pode aprovar/rejeitar", 403)
      }

      if (action === "approve") {
        const { error: updateError } = await supabase
          .from("contract_requests")
          .update({ status: "approved" })
          .eq("id", id)

        if (updateError) throw updateError

        // Determine contract type based on property origin
        const contractType = contractRequest.properties.owner_id === "atria-platform" ? "platform" : "external"

        // Calculate commission percentages
        let captadorPercentage: number
        let partnerPercentage: number
        let platformPercentage: number

        if (contractType === "platform") {
          captadorPercentage = 0
          partnerPercentage = 50
          platformPercentage = 50
        } else {
          captadorPercentage = 30
          partnerPercentage = 50
          platformPercentage = 20
        }

        const { error: contractError } = await supabase.from("contracts").insert({
          property_id: contractRequest.property_id,
          captador_id: contractType === "platform" ? null : contractRequest.properties.owner_id,
          partner_id: contractRequest.requester_id,
          contract_type: contractType,
          captador_percentage: captadorPercentage,
          partner_percentage: partnerPercentage,
          platform_percentage: platformPercentage,
          total_commission: 5.0,
          property_value: contractRequest.properties.price,
          terms_and_conditions: `Contrato aprovado automaticamente para a propriedade "${contractRequest.properties.title}".`,
          status: "signed",
          signed_at: new Date().toISOString(),
        })

        if (contractError) throw contractError

        await supabase.from("notifications").insert({
          user_id: contractRequest.requester_id,
          title: "Contrato Aprovado",
          message: `Sua solicitação para a propriedade "${contractRequest.properties.title}" foi aprovada!`,
          type: "contract_approved",
        })
      } else {
        const { error: rejectError } = await supabase
          .from("contract_requests")
          .update({ status: "rejected" })
          .eq("id", id)

        if (rejectError) throw rejectError

        await supabase.from("notifications").insert({
          user_id: contractRequest.requester_id,
          title: "Contrato Rejeitado",
          message: `Sua solicitação para a propriedade "${contractRequest.properties.title}" foi rejeitada. ${reason ? `Motivo: ${reason}` : ""}`,
          type: "contract_rejected",
        })
      }

      return ApiResponseHelper.success(
        null,
        `Solicitação ${action === "approve" ? "aprovada" : "rejeitada"} com sucesso`,
      )
    } catch (error) {
      console.error("Approve contract request error:", error)
      return ApiResponseHelper.serverError("Erro ao processar solicitação")
    }
  })
}
