import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { supabase } from "@/lib/supabase/client"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("agency_id")
      .eq("user_id", user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get media with agency validation
    const { data: media, error } = await supabaseAdmin
      .from("property_media")
      .select("*")
      .eq("id", params.id)
      .eq("agency_id", userProfile.agency_id)
      .single()

    if (error || !media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Generate signed URL
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("property-media")
      .createSignedUrl(media.file_path, 3600)

    return NextResponse.json({
      ...media,
      signed_url: signedUrlData?.signedUrl,
    })
  } catch (error) {
    console.error("Get media error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("agency_id")
      .eq("user_id", user.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    // Get media to delete
    const { data: media, error: getError } = await supabaseAdmin
      .from("property_media")
      .select("*")
      .eq("id", params.id)
      .eq("agency_id", userProfile.agency_id)
      .single()

    if (getError || !media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage.from("property-media").remove([media.file_path])

    if (storageError) {
      console.error("Storage deletion error:", storageError)
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from("property_media")
      .delete()
      .eq("id", params.id)
      .eq("agency_id", userProfile.agency_id)

    if (dbError) {
      return NextResponse.json({ error: "Failed to delete media record" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete media error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
