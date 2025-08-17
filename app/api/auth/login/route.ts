import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { AuthService } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return ApiResponseHelper.error("Email e senha são obrigatórios")
    }

    const user = await AuthService.authenticateUser(email, password)
    if (!user) {
      return ApiResponseHelper.error("Credenciais inválidas", 401)
    }

    const token = AuthService.generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
    })

    return ApiResponseHelper.success({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        userType: user.user_type,
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return ApiResponseHelper.serverError("Erro interno do servidor")
  }
}
