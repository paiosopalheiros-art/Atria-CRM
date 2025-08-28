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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import {
  User,
  Download,
  Save,
  Camera,
  Lock,
  Activity,
  Bell,
  Database,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react"

import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

interface UserSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ActivityRow = {
  action: string
  description: string
  created_at: string
}

export function UserSettingsModal({ open, onOpenChange }: UserSettingsModalProps) {
  const { user } = useAuth()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [showPassword, setShowPassword] = useState(false)
  const [activities, setActivities] = useState<ActivityRow[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [avatarUploadEnabled, setAvatarUploadEnabled] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    creci: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    proposals: true,
    properties: true,
    contracts: true,
    system: true,
    marketing: false,
    weekly_reports: true,
  })

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.fullName.trim()) {
      errors.fullName = "Nome completo é obrigatório"
    }

    // Fixed regex: (11) 99999-9999 or (11) 9999-9999
    if (formData.phone && !/^$$\d{2}$$\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      errors.phone = "Formato inválido. Use: (11) 99999-9999"
    }

    // 123456-F
    if (formData.creci && !/^\d{5,6}-[A-Z]$/.test(formData.creci)) {
      errors.creci = "Formato inválido. Use: 123456-F"
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      errors.newPassword = "Nova senha deve ter pelo menos 6 caracteres"
    }

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Senhas não coincidem"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ------------ effects ------------
  useEffect(() => {
    if (user && open) {
      loadUserProfile()
      loadRecentActivities()
      checkAvatarUploadAvailability()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, open])

  const checkAvatarUploadAvailability = async () => {
    try {
      const { data: avatarsBucket } = await supabase.storage.getBucket("avatars")
      if (avatarsBucket) {
        setAvatarUploadEnabled(true)
        return
      }

      const { data: propertyBucket } = await supabase.storage.getBucket("property-images")
      if (propertyBucket) {
        setAvatarUploadEnabled(true)
        return
      }

      setAvatarUploadEnabled(false)
      console.warn("[v0] Avatar upload disabled - no suitable storage bucket found")
    } catch (error) {
      console.error("[v0] Error checking avatar upload availability:", error)
      setAvatarUploadEnabled(false)
    }
  }

  const loadUserProfile = async () => {
    if (!user) return

    try {
      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("full_name, email, phone, creci, bio, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle() // Use maybeSingle to avoid errors when no profile exists

      if (!error && profile) {
        setFormData((prev) => ({
          ...prev,
          fullName: profile.full_name || "",
          email: profile.email || user.email || "",
          phone: profile.phone || "",
          creci: profile.creci || "",
          bio: profile.bio || "",
        }))
        setAvatarUrl(profile.avatar_url || "")
      } else {
        // fallback inicial com dados do auth
        setFormData((prev) => ({
          ...prev,
          fullName: user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
          creci: "",
          bio: "",
        }))
      }

      const savedNotifications = localStorage.getItem("notification_preferences")
      if (savedNotifications) {
        setNotifications(JSON.parse(savedNotifications))
      }
    } catch (err) {
      console.error("[v0] Error loading user profile:", err)
    }
  }

  const loadRecentActivities = async () => {
    if (!user) return

    try {
      const { data: logs } = await supabase
        .from("activity_logs")
        .select("action, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)

      setActivities(logs || [])
    } catch (err) {
      console.error("[v0] Error loading activities:", err)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user || !avatarUploadEnabled) return

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
      const ext = (file.name.split(".").pop() || "png").toLowerCase()
      const path = `avatars/${user.id}/${Date.now()}.${ext}`

      // Try avatars bucket first; fallback to property-images/avatars/
      const tryAvatars = await supabase.storage.from("avatars").upload(path.replace(/^avatars\//, ""), file, {
        upsert: true,
        cacheControl: "3600",
      })

      let publicUrl: string | undefined

      if (tryAvatars.error) {
        console.warn("[v0] Avatars bucket not available, using property-images fallback")
        // fallback to property-images bucket
        const up2 = await supabase.storage.from("property-images").upload(path, file, {
          upsert: true,
          cacheControl: "3600",
        })
        if (up2.error) throw up2.error

        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path)
        publicUrl = urlData?.publicUrl
      } else {
        const p2 = path.replace(/^avatars\//, "") // in "avatars" bucket use root
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(p2)
        publicUrl = urlData?.publicUrl
      }

      if (!publicUrl) throw new Error("Erro ao gerar URL pública da imagem")

      const { error: upErr } = await supabase.from("user_profiles").upsert(
        {
          user_id: user.id,
          avatar_url: publicUrl,
          full_name: formData.fullName || user.user_metadata?.full_name || "",
          email: formData.email || user.email || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )

      if (upErr) throw upErr

      setAvatarUrl(publicUrl)
      alert("Avatar atualizado com sucesso!")
    } catch (err: any) {
      console.error("[v0] Avatar upload error:", err)
      alert(`Erro ao fazer upload da imagem: ${err?.message || "Erro desconhecido"}`)
    } finally {
      setUploadingAvatar(false)
      event.currentTarget.value = ""
    }
  }

  const handleSave = async () => {
    if (!user || !validateForm()) return

    setLoading(true)
    try {
      const profileData = {
        user_id: user.id,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        creci: formData.creci,
        bio: formData.bio,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from("user_profiles").upsert(profileData, {
        onConflict: "user_id",
      })
      if (error) throw error

      if (formData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        })
        if (passwordError) throw passwordError

        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }))
      }

      localStorage.setItem("notification_preferences", JSON.stringify(notifications))

      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: "profile_updated",
        description: "Perfil atualizado com sucesso",
        created_at: new Date().toISOString(),
      })

      alert("Perfil atualizado com sucesso!")
      onOpenChange(false)
    } catch (err: any) {
      console.error("[v0] Error saving profile:", err)
      alert(`Erro ao salvar perfil: ${err?.message || "Tente novamente."}`)
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    if (!user) return

    try {
      const { data: profile } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).maybeSingle()
      const { data: properties } = await supabase.from("properties").select("*").eq("user_id", user.id)
      const { data: proposals } = await supabase
        .from("proposals")
        .select("*")
        .in(
          "property_id",
          (properties || []).map((p: any) => p.id),
        )
      const { data: acts } = await supabase.from("activity_logs").select("*").eq("user_id", user.id)

      const payload = {
        profile,
        properties,
        proposals,
        activities: acts,
        notifications,
        exportDate: new Date().toISOString(),
        version: "1.0",
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `atria-backup-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("[v0] Error exporting data:", err)
      alert("Erro ao exportar dados. Tente novamente.")
    }
  }

  // ------------ UI ------------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            Configurações da Conta
            <Badge variant="secondary" className="ml-auto">
              {user?.user_metadata?.user_type || "Parceiro"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5 flex-shrink-0 h-12">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Segurança
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Atividades
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Dados
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {/* PROFILE */}
            <TabsContent value="profile" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Foto do Perfil
                  </CardTitle>
                  <CardDescription>
                    Sua foto aparecerá em propostas, contratos e comunicações com clientes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden ring-4 ring-white shadow-xl">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl || "/placeholder.svg"}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-12 w-12 text-blue-600" />
                        )}
                      </div>
                      <label
                        className={`absolute -bottom-2 -right-2 p-2.5 rounded-full cursor-pointer shadow-lg transition-all hover:scale-105 ${
                          avatarUploadEnabled
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-400 text-gray-200 cursor-not-allowed"
                        }`}
                      >
                        <Camera className="h-4 w-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={uploadingAvatar || !avatarUploadEnabled}
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">
                        {uploadingAvatar ? "Enviando..." : avatarUploadEnabled ? "Alterar Foto" : "Upload Indisponível"}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {avatarUploadEnabled
                          ? "Clique no ícone da câmera para alterar sua foto de perfil"
                          : "Upload de avatar não está configurado. Contate o administrador."}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {avatarUploadEnabled ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Formatos aceitos: JPG, PNG (máx. 5MB)
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            Funcionalidade temporariamente indisponível
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                  <CardDescription>Mantenha seus dados atualizados para melhor experiência</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Nome Completo *
                      </Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                        className={`h-11 ${validationErrors.fullName ? "border-red-500" : ""}`}
                        placeholder="Seu nome completo"
                      />
                      {validationErrors.fullName && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {validationErrors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input id="email" type="email" value={formData.email} disabled className="bg-gray-50 h-11" />
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Lock className="h-3 w-3" />O email não pode ser alterado por segurança
                      </p>
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
                        className={`h-11 ${validationErrors.phone ? "border-red-500" : ""}`}
                      />
                      {validationErrors.phone && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {validationErrors.phone}
                        </p>
                      )}
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
                        className={`h-11 ${validationErrors.creci ? "border-red-500" : ""}`}
                      />
                      {validationErrors.creci && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {validationErrors.creci}
                        </p>
                      )}
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
                    <p className="text-xs text-gray-500">{formData.bio.length}/500 caracteres</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SECURITY */}
            <TabsContent value="security" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Alterar Senha
                  </CardTitle>
                  <CardDescription>Mantenha sua conta segura com uma senha forte</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-sm font-medium">
                      Senha Atual
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={formData.currentPassword}
                        onChange={(e) => setFormData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                        className="h-11 pr-10"
                        placeholder="Digite sua senha atual"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword((s) => !s)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm font-medium">
                        Nova Senha
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData((prev) => ({ ...prev, newPassword: e.target.value }))}
                        className={`h-11 ${validationErrors.newPassword ? "border-red-500" : ""}`}
                        placeholder="Digite a nova senha"
                      />
                      {validationErrors.newPassword && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {validationErrors.newPassword}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">
                        Confirmar Nova Senha
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        className={`h-11 ${validationErrors.confirmPassword ? "border-red-500" : ""}`}
                        placeholder="Confirme a nova senha"
                      />
                      {validationErrors.confirmPassword && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {validationErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sessões Ativas</CardTitle>
                  <CardDescription>Gerencie onde você está logado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Sessão Atual</p>
                        <p className="text-sm text-gray-500">Navegador atual • Agora</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Ativo</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTIFICATIONS */}
            <TabsContent value="notifications" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Preferências de Notificação
                  </CardTitle>
                  <CardDescription>Escolha como e quando você quer ser notificado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    {[
                      {
                        key: "email",
                        title: "Notificações por Email",
                        desc: "Receber notificações importantes no seu email",
                      },
                      { key: "push", title: "Notificações Push", desc: "Notificações instantâneas no navegador" },
                      {
                        key: "proposals",
                        title: "Novas Propostas",
                        desc: "Alertas quando receber propostas para seus imóveis",
                      },
                      {
                        key: "properties",
                        title: "Status de Propriedades",
                        desc: "Atualizações sobre mudanças nas suas propriedades",
                      },
                      {
                        key: "contracts",
                        title: "Contratos",
                        desc: "Notificações sobre assinatura e status de contratos",
                      },
                      { key: "system", title: "Sistema", desc: "Atualizações importantes do sistema e manutenções" },
                      { key: "marketing", title: "Marketing", desc: "Dicas, novidades e conteúdo educativo" },
                      {
                        key: "weekly_reports",
                        title: "Relatórios Semanais",
                        desc: "Resumo semanal das suas atividades e métricas",
                      },
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">{item.title}</Label>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                        <Switch
                          checked={notifications[item.key as keyof typeof notifications]}
                          onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ACTIVITY */}
            <TabsContent value="activity" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Atividades Recentes
                  </CardTitle>
                  <CardDescription>Histórico das suas últimas ações na plataforma</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities.length > 0 ? (
                      activities.map((activity, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{activity.action}</p>
                            <p className="text-sm text-gray-600">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.created_at).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma atividade recente encontrada</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DATA */}
            <TabsContent value="data" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Exportar Dados
                  </CardTitle>
                  <CardDescription>Baixe todos os seus dados em formato JSON para backup</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">O que está incluído:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Informações do perfil</li>
                        <li>• Propriedades cadastradas</li>
                        <li>• Propostas recebidas</li>
                        <li>• Histórico de atividades</li>
                        <li>• Preferências de notificação</li>
                      </ul>
                    </div>
                    <Button onClick={exportData} variant="outline" className="w-full bg-transparent">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Backup Completo
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <AlertTriangle className="h-5 w-5" />
                    Zona de Perigo
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    Ações irreversíveis que afetam permanentemente sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Atenção:</strong> A exclusão da conta é permanente e não pode ser desfeita. Todos os
                        seus dados, propriedades e histórico serão perdidos.
                      </p>
                    </div>
                    <Button variant="destructive" className="w-full" disabled>
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Excluir Conta (Em breve)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <Separator />
        <div className="flex justify-between items-center pt-6 pb-2 flex-shrink-0">
          <p className="text-xs text-gray-500">Última atualização: {new Date().toLocaleString("pt-BR")}</p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="px-8 h-11 min-w-[120px]">
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="px-8 h-11 min-w-[160px] bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
