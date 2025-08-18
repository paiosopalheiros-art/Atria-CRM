"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Shield, Download, Save, Camera } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

interface UserSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserSettingsModal({ open, onOpenChange }: UserSettingsModalProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const supabase = createClient()

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    creci: "",
    bio: "",
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    proposals: true,
    properties: true,
    contracts: true,
    system: true,
  })

  useEffect(() => {
    if (user && open) {
      loadUserProfile()
    }
  }, [user, open])

  const loadUserProfile = async () => {
    if (!user) return

    try {
      console.log("[v0] Loading user profile data...")

      // Get user profile from user_profiles table
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("full_name, email, phone, creci, bio")
        .eq("user_id", user.id)
        .single()

      if (profile && !profileError) {
        setFormData({
          fullName: profile.full_name || "",
          email: profile.email || user.email || "",
          phone: profile.phone || "",
          creci: profile.creci || "",
          bio: profile.bio || "",
        })
      } else {
        // Fallback to auth user data
        setFormData({
          fullName: user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
          creci: "",
          bio: "",
        })
      }

      const savedNotifications = localStorage.getItem("notification_preferences")
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications))
      }
    } catch (error) {
      console.error("[v0] Error loading user profile:", error)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem válida")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB")
      return
    }

    setUploadingAvatar(true)
    try {
      console.log("[v0] Uploading avatar...")

      const { data: buckets } = await supabase.storage.listBuckets()
      const avatarsBucketExists = buckets?.some((bucket) => bucket.name === "avatars")

      if (!avatarsBucketExists) {
        console.log("[v0] Creating avatars bucket...")
        await supabase.storage.createBucket("avatars", {
          public: true,
          allowedMimeTypes: ["image/*"],
          fileSizeLimit: 5242880, // 5MB
        })
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(publicUrl)
      console.log("[v0] Avatar uploaded successfully")
      alert("Avatar atualizado com sucesso!")
    } catch (error) {
      console.error("[v0] Avatar upload error:", error)
      alert("Erro ao fazer upload da imagem. Tente novamente.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log("[v0] Saving user profile...")

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      const profileData = {
        user_id: user.id,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        creci: formData.creci,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      }

      let error
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase.from("user_profiles").update(profileData).eq("user_id", user.id)
        error = updateError
      } else {
        // Insert new profile
        const { error: insertError } = await supabase.from("user_profiles").insert({
          ...profileData,
          created_at: new Date().toISOString(),
        })
        error = insertError
      }

      if (error) {
        throw error
      }

      localStorage.setItem("notification_preferences", JSON.stringify(notifications))

      console.log("[v0] Profile saved successfully")
      alert("Perfil atualizado com sucesso!")
      onOpenChange(false)
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
      alert("Erro ao salvar perfil. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    if (!user) return

    try {
      console.log("[v0] Exporting user data...")

      const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

      const { data: properties } = await supabase.from("properties").select("*").eq("agency_id", profile?.agency_id)

      const { data: proposals } = await supabase
        .from("proposals")
        .select("*")
        .in("property_id", properties?.map((p) => p.id) || [])

      const exportData = {
        profile,
        properties,
        proposals,
        exportDate: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `atria-backup-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      console.log("[v0] Data exported successfully")
    } catch (error) {
      console.error("[v0] Error exporting data:", error)
      alert("Erro ao exportar dados. Tente novamente.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Configurações da Conta
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="data">Dados</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <TabsContent value="profile" className="space-y-6 mt-0">
              <div className="flex items-center gap-6 p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-lg">
                    {avatarUrl ? (
                      <img src={avatarUrl || "/placeholder.svg"} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Foto do Perfil</h4>
                  <p className="text-sm text-gray-600">
                    {uploadingAvatar ? "Enviando..." : "Clique no ícone da câmera para alterar sua foto"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Formatos aceitos: JPG, PNG (máx. 5MB)</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Nome Completo
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input id="email" type="email" value={formData.email} disabled className="bg-gray-50 h-11" />
                    <p className="text-xs text-gray-500">O email não pode ser alterado</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium">
                      Telefone
                    </Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creci" className="text-sm font-medium">
                      CRECI
                    </Label>
                    <Input
                      id="creci"
                      value={formData.creci}
                      onChange={(e) => setFormData((prev) => ({ ...prev, creci: e.target.value }))}
                      placeholder="Ex: 123456-F"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium">
                    Biografia Profissional
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Conte um pouco sobre sua experiência no mercado imobiliário..."
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6 mt-0">
              <div className="space-y-6">
                <div className="grid gap-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Notificações por Email</Label>
                      <p className="text-sm text-gray-500">Receber notificações importantes no seu email</p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Notificações Push</Label>
                      <p className="text-sm text-gray-500">Notificações instantâneas no navegador</p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Novas Propostas</Label>
                      <p className="text-sm text-gray-500">Alertas quando receber propostas para seus imóveis</p>
                    </div>
                    <Switch
                      checked={notifications.proposals}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, proposals: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Status de Propriedades</Label>
                      <p className="text-sm text-gray-500">Atualizações sobre mudanças nas suas propriedades</p>
                    </div>
                    <Switch
                      checked={notifications.properties}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, properties: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Contratos</Label>
                      <p className="text-sm text-gray-500">Notificações sobre assinatura e status de contratos</p>
                    </div>
                    <Switch
                      checked={notifications.contracts}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, contracts: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Sistema</Label>
                      <p className="text-sm text-gray-500">Atualizações importantes do sistema e manutenções</p>
                    </div>
                    <Switch
                      checked={notifications.system}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, system: checked }))}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Download className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Exportar Dados</h4>
                      <p className="text-sm text-gray-500">Baixe todos os seus dados em formato JSON</p>
                    </div>
                  </div>
                  <Button onClick={exportData} variant="outline" className="w-full bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Backup Completo
                  </Button>
                </div>

                <div className="p-4 border rounded-lg border-red-200 bg-red-50">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-5 w-5 text-red-600" />
                    <div>
                      <h4 className="font-medium text-red-900">Zona de Perigo</h4>
                      <p className="text-sm text-red-700">Ações irreversíveis que afetam sua conta</p>
                    </div>
                  </div>
                  <Button variant="destructive" className="w-full" disabled>
                    Excluir Conta (Em breve)
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-3 pt-6 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="px-6">
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
