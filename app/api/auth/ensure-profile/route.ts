import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const { data: profile, error: selErr } = await supabase
    .from("user_profiles")
    .select("user_id, agency_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (selErr) {
    return NextResponse.json({ error: selErr.message }, { status: 400 })
  }

  if (profile && profile.agency_id) {
    // Profile exists with valid agency, return ok
    return NextResponse.json({ ok: true, created: false })
  }

  let defaultAgencyId: string

  try {
    // Try to get existing default agency
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
          slug: "agencia-padrao",
          about: "Agência padrão para novos usuários",
          owner_id: user.id,
        })
        .select("id")
        .single()

      if (createError || !newAgency) {
        console.error("[v0] Failed to create default agency:", createError)
        return NextResponse.json({ error: "Failed to create default agency" }, { status: 500 })
      }

      defaultAgencyId = newAgency.id
    }
  } catch (agencyError) {
    console.error("[v0] Agency setup error:", agencyError)
    return NextResponse.json({ error: "Failed to setup agency" }, { status: 500 })
  }

  if (profile) {
    // Profile exists but no agency_id, update it
    const { error: updateErr } = await supabase
      .from("user_profiles")
      .update({
        agency_id: defaultAgencyId,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, created: false, updated: true })
  } else {
    // Profile doesn't exist, create it with agency_id
    const { error: insErr } = await supabase.from("user_profiles").insert({
      user_id: user.id,
      full_name: user.email ?? "Usuário",
      email: user.email ?? "",
      agency_id: defaultAgencyId,
      user_type: "partner", // Default user type
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, created: true })
  }
}
