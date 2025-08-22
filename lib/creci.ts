import type { CRECIItem } from "./types"

export function buildCreciDisplayTitle(src: CRECIItem): string {
  const parts = ["CRECI"]

  if (src.city) {
    parts.push(src.city)
  }

  const details = []
  if (src.bedrooms) {
    details.push(`${src.bedrooms}q`)
  }
  if (src.area) {
    details.push(`${src.area}m²`)
  }

  if (details.length > 0) {
    parts.push(details.join(" / "))
  }

  return parts.join(" • ")
}
