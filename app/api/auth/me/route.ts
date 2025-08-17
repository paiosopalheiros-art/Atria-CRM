import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { AuthService } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await AuthService.getUserFromToken(request)

    if (!user) {
      return ApiResponseHelper.unauthorized("Token inválido ou expirado")
    }

    return ApiResponseHelper.success({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      userType: user.user_type,
      creci: user.creci,
      cpf: user.cpf,
      rg: user.rg,
      address: user.address,
      phone: user.phone,
    })
  } catch (error) {
    console.error("Get user error:", error)
    return ApiResponseHelper.serverError("Erro interno do servidor")
  }
}
