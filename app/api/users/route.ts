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
      const userType = searchParams.get("userType")
      const search = searchParams.get("search")

      // Only admins can list all users
      if (user.user_type !== "admin") {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      const offset = (page - 1) * limit

      let query = supabase.from("users").select(
        `
          id, full_name, email, phone, creci, user_type, created_at, updated_at,
          bio, is_active, last_login_at
        `,
        { count: "exact" },
      )

      if (userType) {
        query = query.eq("user_type", userType)
      }

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const {
        data: users,
        count,
        error,
      } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

      if (error) {
        throw error
      }

      return ApiResponseHelper.success({
        users: users || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      })
    } catch (error) {
      console.error("Get users error:", error)
      return ApiResponseHelper.serverError("Erro ao buscar usuários")
    }
  })
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { fullName, email, phone, creci, userType, bio } = await req.json()

      // Only admins can create users
      if (user.user_type !== "admin") {
        return ApiResponseHelper.error("Acesso negado", 403)
      }

      if (!fullName || !email || !userType) {
        return ApiResponseHelper.error("Campos obrigatórios: fullName, email, userType")
      }

      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .limit(1)

      if (existingUser && existingUser.length > 0) {
        return ApiResponseHelper.error("Email já está em uso")
      }

      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          full_name: fullName,
          email,
          phone,
          creci,
          user_type: userType,
          bio,
          is_active: true,
        })
        .select("id, full_name, email, phone, creci, user_type, created_at, bio, is_active")
        .single()

      if (error) {
        throw error
      }

      return ApiResponseHelper.success(newUser, "Usuário criado com sucesso")
    } catch (error) {
      console.error("Create user error:", error)
      return ApiResponseHelper.serverError("Erro ao criar usuário")
    }
  })
}
