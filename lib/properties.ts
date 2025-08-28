import { createClient } from "./supabase/client"
import type { Property, CRECIItem } from "./types"
import { buildCreciDisplayTitle } from "./creci"

const supabase = createClient()

export async function listPropertiesBySource(source?: "atriacrowd" | "creci") {
  let query = supabase.from("properties").select("*").eq("is_active", true).order("updated_at", { ascending: false })

  if (source) {
    query = query.eq("source", source)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Error fetching properties: ${error.message}`)
  }

  return data as Property[]
}

export function mapCRECIToProperty(src: CRECIItem): Partial<Property> {
  return {
    source: "creci",
    external_id: src.id,
    title: src.title || "Imóvel CRECI",
    display_title: buildCreciDisplayTitle(src),
    description: src.description,
    price: src.price,
    currency: "BRL",
    city: src.city,
    neighborhood: src.neighborhood,
    bedrooms: src.bedrooms,
    bathrooms: src.bathrooms,
    area: src.area,
    parking: src.parking,
    images: src.images || [],
    url_source: src.url,
    is_active: true,
  }
}

export async function saveInternalProperty(property: Partial<Property>) {
  const { data, error } = await supabase
    .from("properties")
    .insert({
      ...property,
      source: "atriacrowd",
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Error saving property: ${error.message}`)
  }

  return data as Property
}
