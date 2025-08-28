import type { NextRequest } from "next/server"
import { ApiResponseHelper } from "@/lib/api-response"
import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File
    const propertyId = formData.get("propertyId") as string
    const agencyId = formData.get("agencyId") as string

    if (!file) {
      return ApiResponseHelper.error("Nenhuma imagem fornecida")
    }

    if (!propertyId) {
      return ApiResponseHelper.error("ID da propriedade é obrigatório")
    }

    if (!agencyId) {
      return ApiResponseHelper.error("ID da agência é obrigatório")
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return ApiResponseHelper.error("Arquivo deve ser uma imagem")
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return ApiResponseHelper.error("Imagem deve ter no máximo 5MB")
    }

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error listing buckets:", listError)
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === "property-images")

    if (!bucketExists) {
      console.log("[v0] Creating property-images bucket...")
      const { error: createBucketError } = await supabase.storage.createBucket("property-images", {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        fileSizeLimit: 5242880, // 5MB
      })

      if (createBucketError) {
        console.error("Error creating bucket:", createBucketError)
        return ApiResponseHelper.error("Erro ao configurar storage de imagens")
      }

      // Create RLS policies for the bucket
      try {
        await supabase.rpc("create_storage_policy", {
          bucket_name: "property-images",
          policy_name: "property_images_select_policy",
          operation: "SELECT",
          definition: "true", // Public read access
        })

        await supabase.rpc("create_storage_policy", {
          bucket_name: "property-images",
          policy_name: "property_images_insert_policy",
          operation: "INSERT",
          definition: "auth.uid() IS NOT NULL", // Authenticated users can upload
        })

        await supabase.rpc("create_storage_policy", {
          bucket_name: "property-images",
          policy_name: "property_images_update_policy",
          operation: "UPDATE",
          definition: "auth.uid() IS NOT NULL", // Authenticated users can update
        })

        await supabase.rpc("create_storage_policy", {
          bucket_name: "property-images",
          policy_name: "property_images_delete_policy",
          operation: "DELETE",
          definition: "auth.uid() IS NOT NULL", // Authenticated users can delete
        })
      } catch (policyError) {
        console.warn("Could not create RLS policies for bucket:", policyError)
        // Continue without policies - bucket is public anyway
      }

      console.log("[v0] Property-images bucket created successfully")
    }

    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${agencyId}/${propertyId}/${fileName}`

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("property-images")
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600", // Cache for 1 hour
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      return ApiResponseHelper.error(`Erro ao fazer upload da imagem: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(filePath)

    try {
      const { data: mediaData, error: insertError } = await supabase
        .from("property_media")
        .insert({
          property_id: propertyId,
          agency_id: agencyId,
          bucket: "property-images",
          path: filePath,
          mime_type: file.type,
          size_bytes: file.size,
          kind: "image",
          file_name: file.name,
          bucket_name: "property-images",
          file_path: filePath,
          is_primary: false, // Can be updated later
          alt_text: null,
          width: null, // Could be extracted from image metadata
          height: null, // Could be extracted from image metadata
        })
        .select()
        .single()

      if (insertError) {
        console.error("Could not save to property_media table:", insertError)
        // Clean up uploaded file if metadata save fails
        await supabase.storage.from("property-images").remove([filePath])
        return ApiResponseHelper.error("Erro ao salvar metadados da imagem")
      }

      console.log("[v0] Image metadata saved successfully:", mediaData)
    } catch (metadataError) {
      console.error("Metadata save failed:", metadataError)
      // Clean up uploaded file
      await supabase.storage.from("property-images").remove([filePath])
      return ApiResponseHelper.error("Erro ao salvar metadados da imagem")
    }

    console.log("[v0] Image uploaded successfully:", urlData.publicUrl)

    return ApiResponseHelper.success({
      url: urlData.publicUrl,
      filename: file.name,
      size: file.size,
      path: filePath,
      propertyId,
      agencyId,
    })
  } catch (error) {
    console.error("Upload image error:", error)
    return ApiResponseHelper.serverError("Erro interno do servidor")
  }
}
