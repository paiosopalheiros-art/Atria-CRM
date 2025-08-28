import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url)
      const status = searchParams.get("status")
      const captadorId = searchParams.get("captadorId")

      let query = supabase.from("commission_repayments").select(`
          *,
          contracts!inner(property_id),
          properties!inner(title),
          user_profiles!inner(full_name)
        `)

      // Filter based on user type
      if (user.user_type !== "admin") {
        query = query.eq("captador_id", user.id)
      }

      if (status) {
        query = query.eq("status", status)
      }

      if (captadorId) {
        query = query.eq("captador_id", captadorId)
      }

      const { data, error } = await query.order("due_date", { ascending: true })

      if (error) throw error

      return ApiResponseHelper.success(data || [])
    } catch (error) {
      console.error("Get repayments error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar repasses")
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { contractId, propertyId, amountDue, dueDate } = await req.json()

      if (!contractId || !propertyId || !amountDue) {
        return ApiResponseHelper.error("Campos obrigatórios: contractId, propertyId, amountDue")
      }

      const { data: contract, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", contractId)
        .single()

      if (contractError || !contract) {
        return ApiResponseHelper.notFound("Contrato não encontrado")
      }

      const { data, error } = await supabase
        .from("commission_repayments")
        .insert({
          contract_id: contractId,
          property_id: propertyId,
          captador_id: contract.captador_id,
          amount_due: amountDue,
          due_date: dueDate || new Date().toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return ApiResponseHelper.success(data, "Repasse criado com sucesso")
    } catch (error) {
      console.error("Create repayment error:", error)
      return ApiResponseHelper.serverError("Erro ao criar repasse")
    }
  })
}
