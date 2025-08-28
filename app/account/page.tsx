"use client"

import React from "react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/card" // <- Avatar "hospedado" no card.tsx
import { supabase } from "@/lib/supabase/client"

type ProfileRow = {
  id: string
  avatar_url: string | null
  full_name?: string | null
}

export default function AccountPage() {
  const [loading, setLoading] = React.useState(true)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null)
  const [fullName, setFullName] = React.useState<string | null>(null)

  // 1) pega usuário logado
  React.useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error("auth.getUser error:", error)
        setLoading(false)
        return
      }
      if (!user || !active) {
        setLoading(false)
        return
      }
      setUserId(user.id)
      await loadProfile(user.id)
      setLoading(false)
    })()
    return () => { active = false }
  }, [])

  // 2) carrega perfil (tenta `user_profiles`, se não existir tenta `profiles`)
  async function loadProfile(uid: string) {
    // tentativa 1: user_profiles
    let { data, error } = await supabase
      .from("user_profiles")
      .select("id, avatar_url, full_name")
      .eq("id", uid)
      .single<ProfileRow>()

    if (error) {
      // fallback: profiles
      const fb = await supabase
        .from("profiles")
        .select("id, avatar_url, full_name")
        .eq("id", uid)
        .single<ProfileRow>()
      data = fb.data ?? null
    }

    if (data) {
      setAvatarUrl(data.avatar_url ?? null)
      setFullName(data.full_name ?? null)
    }
  }

  // 3) upload de imagem -> storage "avatars" -> atualiza avatar_url público
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0]
      if (!file || !userId) return

      setLoading(true)

      // caminho: avatars/{userId}/{timestamp.ext}
      const ext = file.name.split(".").pop() || "png"
      const path = `${userId}/${Date.now()}.${ext}`

      // envia pro bucket
      const { error: uploadErr } = await supabase
        .storage
        .from("avatars")
        .upload(path, file, { upsert: true })

      if (uploadErr) throw uploadErr

      // pega URL pública
      const { data: pub } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(path)

      const publicUrl = pub?.publicUrl ?? null
      if (!publicUrl) throw new Error("Não foi possível gerar a URL pública do avatar.")

      // tenta atualizar em user_profiles; se não existir, atualiza profiles
      let update = await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId)

      if (update.error) {
        await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", userId)
      }

      setAvatarUrl(publicUrl)
    } catch (err) {
      console.error("upload avatar error:", err)
      alert("Falha ao enviar a foto. Veja o console para detalhes.")
    } finally {
      setLoading(false)
      // limpa o input para permitir re-upload do mesmo arquivo
      e.currentTarget.value = ""
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p>Carregando…</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage
            src={avatarUrl || "/professional-avatar.png"}
            alt={fullName || "Foto de perfil"}
          />
          <AvatarFallback>
            {(fullName?.[0] ?? "U").toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <div className="text-xl font-medium">
            {fullName || "Seu perfil"}
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <span className="rounded-md border px-3 py-2 text-sm">
              Alterar foto
            </span>
          </label>
        </div>
      </div>

      {!avatarUrl && (
        <p className="text-sm text-muted-foreground">
          Dica: se o bucket <code>avatars</code> não estiver público, torne-o público no Supabase Storage
          ou ajuste as políticas RLS. Sem isso, a imagem não carrega no navegador.
        </p>
      )}
    </div>
  )
}
