import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { supabase } from "@/lib/supabase/client"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime"]

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile to validate agency
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("agency_id, user_type")
      .eq("user_id", user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const propertyId = formData.get("propertyId") as string
    const altText = formData.get("altText") as string
    const isPrimary = formData.get("isPrimary") === "true"

    if (!file || !propertyId) {
      return NextResponse.json({ error: "File and propertyId are required" }, { status: 400 })
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Max size is 10MB" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    // Validate property ownership
    const { data: property, error: propertyError } = await supabaseAdmin
      .from("properties")
      .select("id, agency_id")
      .eq("id", propertyId)
      .eq("agency_id", userProfile.agency_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 403 })
    }

    // Generate unique file path
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${userProfile.agency_id}/${propertyId}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("property-media")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    // Get image dimensions if it's an image
    const width: number | null = null
    const height: number | null = null

    if (file.type.startsWith("image/")) {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        // Note: In production, you'd use a proper image processing library
        // For now, we'll skip dimensions extraction
      } catch (error) {
        console.warn("Could not extract image dimensions:", error)
      }
    }

    // If this is set as primary, unset other primary images
    if (isPrimary) {
      await supabaseAdmin
        .from("property_media")
        .update({ is_primary: false })
        .eq("property_id", propertyId)
        .eq("agency_id", userProfile.agency_id)
    }

    // Save media record to database
    const { data: mediaRecord, error: dbError } = await supabaseAdmin
      .from("property_media")
      .insert({
        property_id: propertyId,
        agency_id: userProfile.agency_id,
        file_name: file.name,
        file_path: filePath,
        bucket_name: "property-media",
        mime_type: file.type,
        file_size: file.size,
        width,
        height,
        is_primary: isPrimary,
        alt_text: altText || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      // Clean up uploaded file
      await supabaseAdmin.storage.from("property-media").remove([filePath])

      return NextResponse.json({ error: "Failed to save media record" }, { status: 500 })
    }

    // Generate signed URL for immediate access
    const { data: signedUrlData } = await supabaseAdmin.storage.from("property-media").createSignedUrl(filePath, 3600) // 1 hour

    return NextResponse.json({
      success: true,
      media: {
        ...mediaRecord,
        signed_url: signedUrlData?.signedUrl,
      },
    })
  } catch (error) {
    console.error("Upload API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
