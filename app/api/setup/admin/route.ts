import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { createClient } from "@/lib/supabase/client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password, setupKey } = await request.json()

    // Security check - only allow setup with correct key
    if (setupKey !== "SETUP_ADMIN_2024") {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 401 })
    }

    // Check if any admin users already exist
    const { data: existingAdmins } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("user_type", "admin")
      .limit(1)

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({ error: "Admin user already exists" }, { status: 400 })
    }

    const supabase = createClient()

    // Create the admin user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}`,
      },
    })

    if (authError || !authData.user) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: authError?.message || "Failed to create user" }, { status: 400 })
    }

    // Create or get default agency
    let defaultAgencyId: string

    const { data: existingAgency } = await supabaseAdmin
      .from("agencies")
      .select("id")
      .eq("name", "Agência Padrão")
      .single()

    if (existingAgency) {
      defaultAgencyId = existingAgency.id
    } else {
      const { data: newAgency, error: agencyError } = await supabaseAdmin
        .from("agencies")
        .insert({
          name: "Agência Padrão",
        })
        .select("id")
        .single()

      if (agencyError || !newAgency) {
        console.error("Agency error:", agencyError)
        return NextResponse.json({ error: "Failed to create agency" }, { status: 400 })
      }

      defaultAgencyId = newAgency.id
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin.from("user_profiles").insert({
      user_id: authData.user.id,
      email: authData.user.email,
      full_name: "Administrador",
      user_type: "admin",
      agency_id: defaultAgencyId,
      invite_code: "ADMIN2024",
      is_active: true,
      plan: "elite",
    })

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "Failed to create profile" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      email: authData.user.email,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
