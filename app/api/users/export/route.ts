import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { withAuth } from "@/lib/middleware"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      // Get user's data for export
      const { data: userData, error: userError } = await supabase
        .from("user_profiles")
        .select("id, full_name, email, phone, creci, user_type, created_at, bio")
        .eq("id", user.id)
        .single()

      if (userError || !userData) {
        return ApiResponseHelper.notFound("Usuário não encontrado")
      }

      // Get user's properties
      const { data: propertiesData } = await supabase
        .from("properties")
        .select("id, title, description, price, address, created_at, status")
        .eq("owner_id", user.id)

      // Get user's contracts
      const { data: contractsData } = await supabase
        .from("contracts")
        .select("id, property_id, status, created_at, signed_at")
        .or(`captador_id.eq.${user.id},partner_id.eq.${user.id}`)

      // Get user's notifications
      const { data: notificationsData } = await supabase
        .from("notifications")
        .select("id, title, message, type, created_at, read_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100)

      const exportData = {
        user: userData,
        properties: propertiesData || [],
        contracts: contractsData || [],
        notifications: notificationsData || [],
        exported_at: new Date().toISOString(),
      }

      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="atria-backup-${user.id}-${new Date().toISOString().split("T")[0]}.json"`,
        },
      })
    } catch (error) {
      console.error("Export user data error:", error)
      return ApiResponseHelper.serverError("Erro ao exportar dados do usuário")
    }
  })
}
