import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, email, fullName, userType, phone, creci, inviteCode } = await request.json()

    const supabase = await createClient()

    // Get or create default agency
    let defaultAgencyId: string

    const { data: existingAgency, error: agencyError } = await supabase
      .from("agencies")
      .select("id")
      .eq("name", "Agência Padrão")
      .single()

    if (existingAgency && !agencyError) {
      defaultAgencyId = existingAgency.id
    } else {
      // Create default agency if it doesn't exist
      const { data: newAgency, error: createError } = await supabase
        .from("agencies")
        .insert({
          name: "Agência Padrão",
        })
        .select("id")
        .single()

      if (createError || !newAgency) {
        console.error("Failed to create default agency:", createError)
        return NextResponse.json({ error: "Falha ao criar agência padrão" }, { status: 500 })
      }

      defaultAgencyId = newAgency.id
    }

    // Create user profile
    const { error: profileError } = await supabase.from("user_profiles").insert({
      user_id: userId,
      email,
      full_name: fullName,
      user_type: userType,
      phone,
      creci,
      agency_id: defaultAgencyId,
      invite_code: inviteCode,
      is_active: true,
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return NextResponse.json({ error: "Falha ao criar perfil do usuário" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Create profile API error:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
