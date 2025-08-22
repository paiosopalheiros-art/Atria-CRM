"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs"
import {
  Users,
  LogOut,
  UserPlus,
  Building2,
  Eye,
  MessageSquare,
  MapPin,
  Bed,
  Bath,
  Car,
  Ruler,
  Trash2,
} from "lucide-react"
import { ProposalManagement } from "./proposal-management"
import { ContractManagement } from "./contract-management"
import AIAssistant from "./ai-assistant"
import type { Property } from "./property-upload-dialog"
import type { Proposal } from "./property-proposal-form"
import type { User } from "@/app/page"
import { supabase } from "@/lib/supabase/client"

import SubscriptionManager from "./subscription-manager"
import RankingLeaderboard from "./ranking-leaderboard"
import BoostManager from "./boost-manager"

interface AdminDashboardProps {
  user: User
  onLogout: () => void
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [inviteCodes, setInviteCodes] = useState<
    Array<{ id: string; code: string; type: "admin" | "partner"; used: boolean; createdAt: string }>
  >([])
  const [activityLogs, setActivityLogs] = useState<
    Array<{ id: string; action: string; user: string; timestamp: string; details: string }>
  >([])
  const [notifications, setNotifications] = useState<
    Array<{ id: string; message: string; type: "info" | "warning" | "success"; timestamp: string }>
  >([])
  const [loading, setLoading] = useState(false)
  const [publications, setPublications] = useState<any[]>([])
  // const supabase = useSupabaseClient()

  useEffect(() => {
    loadUsersFromSupabase()
    loadDataFromSupabase()
  }, [])

  const loadDataFromSupabase = async () => {
    try {
      console.log("[v0] Loading all data from Supabase...")

      const { data: publicationsData, error: publicationsError } = await supabase
        .from("publications")
        .select("*")
        .eq("listing_type", "sale") // Only show sale properties
        .order("created_at", { ascending: false })

      if (publicationsError) {
        console.error("[v0] Error loading publications:", publicationsError)
      } else {
        console.log("[v0] Loaded publications:", publicationsData?.length || 0)
        // Mark ATS properties as auto-approved in the UI
        const formattedPublications = (publicationsData || []).map((pub) => ({
          ...pub,
          auto_approved: pub.source === "creci", // ATS properties are auto-approved
        }))
        setPublications(formattedPublications)
      }

      // Load properties
      const { data: propertiesData, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false })

      if (propertiesError) {
        console.error("[v0] Error loading properties:", propertiesError)
      } else {
        const formattedProperties =
          propertiesData?.map((prop) => ({
            id: prop.id,
            title: prop.title,
            description: prop.description,
            price: prop.price,
            location: prop.location,
            type: prop.property_type,
            status: prop.status,
            images: prop.images || [],
            createdAt: prop.created_at,
            userId: prop.user_id,
          })) || []
        setProperties(formattedProperties)
      }

      const { data: proposalsData, error: proposalsError } = await supabase
        .from("proposals")
        .select("*")
        .order("created_at", { ascending: false })

      if (proposalsError) {
        console.error("[v0] Error loading proposals:", proposalsError)
      } else {
        // Create a map of property IDs to titles for quick lookup
        const propertyTitleMap = new Map()
        if (propertiesData) {
          propertiesData.forEach((prop) => {
            propertyTitleMap.set(prop.id, prop.title)
          })
        }

        const formattedProposals =
          proposalsData?.map((proposal) => ({
            id: proposal.id,
            propertyId: proposal.property_id,
            propertyTitle: propertyTitleMap.get(proposal.property_id) || "Propriedade",
            clientName: proposal.client_name,
            clientEmail: proposal.client_email,
            clientPhone: proposal.client_phone,
            proposedPrice: proposal.proposed_price,
            message: proposal.message,
            status: proposal.status,
            createdAt: proposal.created_at,
          })) || []
        setProposals(formattedProposals)
      }

      // Load invite codes
      const { data: inviteCodesData, error: inviteCodesError } = await supabase
        .from("invite_codes")
        .select("*")
        .order("created_at", { ascending: false })

      if (inviteCodesError) {
        console.error("[v0] Error loading invite codes:", inviteCodesError)
        // Set default codes if none exist
        const defaultCodes = [
          { id: "1", code: "ADMIN2024", type: "admin" as const, used: false, createdAt: new Date().toISOString() },
          { id: "2", code: "PARTNER2024", type: "partner" as const, used: false, createdAt: new Date().toISOString() },
          { id: "3", code: "CAPTADOR2024", type: "partner" as const, used: false, createdAt: new Date().toISOString() },
        ]
        setInviteCodes(defaultCodes)
      } else {
        const formattedCodes =
          inviteCodesData?.map((code) => ({
            id: code.id,
            code: code.code,
            type: code.user_type,
            used: code.is_used,
            createdAt: code.created_at,
          })) || []
        setInviteCodes(formattedCodes)
      }

      // Load activity logs
      const { data: activityLogsData, error: activityLogsError } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (activityLogsError) {
        console.error("[v0] Error loading activity logs:", activityLogsError)
      } else {
        const formattedLogs =
          activityLogsData?.map((log) => ({
            id: log.id,
            action: log.action,
            user: log.user_name,
            timestamp: log.created_at,
            details: log.details,
          })) || []
        setActivityLogs(formattedLogs)
      }

      // Load notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (notificationsError) {
        console.error("[v0] Error loading notifications:", notificationsError)
      } else {
        const formattedNotifications =
          notificationsData?.map((notif) => ({
            id: notif.id,
            message: notif.message,
            type: notif.type,
            timestamp: notif.created_at,
          })) || []
        setNotifications(formattedNotifications)
      }

      console.log("[v0] All data loaded from Supabase successfully")
    } catch (error) {
      console.error("[v0] Error loading data from Supabase:", error)
      addNotification("Erro ao carregar dados do sistema", "warning")
    }
  }

  const loadUsersFromSupabase = async () => {
    try {
      console.log("[v0] Loading users from API...")
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error loading users:", errorData.error)
        addNotification(`Erro ao carregar usuários: ${errorData.error}`, "warning")
        return
      }

      const { users: authUsers } = await response.json()

      const formattedUsers: User[] = authUsers.map((authUser: any) => ({
        id: authUser.id,
        email: authUser.email || "",
        fullName: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "Usuário",
        userType: authUser.email?.includes("admin") ? "admin" : "partner",
        isActive: true,
        createdAt: authUser.created_at,
        creci: authUser.user_metadata?.creci || null,
      }))

      setUsers(formattedUsers)
      console.log("[v0] Loaded users:", formattedUsers.length)
    } catch (error) {
      console.error("[v0] Error loading users:", error)
      addNotification("Erro interno ao carregar usuários", "warning")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find((u) => u.id === userId)

    if (!userToDelete) {
      addNotification("Usuário não encontrado", "warning")
      return
    }

    if (userId === user.id) {
      addNotification("Você não pode deletar sua própria conta", "warning")
      return
    }

    const confirmDelete = window.confirm(
      `Tem certeza que deseja deletar o usuário "${userToDelete.fullName}" (${userToDelete.email})?\n\nEsta ação não pode ser desfeita.`,
    )

    if (!confirmDelete) return

    setLoading(true)
    try {
      console.log("[v0] Deleting user:", userId)

      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error deleting user:", errorData.error)
        addNotification(`Erro ao deletar usuário: ${errorData.error}`, "warning")
        return
      }

      const updatedUsers = users.filter((u) => u.id !== userId)
      setUsers(updatedUsers)

      logActivity(
        "Usuário Deletado",
        `Usuário "${userToDelete.fullName}" (${userToDelete.email}) foi deletado permanentemente`,
      )
      addNotification(`Usuário "${userToDelete.fullName}" foi deletado com sucesso`, "success")

      console.log("[v0] User deleted successfully")
    } catch (error) {
      console.error("[v0] Error deleting user:", error)
      addNotification("Erro interno ao deletar usuário", "warning")
    } finally {
      setLoading(false)
    }
  }

  const logActivity = async (action: string, details: string) => {
    const newLog = {
      action,
      user_name: user.fullName || "Admin",
      user_id: user.id,
      details,
    }

    try {
      const { data, error } = await supabase.from("activity_logs").insert([newLog]).select()

      if (error) {
        console.error("[v0] Error saving activity log:", error)
      } else {
        const formattedLog = {
          id: data[0].id,
          action: data[0].action,
          user: data[0].user_name,
          timestamp: data[0].created_at,
          details: data[0].details,
        }
        setActivityLogs((prev) => [formattedLog, ...prev].slice(0, 100))
      }
    } catch (error) {
      console.error("[v0] Error saving activity log:", error)
    }
  }

  const addNotification = async (message: string, type: "info" | "warning" | "success") => {
    const newNotification = {
      message,
      type,
      user_id: user.id,
    }

    try {
      const { data, error } = await supabase.from("notifications").insert([newNotification]).select()

      if (error) {
        console.error("[v0] Error saving notification:", error)
      } else {
        const formattedNotification = {
          id: data[0].id,
          message: data[0].message,
          type: data[0].type,
          timestamp: data[0].created_at,
        }
        setNotifications((prev) => [formattedNotification, ...prev].slice(0, 50))
      }
    } catch (error) {
      console.error("[v0] Error saving notification:", error)
    }
  }

  const handleDeleteProperty = async (propertyId: string) => {
    try {
      const property = properties.find((p) => p.id === propertyId)

      if (
        !confirm(`Tem certeza que deseja deletar a propriedade "${property?.title}"? Esta ação não pode ser desfeita.`)
      ) {
        return
      }

      const { error } = await supabase.from("properties").delete().eq("id", propertyId)

      if (error) {
        console.error("[v0] Error deleting property:", error)
        addNotification("Erro ao deletar propriedade", "warning")
        return
      }

      const updatedProperties = properties.filter((p) => p.id !== propertyId)
      setProperties(updatedProperties)

      await logActivity("Propriedade Deletada", `Propriedade "${property?.title}" foi deletada permanentemente`)
      await addNotification(`Propriedade "${property?.title}" foi deletada`, "warning")
    } catch (error) {
      console.error("[v0] Error deleting property:", error)
      addNotification("Erro interno ao deletar propriedade", "warning")
    }
  }

  const generateInviteCode = async (type: "admin" | "partner") => {
    const code = `${type.toUpperCase()}${Date.now().toString().slice(-6)}`
    const newCode = {
      code,
      user_type: type,
      is_used: false,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    }

    try {
      const { data, error } = await supabase.from("invite_codes").insert([newCode]).select()

      if (error) {
        console.error("[v0] Error creating invite code:", error)
        addNotification("Erro ao criar código de convite", "warning")
        return
      }

      const formattedCode = {
        id: data[0].id,
        code: data[0].code,
        type: data[0].user_type,
        used: data[0].is_used,
        createdAt: data[0].created_at,
      }

      setInviteCodes((prev) => [...prev, formattedCode])
      await logActivity("Código de Convite Criado", `Novo código ${code} para ${type}`)
      await addNotification(`Código de convite ${code} criado com sucesso`, "success")
    } catch (error) {
      console.error("[v0] Error creating invite code:", error)
      addNotification("Erro interno ao criar código de convite", "warning")
    }
  }

  const deactivateInviteCode = async (codeId: string) => {
    try {
      const { error } = await supabase.from("invite_codes").update({ is_used: true }).eq("id", codeId)

      if (error) {
        console.error("[v0] Error deactivating invite code:", error)
        addNotification("Erro ao desativar código de convite", "warning")
        return
      }

      const updatedCodes = inviteCodes.map((c) => (c.id === codeId ? { ...c, used: true } : c))
      setInviteCodes(updatedCodes)

      const code = inviteCodes.find((c) => c.id === codeId)
      await logActivity("Código de Convite Desativado", `Código ${code?.code} foi desativado`)
    } catch (error) {
      console.error("[v0] Error deactivating invite code:", error)
      addNotification("Erro interno ao desativar código de convite", "warning")
    }
  }

  const partnerUsers = users.filter((u) => u.userType === "partner")
  const adminUsers = users.filter((u) => u.userType === "admin")
  const pendingProperties = properties.filter((p) => p.status === "pending")
  const approvedProperties = properties.filter((p) => p.status === "approved")
  const totalViews = properties.reduce((acc, p, index) => acc + (100 + index * 15), 0)

  const handleShareProperty = (property: Property) => {
    const shareUrl = `${window.location.origin}/property/${property.id}`
    navigator.clipboard.writeText(shareUrl)
    alert("Link copiado para a área de transferência!")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Building2 className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Atria</h1>
                  <p className="text-sm text-gray-600">Painel Administrativo</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">Administrador</span>
                  </div>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-sm font-semibold text-white">
                    {user.fullName
                      ? user.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                      : "??"}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={onLogout}
                className="gap-2 border-gray-200 text-gray-700 hover:bg-gray-50 bg-transparent"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                <p className="text-xs text-gray-500">
                  +
                  {
                    users.filter((u) => {
                      const created = new Date(u.createdAt)
                      const lastWeek = new Date()
                      lastWeek.setDate(lastWeek.getDate() - 7)
                      return created > lastWeek
                    }).length
                  }{" "}
                  esta semana
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Total de Usuários</p>
              <p className="text-xs text-gray-500">Crescimento constante</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{partnerUsers.length}</div>
                <p className="text-xs text-gray-500">Parceiros ativos</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Parceiros Ativos</p>
              <p className="text-xs text-gray-500">Captadores e corretores</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{properties.length}</div>
                <p className="text-xs text-gray-500">{approvedProperties.length} aprovadas</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Propriedades</p>
              <p className="text-xs text-gray-500">Total cadastradas</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{proposals.length}</div>
                <p className="text-xs text-gray-500">
                  {proposals.filter((p) => p.status === "pending").length} pendentes
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Propostas</p>
              <p className="text-xs text-gray-500">Interesse dos clientes</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{totalViews}</div>
                <p className="text-xs text-gray-500">Engajamento alto</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Visualizações</p>
              <p className="text-xs text-gray-500">Total de visualizações</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="moderation" className="space-y-8">
          <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start">
            <TabsTrigger
              value="moderation"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 relative bg-transparent rounded-none"
            >
              Moderação
              {pendingProperties.length > 0 && (
                <div className="ml-2 inline-flex items-center justify-center h-5 w-5 bg-red-500 rounded-full">
                  <span className="text-xs font-medium text-white">{pendingProperties.length}</span>
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="feed"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Feed Completo
            </TabsTrigger>
            <TabsTrigger
              value="proposals"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Propostas
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Usuários
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger
              value="invites"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Convites
            </TabsTrigger>
            <TabsTrigger
              value="contracts"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Contratos
            </TabsTrigger>
            <TabsTrigger
              value="ai-assistant"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Assistente IA
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Planos
            </TabsTrigger>
            <TabsTrigger
              value="ranking"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Ranking Global
            </TabsTrigger>
            <TabsTrigger
              value="boost-admin"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Boost Admin
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Atividades
              {notifications.length > 0 && (
                <div className="ml-2 inline-flex items-center justify-center h-5 w-5 bg-blue-500 rounded-full">
                  <span className="text-xs font-medium text-white">{notifications.length}</span>
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Configurações
            </TabsTrigger>
            <TabsTrigger
              value="gamification"
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
            >
              Gamificação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="moderation">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Moderação de Propriedades</h2>
                    <p className="text-sm text-gray-600">
                      Todas as propriedades precisam ser aprovadas MANUALMENTE. Nenhuma aprovação é automática.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => loadDataFromSupabase()} disabled={loading}>
                      {loading ? "Carregando..." : "Atualizar"}
                    </Button>
                    {pendingProperties.length > 0 && (
                      <div className="flex items-center gap-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">{pendingProperties.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-800">{pendingProperties.length}</div>
                    <div className="text-sm text-yellow-600">Aguardando Aprovação</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-800">
                      {properties.filter((p) => p.status === "approved").length}
                    </div>
                    <div className="text-sm text-green-600">Aprovadas</div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-800">
                      {properties.filter((p) => p.status === "rejected").length}
                    </div>
                    <div className="text-sm text-red-600">Rejeitadas</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-800">{properties.length}</div>
                    <div className="text-sm text-blue-600">Total</div>
                  </div>
                </div>

                <div className="space-y-6">
                  {pendingProperties.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Tudo em dia!</h3>
                      <p className="text-gray-500">Nenhuma propriedade pendente de aprovação manual</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Todas as propriedades são aprovadas manualmente por administradores
                      </p>
                    </div>
                  ) : (
                    pendingProperties.map((property) => (
                      <div
                        key={property.id}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">{property.title}</h3>
                              <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold border border-yellow-300">
                                🔍 AGUARDANDO APROVAÇÃO MANUAL
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                              <MapPin className="h-4 w-4" />
                              <span>{property.location}</span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Publicado por:{" "}
                              <span className="font-medium">
                                {users.find((u) => u.id === property.userId)?.fullName || "Usuário não encontrado"}
                              </span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Criado em: {new Date(property.createdAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">
                              R$ {property.price.toLocaleString("pt-BR")}
                            </div>
                            <p className="text-sm text-gray-500">
                              {property.type === "house" ? "Casa" : "Apartamento"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {/* Assuming these properties exist on your Property type */}
                          {property.bedrooms && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Bed className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium">Quartos</span>
                              </div>
                              <p className="text-lg font-semibold">{property.bedrooms}</p>
                            </div>
                          )}
                          {property.bathrooms && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Bath className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium">Banheiros</span>
                              </div>
                              <p className="text-lg font-semibold">{property.bathrooms}</p>
                            </div>
                          )}
                          {property.garages && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Car className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium">Vagas</span>
                              </div>
                              <p className="text-lg font-semibold">{property.garages}</p>
                            </div>
                          )}
                          {property.builtArea && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <Ruler className="h-4 w-4 text-gray-600" />
                                <span className="text-sm font-medium">Área</span>
                              </div>
                              <p className="text-lg font-semibold">{property.builtArea}m²</p>
                            </div>
                          )}
                        </div>

                        {property.images && property.images.length > 0 && (
                          <div className="mb-4">
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {property.images.slice(0, 4).map((image, index) => (
                                <img
                                  key={index}
                                  src={image || "/placeholder.svg"}
                                  alt={`Imagem ${index + 1}`}
                                  className="w-24 h-20 object-cover rounded-lg flex-shrink-0 border border-gray-200"
                                />
                              ))}
                              {property.images.length > 4 && (
                                <div className="w-24 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
                                  +{property.images.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteProperty(property.id)}
                            className="px-8 py-2 font-semibold"
                            size="lg"
                          >
                            🗑 DELETAR PROPRIEDADE
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="feed">
            <Card>
              <CardHeader>
                <CardTitle>Feed Completo - Todas as Propriedades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div key={property.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{property.title}</h3>
                          <p className="text-sm text-muted-foreground">{property.location}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              property.status === "approved"
                                ? "default"
                                : property.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {property.status === "approved"
                              ? "Aprovada"
                              : property.status === "pending"
                                ? "Pendente"
                                : "Rejeitada"}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteProperty(property.id)}>
                            Deletar
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Preço:</span>
                          <p>R$ {property.price.toLocaleString("pt-BR")}</p>
                        </div>
                        <div>
                          <span className="font-medium">Publicado por:</span>
                          <p>{users.find((u) => u.id === property.userId)?.fullName || "N/A"}</p>
                        </div>
                        <div>
                          <span className="font-medium">Data:</span>
                          <p>{new Date(property.createdAt).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div>
                          <span className="font-medium">Visualizações:</span>
                          <p>{Math.floor(Math.random() * 100)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {properties.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">Nenhuma propriedade cadastrada ainda</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proposals">
            <Card>
              <CardHeader>
                <CardTitle>Todas as Propostas</CardTitle>
              </CardHeader>
              <CardContent>
                <ProposalManagement userId={user.id} userType="admin" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <Button onClick={loadUsersFromSupabase} variant="outline" size="sm" disabled={loading}>
                    {loading ? "Carregando..." : "Atualizar Lista"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {u.fullName
                              ? u.fullName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                              : "??"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{u.fullName || "Nome não informado"}</p>
                          <p className="text-sm text-muted-foreground">{u.email}</p>
                          <p className="text-xs text-muted-foreground">CRECI: {u.creci || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={u.userType === "admin" ? "default" : "secondary"}>
                          {u.userType === "admin" ? "Admin" : "Parceiro"}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                        {u.id !== user.id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={loading}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">Nenhum usuário cadastrado ainda</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Analytics Avançado</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Taxa de Conversão</h3>
                    <div className="text-3xl font-bold text-blue-900">
                      {properties.length > 0 ? Math.round((proposals.length / properties.length) * 100) : 0}%
                    </div>
                    <p className="text-sm text-blue-700">Propostas por propriedade</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-green-800 mb-2">Tempo Médio de Aprovação</h3>
                    <div className="text-3xl font-bold text-green-900">2.3h</div>
                    <p className="text-sm text-green-700">Moderação de propriedades</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                    <h3 className="text-sm font-medium text-purple-800 mb-2">Engajamento</h3>
                    <div className="text-3xl font-bold text-purple-900">
                      {properties.length > 0 ? Math.round(totalViews / properties.length) : 0}
                    </div>
                    <p className="text-sm text-purple-700">Visualizações por propriedade</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Top Parceiros</h3>
                    <div className="space-y-3">
                      {partnerUsers.slice(0, 5).map((partner, index) => {
                        const partnerProperties = properties.filter((p) => p.userId === partner.id)
                        return (
                          <div key={partner.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{partner.fullName}</p>
                                <p className="text-xs text-gray-500">{partnerProperties.length} propriedades</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold">
                                {partnerProperties.filter((p) => p.status === "approved").length}
                              </p>
                              <p className="text-xs text-gray-500">aprovadas</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Propriedades por Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Aprovadas</span>
                        </div>
                        <span className="font-semibold">{approvedProperties.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Pendentes</span>
                        </div>
                        <span className="font-semibold">{pendingProperties.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">Rejeitadas</span>
                        </div>
                        <span className="font-semibold">
                          {properties.filter((p) => p.status === "rejected").length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="invites">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Gerenciar Códigos de Convite</h2>
                    <p className="text-sm text-gray-600">Crie e gerencie códigos de acesso para novos usuários</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => generateInviteCode("partner")} className="bg-blue-600 hover:bg-blue-700">
                      + Código Parceiro
                    </Button>
                    <Button onClick={() => generateInviteCode("admin")} variant="outline">
                      + Código Admin
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {inviteCodes.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invite.type === "admin" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {invite.type === "admin" ? "Admin" : "Parceiro"}
                        </div>
                        <div>
                          <code className="text-lg font-mono font-semibold">{invite.code}</code>
                          <p className="text-sm text-gray-500">
                            Criado em {new Date(invite.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invite.used ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {invite.used ? "Usado" : "Ativo"}
                        </div>
                        {!invite.used && (
                          <Button variant="outline" size="sm" onClick={() => deactivateInviteCode(invite.id)}>
                            Desativar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="space-y-6">
              {/* Notifications */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Notificações Recentes</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border-l-4 ${
                          notification.type === "success"
                            ? "bg-green-50 border-green-500"
                            : notification.type === "warning"
                              ? "bg-yellow-50 border-yellow-500"
                              : "bg-blue-50 border-blue-500"
                        }`}
                      >
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <p className="text-center text-gray-500 py-8">Nenhuma notificação recente</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Logs */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Log de Atividades</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {activityLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{log.action}</span>
                            <span className="text-xs text-gray-500">por {log.user}</span>
                          </div>
                          <p className="text-sm text-gray-600">{log.details}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(log.timestamp).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    ))}
                    {activityLogs.length === 0 && (
                      <p className="text-center text-gray-500 py-8">Nenhuma atividade registrada</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurações da Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Códigos de Convite Ativos</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <code className="bg-muted px-2 py-1 rounded">ADMIN2024</code>
                        <span className="text-muted-foreground">Acesso Administrador</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-muted px-2 py-1 rounded">PARTNER2024</code>
                        <span className="text-muted-foreground">Acesso Parceiro</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="bg-muted px-2 py-1 rounded">CAPTADOR2024</code>
                        <span className="text-muted-foreground">Acesso Captador</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Configurações do Feed</h3>
                    <p className="text-sm text-muted-foreground">
                      Todas as propriedades são automaticamente visíveis para todos os parceiros no feed compartilhado.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <ContractManagement userType="admin" userId={user.id} />
          </TabsContent>

          <TabsContent value="ai-assistant">
            <Card>
              <CardHeader>
                <CardTitle>Assistente IA</CardTitle>
              </CardHeader>
              <CardContent>
                <AIAssistant />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card>
              <CardHeader>
                <CardTitle>Gerenciamento de Planos</CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ranking">
            <Card>
              <CardHeader>
                <CardTitle>Ranking Global de Corretores</CardTitle>
              </CardHeader>
              <CardContent>
                <RankingLeaderboard currentUserId={user.id} isAdmin={true} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="boost-admin">
            <Card>
              <CardHeader>
                <CardTitle>Administração de Boosts</CardTitle>
              </CardHeader>
              <CardContent>
                <BoostManager userId={user.id} isAdmin={true} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export { AdminDashboard }
