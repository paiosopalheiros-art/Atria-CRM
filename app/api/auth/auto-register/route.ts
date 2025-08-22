import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Check if user exists in user_profiles but not in auth
    const { data: existingProfile } = await supabase.from("user_profiles").select("*").eq("email", email).single()

    if (!existingProfile) {
      return Response.json({ error: "User not found in system" }, { status: 404 })
    }

    // Try to create user in Supabase Auth
    const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (signUpError) {
      console.error("[v0] Auto-register error:", signUpError)
      return Response.json({ error: signUpError.message }, { status: 400 })
    }

    // Update user_profiles with the auth user_id
    await supabase.from("user_profiles").update({ user_id: authUser.user.id }).eq("email", email)

    console.log("[v0] Auto-registered user:", email)
    return Response.json({ success: true, user: authUser.user })
  } catch (error) {
    console.error("[v0] Auto-register error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
