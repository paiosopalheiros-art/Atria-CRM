import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile, error } = await supabase
      .from("user_profiles")
      .select(`
        id, user_id, full_name, email, phone, creci, user_type, agency_id,
        bio, is_active, avatar_url, notification_preferences, created_at, updated_at
      `)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("[v0] Profile fetch error:", error)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: userProfile })
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { fullName, phone, creci, bio, notificationPreferences } = await request.json()

    const { data: updatedProfile, error } = await supabase
      .from("user_profiles")
      .update({
        full_name: fullName,
        phone,
        creci,
        bio,
        notification_preferences: notificationPreferences,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select("id, full_name, email, phone, creci, user_type, bio, notification_preferences")
      .single()

    if (error) {
      console.error("[v0] Profile update error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: "Perfil atualizado com sucesso",
    })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
