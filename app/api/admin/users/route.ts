import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function GET() {
  try {
    console.log("[v0] Admin API: Loading users...")

    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.log("[v0] Admin API error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Admin API: Loaded", users.users.length, "users")
    return NextResponse.json({ users: users.users })
  } catch (error) {
    console.log("[v0] Admin API exception:", error)
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log("[v0] Admin API: Deleting user", userId)

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
      console.log("[v0] Admin API delete error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Admin API: User deleted successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.log("[v0] Admin API delete exception:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
