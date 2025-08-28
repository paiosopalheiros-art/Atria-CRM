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
      const type = searchParams.get("type")
      const status = searchParams.get("status")
      const approvalStatus = searchParams.get("approvalStatus")
      const search = searchParams.get("search")
      const userId = searchParams.get("userId")

      const offset = (page - 1) * limit

      let query = supabase.from("properties").select(
        `
          *,
          users!properties_owner_id_fkey(full_name)
        `,
        { count: "exact" },
      )

      // Apply filters based on user type
      if (user.user_type !== "admin") {
        query = query.eq("approval_status", "approved")
      }

      if (type) {
        query = query.eq("property_type", type)
      }

      if (status) {
        query = query.eq("status", status)
      }

      if (approvalStatus && user.user_type === "admin") {
        query = query.eq("approval_status", approvalStatus)
      }

      if (userId) {
        query = query.eq("owner_id", userId)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,city.ilike.%${search}%,address.ilike.%${search}%`)
      }

      const {
        data: properties,
        count,
        error,
      } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return ApiResponseHelper.success({
        properties: properties || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error) {
      console.error("Get properties error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar propriedades")
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const {
        title,
        description,
        price,
        propertyType,
        bedrooms,
        bathrooms,
        area,
        address,
        city,
        state,
        zipCode,
        latitude,
        longitude,
        images,
        features,
      } = await req.json()

      // Validate required fields
      if (!title || !price || !propertyType) {
        return ApiResponseHelper.error("Campos obrigatórios: título, preço e tipo de propriedade")
      }

      const { data: newProperty, error } = await supabase
        .from("properties")
        .insert({
          title,
          description,
          price,
          property_type: propertyType,
          bedrooms: bedrooms || 0,
          bathrooms: bathrooms || 0,
          area: area || 0,
          address,
          city,
          state,
          zip_code: zipCode,
          latitude,
          longitude,
          images: images || [],
          features: features || [],
          owner_id: user.id,
          status: "available",
          approval_status: "pending",
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(newProperty, "Propriedade criada com sucesso")
    } catch (error) {
      console.error("Create property error:", error)
      return ApiResponseHelper.serverError("Erro ao criar propriedade")
    }
  })
}
