import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Schema de validação para dados de entrada
const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  phone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, "Formato de telefone inválido").optional(),
  creci: z.string().regex(/^\d{4,6}$/, "CRECI deve conter apenas números (4-6 dígitos)").optional(),
  bio: z.string().max(500, "Bio deve ter no máximo 500 caracteres").optional(),
  notificationPreferences: z.object({
    email_notifications: z.boolean(),
    sms_notifications: z.boolean(),
    push_notifications: z.boolean(),
    marketing_emails: z.boolean()
  }).optional()
})

// Tipo para o perfil do usuário
interface UserProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone?: string
  creci?: string
  user_type: 'admin' | 'broker' | 'agent' | 'client'
  agency_id?: string
  bio?: string
  is_active: boolean
  avatar_url?: string
  notification_preferences?: any
  created_at: string
  updated_at: string
}

// Helper para resposta padronizada
function createResponse(
  success: boolean, 
  data?: any, 
  message?: string, 
  status: number = 200
) {
  const response = { success, ...(data && { data }), ...(message && { message }) }
  return NextResponse.json(response, { status })
}

// Helper para log padronizado
function logError(operation: string, error: any, userId?: string) {
  console.error(`[PROFILE_API] ${operation} error:`, {
    error: error.message || error,
    userId,
    timestamp: new Date().toISOString()
  })
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      logError("Authentication", authError)
      return createResponse(false, null, "Erro de autenticação", 401)
    }

    if (!user) {
      return createResponse(false, null, "Usuário não autenticado", 401)
    }

    // Buscar perfil do usuário
    const { data: userProfile, error } = await supabase
      .from("user_profiles")
      .select(`
        id, user_id, full_name, email, phone, creci, user_type, agency_id,
        bio, is_active, avatar_url, notification_preferences, created_at, updated_at
      `)
      .eq("user_id", user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        logError("Profile not found", error, user.id)
        return createResponse(false, null, "Perfil não encontrado. Entre em contato com o suporte.", 404)
      }
      
      logError("Profile fetch", error, user.id)
      return createResponse(false, null, "Erro ao buscar perfil do usuário", 500)
    }

    // Verificar se o perfil está ativo
    if (!userProfile.is_active) {
      return createResponse(false, null, "Conta desativada. Entre em contato com o suporte.", 403)
    }

    // Sanitizar dados sensíveis se necessário
    const sanitizedProfile = {
      ...userProfile,
      // Remove campos sensíveis se necessário baseado no user_type
      ...(userProfile.user_type === 'client' && {
        creci: undefined // Clientes não precisam ver CRECI de outros
      })
    }

    return createResponse(true, sanitizedProfile, "Perfil carregado com sucesso")

  } catch (error) {
    logError("GET profile", error)
    return createResponse(false, null, "Erro interno do servidor", 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      logError("Authentication", authError)
      return createResponse(false, null, "Erro de autenticação", 401)
    }

    if (!user) {
      return createResponse(false, null, "Usuário não autenticado", 401)
    }

    // Validar dados de entrada
    let requestData
    try {
      requestData = await request.json()
    } catch (error) {
      return createResponse(false, null, "Dados JSON inválidos", 400)
    }

    // Validar schema
    const validation = updateProfileSchema.safeParse(requestData)
    if (!validation.success) {
      const errors = validation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      
      return createResponse(false, { validation_errors: errors }, "Dados de entrada inválidos", 400)
    }

    const { fullName, phone, creci, bio, notificationPreferences } = validation.data

    // Verificar se o usuário tem permissão para atualizar CRECI
    if (creci) {
      const { data: currentProfile } = await supabase
        .from("user_profiles")
        .select("user_type, creci")
        .eq("user_id", user.id)
        .single()

      if (currentProfile?.user_type === 'client') {
        return createResponse(false, null, "Clientes não podem definir CRECI", 403)
      }

      // Verificar se CRECI já existe para outro usuário
      const { data: existingCreci } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("creci", creci)
        .neq("user_id", user.id)
        .maybeSingle()

      if (existingCreci) {
        return createResponse(false, null, "CRECI já está em uso por outro usuário", 409)
      }
    }

    // Atualizar perfil
    const updateData = {
      full_name: fullName,
      ...(phone !== undefined && { phone }),
      ...(creci !== undefined && { creci }),
      ...(bio !== undefined && { bio }),
      ...(notificationPreferences !== undefined && { 
        notification_preferences: notificationPreferences 
      }),
      updated_at: new Date().toISOString(),
    }

    const { data: updatedProfile, error } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("user_id", user.id)
      .select(`
        id, full_name, email, phone, creci, user_type, bio, 
        notification_preferences, avatar_url, updated_at
      `)
      .single()

    if (error) {
      logError("Profile update", error, user.id)
      
      // Tratamento de erros específicos
      if (error.code === '23505') { // Unique constraint violation
        return createResponse(false, null, "Dados duplicados. Verifique CRECI ou telefone.", 409)
      }
      
      return createResponse(false, null, "Erro ao atualizar perfil", 500)
    }

    // Log da atualização bem-sucedida
    console.log(`[PROFILE_API] Profile updated successfully for user ${user.id}`, {
      updatedFields: Object.keys(updateData),
      timestamp: new Date().toISOString()
    })

    return createResponse(true, updatedProfile, "Perfil atualizado com sucesso")

  } catch (error) {
    logError("PUT profile", error)
    return createResponse(false, null, "Erro interno do servidor", 500)
  }
}

// Endpoint para upload de avatar (opcional)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return createResponse(false, null, "Não autorizado", 401)
    }

    const { avatar_url } = await request.json()

    if (!avatar_url || typeof avatar_url !== 'string') {
      return createResponse(false, null, "URL do avatar inválida", 400)
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({ 
        avatar_url,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)

    if (error) {
      logError("Avatar update", error, user.id)
      return createResponse(false, null, "Erro ao atualizar avatar", 500)
    }

    return createResponse(true, { avatar_url }, "Avatar atualizado com sucesso")

  } catch (error) {
    logError("PATCH avatar", error)
    return createResponse(false, null, "Erro interno do servidor", 500)
  }
}
