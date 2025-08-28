import { createClient } from "@/lib/supabase/server"
import type { SyncState } from "./types"

export async function getCursor(source: string): Promise<SyncState | null> {
  const supabase = createClient()

  const { data, error } = await supabase.from("sync_state").select("*").eq("source", source).single()

  if (error && error.code !== "PGRST116") {
    throw error
  }

  return data
}

export async function setCursor(source: string, cursor: Partial<SyncState>): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from("sync_state").upsert({
    source,
    ...cursor,
    last_run_at: new Date().toISOString(),
  })

  if (error) {
    throw error
  }
}
