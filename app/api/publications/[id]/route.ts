import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

// API para moderação de publicações
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json()

    if (!["published", "draft", "archived"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("publications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      ok: true,
      publication: data,
      message: `Publication ${status === "published" ? "published" : status === "draft" ? "drafted" : "archived"} successfully`,
    })
  } catch (error) {
    console.error("[API] Error updating publication:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
