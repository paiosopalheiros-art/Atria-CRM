import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const page = Number.parseInt(searchParams.get("page") || "1")
      const limit = Number.parseInt(searchParams.get("limit") || "10")
      const status = searchParams.get("status")
      const propertyId = searchParams.get("propertyId")
      const userId = searchParams.get("userId")

      const offset = (page - 1) * limit

      let query = supabase.from("contracts").select(
        `
          *,
          properties!contracts_property_id_fkey(title, price),
          captador:users!contracts_captador_id_fkey(full_name),
          partner:users!contracts_partner_id_fkey(full_name)
        `,
        { count: "exact" },
      )

      // Filter based on user type and permissions
      if (user.user_type !== "admin") {
        query = query.or(`captador_id.eq.${user.id},partner_id.eq.${user.id}`)
      }

      if (status) {
        query = query.eq("status", status)
      }

      if (propertyId) {
        query = query.eq("property_id", propertyId)
      }

      if (userId) {
        query = query.or(`captador_id.eq.${userId},partner_id.eq.${userId}`)
      }

      const {
        data: contracts,
        count,
        error,
      } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return ApiResponseHelper.success({
        contracts: contracts || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error) {
      console.error("Get contracts error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar contratos")
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { propertyId, partnerId, contractType, terms } = await req.json()

      if (!propertyId || !contractType) {
        return ApiResponseHelper.error("Campos obrigatórios: propertyId e contractType")
      }

      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single()

      if (propertyError || !property) {
        return ApiResponseHelper.notFound("Propriedade não encontrada")
      }

      // Calculate commission percentages based on contract type
      let captadorPercentage: number
      let partnerPercentage: number
      let platformPercentage: number

      if (contractType === "platform") {
        // Property from platform: 50% platform, 50% partner
        captadorPercentage = 0
        partnerPercentage = 50
        platformPercentage = 50
      } else {
        // External captador: 30% captador, 50% partner, 20% platform
        captadorPercentage = 30
        partnerPercentage = 50
        platformPercentage = 20
      }

      const { data: newContract, error } = await supabase
        .from("contracts")
        .insert({
          property_id: propertyId,
          captador_id: contractType === "platform" ? null : user.id,
          partner_id: partnerId || null,
          contract_type: contractType,
          captador_percentage: captadorPercentage,
          partner_percentage: partnerPercentage,
          platform_percentage: platformPercentage,
          total_commission: 5.0, // Fixed 5% commission
          property_value: property.price,
          terms_and_conditions: terms,
          status: "pending",
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Create notification for involved parties
      if (partnerId) {
        await supabase.from("notifications").insert({
          user_id: partnerId,
          title: "Novo Contrato de Comissão",
          message: `Um novo contrato foi criado para a propriedade "${property.title}".`,
          type: "contract_created",
        })
      }

      return ApiResponseHelper.success(newContract, "Contrato criado com sucesso")
    } catch (error) {
      console.error("Create contract error:", error)
      return ApiResponseHelper.serverError("Erro ao criar contrato")
    }
  })
}
