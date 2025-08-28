import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    // Read environment variables
    const CRECI_ENDPOINT = process.env.CRECI_ENDPOINT
    const CRECI_API_KEY = process.env.CRECI_API_KEY
    const SUPABASE_URL = process.env.SUPABASE_URL!
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!CRECI_ENDPOINT || !CRECI_API_KEY) {
      return NextResponse.json(
        { error: "CRECI_ENDPOINT and CRECI_API_KEY environment variables are required" },
        { status: 400 },
      )
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch properties from CRECI endpoint
    const response = await fetch(CRECI_ENDPOINT, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CRECI_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`CRECI API error: ${response.status} ${response.statusText}`)
    }

    const creciData = await response.json()

    // Ensure creciData is an array
    const properties = Array.isArray(creciData) ? creciData : creciData.properties || []

    let importedCount = 0

    // Process each property
    for (const creciProperty of properties) {
      try {
        // Transform CRECI data to properties table format
        const transformedProperty = {
          title: creciProperty.nome || creciProperty.title || "Imóvel CRECI",
          description: creciProperty.descricao || creciProperty.description || "",
          price: Number.parseFloat(creciProperty.preco || creciProperty.price || "0"),
          address: creciProperty.endereco || creciProperty.address || "",
          city: creciProperty.cidade || creciProperty.city || "",
          state: creciProperty.estado || creciProperty.state || "",
          zip_code: creciProperty.cep || creciProperty.zip_code || "",
          property_type: creciProperty.tipo || creciProperty.property_type || "residential",
          status: "available",
          approval_status: "approved", // CRECI properties are auto-approved
          external_id: creciProperty.id || creciProperty.external_id || creciProperty.codigo,
          source: "CRECI",
          label: "CRECI Imóveis",
          agency_id: null, // CRECI properties don't belong to internal agencies
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Check if property already exists using external_id
        const { data: existingProperty } = await supabase
          .from("properties")
          .select("id")
          .eq("external_id", transformedProperty.external_id)
          .eq("source", "CRECI")
          .single()

        if (existingProperty) {
          // Update existing property
          const { error: updateError } = await supabase
            .from("properties")
            .update({
              ...transformedProperty,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingProperty.id)

          if (updateError) {
            console.error("Error updating property:", updateError)
            continue
          }
        } else {
          // Insert new property
          const { error: insertError } = await supabase.from("properties").insert(transformedProperty)

          if (insertError) {
            console.error("Error inserting property:", insertError)
            continue
          }
        }

        importedCount++
      } catch (propertyError) {
        console.error("Error processing property:", propertyError)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      count: importedCount,
      message: `Successfully imported ${importedCount} properties from CRECI`,
    })
  } catch (error) {
    console.error("CRECI import error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to import properties from CRECI",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
