import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAdminAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAdminAuth(request, async (req, user) => {
    try {
      const { id } = params
      const { status, reason } = await req.json()

      if (!["approved", "rejected"].includes(status)) {
        return ApiResponseHelper.error("Status deve ser 'approved' ou 'rejected'")
      }

      const { data: property, error } = await supabase
        .from("properties")
        .update({ approval_status: status })
        .eq("id", id)
        .select()
        .single()

      if (error || !property) {
        return ApiResponseHelper.notFound("Propriedade não encontrada")
      }

      // Create notification for property owner
      const notificationMessage =
        status === "approved"
          ? `Sua propriedade "${property.title}" foi aprovada e está agora visível no feed.`
          : `Sua propriedade "${property.title}" foi rejeitada. ${reason ? `Motivo: ${reason}` : ""}`

      await supabase.from("notifications").insert({
        user_id: property.owner_id,
        title: status === "approved" ? "Propriedade Aprovada" : "Propriedade Rejeitada",
        message: notificationMessage,
        type: "property_approval",
      })

      return ApiResponseHelper.success(
        property,
        `Propriedade ${status === "approved" ? "aprovada" : "rejeitada"} com sucesso`,
      )
    } catch (error) {
      console.error("Approve property error:", error)
      return ApiResponseHelper.serverError("Erro ao processar aprovação")
    }
  })
}
