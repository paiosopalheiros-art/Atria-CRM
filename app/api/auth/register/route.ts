import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { AuthService } from "@/lib/auth"
import { supabase } from "@/lib/supabase/client"

const VALID_INVITE_CODES = {
  ADMIN2024: "admin",
  PARTNER2024: "partner",
  CAPTADOR2024: "captador",
}

export async function POST(request: NextRequest) {
  try {
    const { inviteCode, fullName, email, password, cpf, rg, creci, phone, address } = await request.json()

    // Validate required fields
    if (!inviteCode || !fullName || !email || !password) {
      return ApiResponseHelper.error("Campos obrigatórios não preenchidos")
    }

    // Validate invite code
    const userType = VALID_INVITE_CODES[inviteCode as keyof typeof VALID_INVITE_CODES]
    if (!userType) {
      return ApiResponseHelper.error("Código de convite inválido")
    }

    // Check if email already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1)

    if (existingUser && existingUser.length > 0) {
      return ApiResponseHelper.error("Email já cadastrado")
    }

    // Create user
    const newUser = await AuthService.createUser({
      email,
      password,
      fullName,
      userType,
      inviteCode,
      cpf,
      rg,
      creci,
      phone,
      address,
    })

    // Generate token
    const token = AuthService.generateToken({
      userId: newUser.id,
      email: newUser.email,
      userType: newUser.user_type,
    })

    return ApiResponseHelper.success({
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.full_name,
        userType: newUser.user_type,
      },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return ApiResponseHelper.serverError("Erro interno do servidor")
  }
}
