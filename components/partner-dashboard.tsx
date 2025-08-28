"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsTrigger, TabsList } from "@/components/ui/tabs"
import {
  Building2,
  LogOut,
  Plus,
  TrendingUp,
  Eye,
  MessageSquare,
  Bell,
  Home,
  Calendar,
  Target,
  BarChart3,
  Clock,
  Award,
  Filter,
} from "lucide-react"
import { PropertyUploadDialog, type Property } from "./property-upload-dialog"
import { PropertyFeed } from "./property-feed"
import { ProposalManagement } from "./proposal-management"
import { NotificationsModal } from "./notifications-modal"
import { UserSettingsModal } from "./user-settings-modal"
import AIAssistant from "./ai-assistant"
import GamificationSystem from "./gamification-system"
import CommissionManager from "./commission-manager"
import BrokerProfile from "./broker-profile"
import RankingLeaderboard from "./ranking-leaderboard"
import BoostManager from "./boost-manager"
import ClientManagementEnhanced from "./client-management-enhanced"
import type { User } from "@/app/page"
import type { Proposal } from "./property-proposal-form"
import { supabase } from "@/lib/supabase/client"

interface PartnerDashboardProps {
  user: User
  onLogout: () => void
}

interface PartnerStats {
  totalProperties: number
  capturedProperties: number
  saleProperties: number
  activeProperties: number
  totalViews: number
  totalProposals: number
  pendingProposals: number
  soldProperties: number
  monthlyGoal: number
  currentMonthSales: number
  conversionRate: number
  averageResponseTime: number
}

interface Activity {
  id: string
  type: "property_added" | "proposal_received" | "property_sold" | "client_visit"
  message: string
  timestamp: string
  propertyId?: string
}

interface CommissionRepayment {
  id: string
  propertyId: string
  propertyTitle: string
  saleValue: number
  commissionPercentage: number
  totalCommission: number
  atriaShare: number
  captadorShare: number
  status: "pending" | "paid" | "overdue"
  dueDate: string
  paidDate?: string
  saleDate: string
}

interface PropertyStatusUpdate {
  propertyId: string
  newStatus: "available" | "negotiating" | "sold"
  saleValue?: number
  saleDate?: string
  buyerInfo?: string
}

function PartnerDashboard({ user, onLogout }: PartnerDashboardProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [propertyFilter, setPropertyFilter] = useState<"all" | "captured" | "sale">("all")
  const [stats, setStats] = useState<PartnerStats>({
    totalProperties: 0,
    capturedProperties: 0,
    saleProperties: 0,
    activeProperties: 0,
    totalViews: 0,
    totalProposals: 0,
    pendingProposals: 0,
    soldProperties: 0,
    monthlyGoal: 5,
    currentMonthSales: 0,
    conversionRate: 0,
    averageResponseTime: 0,
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [repayments, setRepayments] = useState<CommissionRepayment[]>([])
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true)

        console.log("[v0] Attempting to fetch data from Supabase...")

        let formattedProperties: Property[] = []
        try {
          // Get user's agency_id from user_profiles table
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("agency_id")
            .eq("user_id", user.id)
            .single()

          const agencyId = userProfile?.agency_id

          if (agencyId) {
            const { data: propertiesData, error: propertiesError } = await supabase
              .from("properties")
              .select("*")
              .eq("agency_id", agencyId)

            if (propertiesError) {
              console.log("[v0] Properties table error:", propertiesError)
            } else {
              formattedProperties =
                propertiesData?.map((p) => ({
                  id: p.id,
                  title: p.title,
                  description: p.description,
                  price: p.price_sale || p.price_rent || 0,
                  type: p.type || "house",
                  bedrooms: p.rooms || 0,
                  bathrooms: p.bathrooms || 1,
                  area: p.area_total || 0,
                  lotArea: p.area_land || 0,
                  address: p.address,
                  city: p.city,
                  state: p.state,
                  zipCode: p.zip_code,
                  images: [],
                  features: [],
                  status: p.status,
                  approvalStatus: "approved",
                  userId: user.id,
                  userType: user.userType,
                  source: p.source || "sale",
                  createdAt: p.created_at,
                  updatedAt: p.updated_at,
                  views: 0,
                })) || []
            }
          }
        } catch (error) {
          console.log("[v0] Error fetching properties:", error)
        }

        setProperties(formattedProperties)

        let formattedProposals: Proposal[] = []
        if (formattedProperties.length > 0) {
          try {
            const propertyIds = formattedProperties.map((p) => p.id)
            const { data: proposalsData, error: proposalsError } = await supabase
              .from("proposals")
              .select("*")
              .in("property_id", propertyIds)

            if (proposalsError) {
              console.log("[v0] Proposals table error:", proposalsError)
            } else {
              formattedProposals =
                proposalsData?.map((p) => ({
                  id: p.id,
                  propertyId: p.property_id,
                  clientName: p.client_name,
                  clientEmail: p.client_email,
                  clientPhone: p.client_phone,
                  interestType: "buy",
                  message: p.message,
                  proposedPrice: p.proposed_price,
                  status: p.status,
                  createdAt: p.created_at,
                  responses: [],
                })) || []
            }
          } catch (error) {
            console.log("[v0] Error fetching proposals:", error)
          }
        }

        setProposals(formattedProposals)

        let formattedActivities: Activity[] = []
        try {
          const { data: activitiesData, error: activitiesError } = await supabase
            .from("activity_logs")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10)

          if (activitiesError) {
            console.log("[v0] Activity logs table error:", activitiesError)
          } else if (activitiesData) {
            formattedActivities = activitiesData.map((a) => ({
              id: a.id,
              type: a.action as any,
              message: a.description,
              timestamp: a.created_at,
              propertyId: undefined,
            }))
          }
        } catch (error) {
          console.log("[v0] Error fetching activities:", error)
        }

        setActivities(formattedActivities)

        const capturedProperties = formattedProperties.filter((p) => p.source === "captured")
        const saleProperties = formattedProperties.filter((p) => p.source === "sale")

        setStats((prevStats) => ({
          ...prevStats,
          totalProperties: formattedProperties.length,
          capturedProperties: capturedProperties.length,
          saleProperties: saleProperties.length,
          activeProperties: formattedProperties.filter((p) => p.status === "available").length,
          soldProperties: formattedProperties.filter((p) => p.status === "sold").length,
          totalProposals: formattedProposals.length,
          pendingProposals: formattedProposals.filter((p) => p.status === "pending").length,
          totalViews: formattedProperties.reduce((sum, p) => sum + (p.views || 0), 0),
          conversionRate:
            formattedProposals.length > 0
              ? (formattedProposals.filter((p) => p.status === "accepted").length / formattedProposals.length) * 100
              : 0,
        }))

        console.log("[v0] Successfully loaded data:", {
          properties: formattedProperties.length,
          captured: capturedProperties.length,
          sale: saleProperties.length,
          proposals: formattedProposals.length,
          activities: formattedActivities.length,
        })
      } catch (error) {
        console.error("[v0] Error in fetchRealData:", error)
        setProperties([])
        setProposals([])
        setActivities([])
        setStats((prevStats) => ({
          ...prevStats,
          totalProperties: 0,
          capturedProperties: 0,
          saleProperties: 0,
          activeProperties: 0,
          soldProperties: 0,
          totalProposals: 0,
          pendingProposals: 0,
          totalViews: 0,
          conversionRate: 0,
        }))
      } finally {
        setLoading(false)
      }
    }

    fetchRealData()
  }, [user.id])

  const saveProperties = (updatedProperties: Property[]) => {
    setProperties(updatedProperties)
    localStorage.setItem("atria-properties", JSON.stringify(updatedProperties))
  }

  const addProperty = (propertyData: Omit<Property, "id" | "createdAt">, source: "captured" | "sale" = "sale") => {
    const newProperty: Property = {
      ...propertyData,
      id: Date.now().toString(),
      source,
      createdAt: new Date().toISOString(),
      views: 0,
    }
    const updatedProperties = [...properties, newProperty]
    saveProperties(updatedProperties)

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: "property_added",
      message: `Nova propriedade ${source === "captured" ? "captada" : "cadastrada"}: ${newProperty.title}`,
      timestamp: new Date().toISOString(),
      propertyId: newProperty.id,
    }
    const updatedActivities = [newActivity, ...activities].slice(0, 10)
    setActivities(updatedActivities)
    localStorage.setItem(`atria-partner-activities-${user.id}`, JSON.stringify(updatedActivities))
  }

  const handleShareProperty = (property: Property) => {
    const shareUrl = `${window.location.origin}/properties/${property.id}`
    navigator.clipboard.writeText(shareUrl)
    alert("Link copiado para a área de transferência!")
  }

  const myProperties = properties.filter((p) => p.userId === user.id)

  const filteredProperties = myProperties.filter((p) => {
    if (propertyFilter === "captured") return p.source === "captured"
    if (propertyFilter === "sale") return p.source === "sale"
    return true // "all"
  })

  const goalProgress = (stats.currentMonthSales / stats.monthlyGoal) * 100

  const getUserInitials = (fullName: string | undefined) => {
    if (!fullName) return "U"
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  const getDashboardTitle = () => {
    return "Parceiro"
  }

  const getDashboardDescription = () => {
    return "Capture e venda propriedades em uma única plataforma"
  }

  const handleUpdateUser = (updatedUser: User) => {
    const savedUsers = localStorage.getItem("atria-users")
    if (savedUsers) {
      const users = JSON.parse(savedUsers)
      const updatedUsers = users.map((u: User) => (u.id === updatedUser.id ? updatedUser : u))
      localStorage.setItem("atria-users", JSON.stringify(updatedUsers))
    }
  }

  const showAllActivities = () => {
    alert("Funcionalidade de histórico completo será implementada em breve!")
  }

  const updatePropertyStatus = (update: PropertyStatusUpdate) => {
    const updatedProperties = properties.map((p) => {
      if (p.id === update.propertyId) {
        const updatedProperty = {
          ...p,
          status: update.newStatus,
          ...(update.saleValue && { saleValue: update.saleValue }),
          ...(update.saleDate && { soldDate: update.saleDate }),
          ...(update.buyerInfo && { buyerInfo: update.buyerInfo }),
        }

        if (update.newStatus === "sold" && update.saleValue) {
          const commissionPercentage = 5 // 5% fixed commission
          const totalCommission = (update.saleValue * commissionPercentage) / 100
          const atriaShare = p.source === "captured" ? totalCommission * 0.2 : totalCommission * 0.5 // 20% for captador properties, 50% for platform properties
          const captadorShare = totalCommission - atriaShare

          const newRepayment: CommissionRepayment = {
            id: Date.now().toString(),
            propertyId: p.id,
            propertyTitle: p.title,
            saleValue: update.saleValue,
            commissionPercentage,
            totalCommission,
            atriaShare,
            captadorShare,
            status: "pending",
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            saleDate: update.saleDate || new Date().toISOString(),
          }

          const updatedRepayments = [...repayments, newRepayment]
          setRepayments(updatedRepayments)
          localStorage.setItem(`atria-repayments-${user.id}`, JSON.stringify(updatedRepayments))
        }

        return updatedProperty
      }
      return p
    })

    saveProperties(updatedProperties)
    setIsStatusDialogOpen(false)
    setSelectedProperty(null)

    const newActivity: Activity = {
      id: Date.now().toString(),
      type: update.newStatus === "sold" ? "property_sold" : "property_added",
      message: `Status atualizado: ${properties.find((p) => p.id === update.propertyId)?.title} - ${
        update.newStatus === "available"
          ? "Disponível"
          : update.newStatus === "negotiating"
            ? "Em Negociação"
            : "Vendido"
      }`,
      timestamp: new Date().toISOString(),
      propertyId: update.propertyId,
    }
    const updatedActivities = [newActivity, ...activities].slice(0, 10)
    setActivities(updatedActivities)
    localStorage.setItem(`atria-partner-activities-${user.id}`, JSON.stringify(updatedActivities))
  }

  const processRepayment = (repaymentId: string) => {
    const updatedRepayments = repayments.map((r) => {
      if (r.id === repaymentId) {
        return {
          ...r,
          status: "paid" as const,
          paidDate: new Date().toISOString(),
        }
      }
      return r
    })
    setRepayments(updatedRepayments)
    localStorage.setItem(`atria-repayments-${user.id}`, JSON.stringify(updatedRepayments))

    alert(
      `Repasse de R$ ${repayments.find((r) => r.id === repaymentId)?.atriaShare.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} processado com sucesso!`,
    )
  }

  const pendingRepayments = repayments.filter((r) => r.status === "pending")
  const overdueRepayments = repayments.filter((r) => r.status === "pending" && new Date(r.dueDate) < new Date())
  const totalPendingAmount = pendingRepayments.reduce((sum, r) => sum + r.atriaShare, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  <Home className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Atria</h1>
                  <p className="text-sm text-gray-600">Dashboard do Parceiro</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {stats.pendingProposals > 0 && (
                <div className="relative">
                  <div
                    className="p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                    onClick={() => setIsNotificationsOpen(true)}
                  >
                    <Bell className="h-5 w-5 text-gray-600" />
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">{stats.pendingProposals}</span>
                    </div>
                  </div>
                </div>
              )}

              <div
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
                onClick={() => setIsSettingsOpen(true)}
              >
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user.fullName || user.name || "Usuário"}</p>
                  <p className="text-xs text-gray-500">Parceiro • CRECI: {user.creci || "N/A"}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {getUserInitials(user.fullName || user.name)}
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
        {loading && (
          <div className="flex justify-center items-center min-h-screen">
            <p className="text-gray-600">Carregando...</p>
          </div>
        )}

        {!loading && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Bem-vindo, {user.fullName || user.name || "Usuário"}!
              </h2>
              <p className="text-gray-600">Capture e venda propriedades em uma única plataforma</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Meta: {stats.monthlyGoal}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalProperties}</p>
                  <p className="text-sm font-medium text-gray-700">Total Propriedades</p>
                  <p className="text-xs text-gray-500">
                    {stats.capturedProperties} captadas • {stats.saleProperties} à venda
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600">+12% este mês</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalViews}</p>
                  <p className="text-sm font-medium text-gray-700">Visualizações</p>
                  <p className="text-xs text-gray-500">
                    Média: {stats.totalProperties > 0 ? Math.round(stats.totalViews / stats.totalProperties) : 0} por
                    propriedade
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-purple-600">{stats.conversionRate.toFixed(1)}% conversão</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalProposals}</p>
                  <p className="text-sm font-medium text-gray-700">Propostas</p>
                  <p className="text-xs text-gray-500">{stats.pendingProposals} pendentes</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <Target className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-emerald-600">{goalProgress.toFixed(0)}% da meta</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-gray-900">{stats.currentMonthSales}</p>
                  <p className="text-sm font-medium text-gray-700">Vendas do Mês</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(goalProgress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Atividades Recentes</h3>
                    <p className="text-sm text-gray-600">Suas últimas ações na plataforma</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={showAllActivities}>
                    <Clock className="h-4 w-4" />
                    Ver Todas
                  </Button>
                </div>
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-full ${
                          activity.type === "property_added"
                            ? "bg-blue-50"
                            : activity.type === "proposal_received"
                              ? "bg-purple-50"
                              : activity.type === "property_sold"
                                ? "bg-green-50"
                                : "bg-orange-50"
                        }`}
                      >
                        {activity.type === "property_added" && <Building2 className="h-4 w-4 text-blue-600" />}
                        {activity.type === "proposal_received" && <MessageSquare className="h-4 w-4 text-purple-600" />}
                        {activity.type === "property_sold" && <TrendingUp className="h-4 w-4 text-green-600" />}
                        {activity.type === "client_visit" && <Calendar className="h-4 w-4 text-orange-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                    <p className="text-sm text-gray-600">Métricas do mês</p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded-xl">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Taxa de Conversão</p>
                      <p className="text-xs text-gray-500">Propostas → Vendas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{stats.conversionRate.toFixed(1)}%</p>
                      <p className="text-xs text-green-600">+2.3% vs mês anterior</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Tempo de Resposta</p>
                      <p className="text-xs text-gray-500">Média para propostas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{stats.averageResponseTime}h</p>
                      <p className="text-xs text-blue-600">Excelente</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ranking</p>
                      <p className="text-xs text-gray-500">Entre parceiros</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">#3</p>
                      <p className="text-xs text-yellow-600">Top 10%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-8">
              <div className="flex items-center justify-between">
                <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto w-full justify-start">
                  <TabsTrigger
                    value="overview"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 relative bg-transparent rounded-none"
                  >
                    Visão Geral
                  </TabsTrigger>
                  <TabsTrigger
                    value="properties"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
                  >
                    Propriedades
                  </TabsTrigger>
                  <TabsTrigger
                    value="proposals"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
                  >
                    Propostas
                  </TabsTrigger>
                  <TabsTrigger
                    value="clients"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
                  >
                    Clientes
                  </TabsTrigger>
                  <TabsTrigger
                    value="commissions"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
                  >
                    Comissões
                  </TabsTrigger>
                  <TabsTrigger
                    value="ai-assistant"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
                  >
                    Assistente IA
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="gamification"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
                  >
                    Gamificação
                  </TabsTrigger>
                  <TabsTrigger
                    value="profile"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
                  >
                    Meu Perfil
                  </TabsTrigger>
                  <TabsTrigger
                    value="ranking"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
                  >
                    <Award className="h-4 w-4 mr-2" />
                    Ranking
                  </TabsTrigger>
                  <TabsTrigger
                    value="boost"
                    className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 bg-transparent rounded-none"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Boost
                  </TabsTrigger>
                </TabsList>

                <Button
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Nova Propriedade
                </Button>
              </div>

              <TabsContent value="overview" className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Visão Geral</h2>
                    <p className="text-sm text-gray-600">Resumo das suas atividades</p>
                  </div>
                  <div className="p-6">{/* Overview content here */}</div>
                </div>
              </TabsContent>

              <TabsContent value="properties" className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Propriedades</h2>
                        <p className="text-sm text-gray-600">Gerencie suas propriedades captadas e à venda</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-gray-500" />
                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setPropertyFilter("all")}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                              propertyFilter === "all"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            Todas ({stats.totalProperties})
                          </button>
                          <button
                            onClick={() => setPropertyFilter("captured")}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                              propertyFilter === "captured"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            Captadas ({stats.capturedProperties})
                          </button>
                          <button
                            onClick={() => setPropertyFilter("sale")}
                            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                              propertyFilter === "sale"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            À Venda ({stats.saleProperties})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <PropertyFeed
                      properties={properties.filter((p) => p.approvalStatus === "approved")}
                      currentUserId={user.id}
                      onShareProperty={handleShareProperty}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="proposals" className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Gerenciar Propostas</h2>
                    <p className="text-sm text-gray-600">Propostas recebidas nas suas propriedades</p>
                  </div>
                  <div className="p-6">
                    <ProposalManagement userId={user.id} userType="partner" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="clients" className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <ClientManagementEnhanced currentUserId={user.id} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="commissions" className="space-y-6">
                <CommissionManager />
              </TabsContent>

              <TabsContent value="ai-assistant" className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Assistente IA</h2>
                    <p className="text-sm text-gray-600">Obtenha assistência com IA para suas tarefas</p>
                  </div>
                  <div className="p-6">
                    <AIAssistant />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas por Mês</h3>
                    <div className="space-y-4">
                      {[
                        { month: "Jan", sales: 2, goal: 5 },
                        { month: "Fev", sales: 3, goal: 5 },
                        { month: "Mar", sales: 4, goal: 5 },
                        { month: "Abr", sales: stats.currentMonthSales, goal: stats.monthlyGoal },
                      ].map((data, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-12 text-sm font-medium text-gray-600">{data.month}</div>
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                              style={{ width: `${(data.sales / data.goal) * 100}%` }}
                            />
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {data.sales}/{data.goal}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos de Propriedade</h3>
                    <div className="space-y-3">
                      {[
                        {
                          type: "Apartamentos",
                          count: myProperties.filter((p) => p.type === "apartment").length,
                          color: "bg-blue-500",
                        },
                        {
                          type: "Casas",
                          count: myProperties.filter((p) => p.type === "house").length,
                          color: "bg-green-500",
                        },
                        {
                          type: "Comerciais",
                          count: myProperties.filter((p) => p.type === "commercial").length,
                          color: "bg-purple-500",
                        },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`} />
                            <span className="text-sm font-medium text-gray-700">{item.type}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="gamification" className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Sistema de Gamificação</h2>
                    <p className="text-sm text-gray-600">Acompanhe seu progresso, metas e conquistas</p>
                  </div>
                  <div className="p-6">
                    <GamificationSystem userId={user.id} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="profile" className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Meu Perfil</h2>
                    <p className="text-sm text-gray-600">Métricas detalhadas e histórico de performance</p>
                  </div>
                  <div className="p-6">
                    <BrokerProfile userId={user.id} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ranking" className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Ranking de Corretores</h2>
                    <p className="text-sm text-gray-600">Veja sua posição no ranking e compete com outros corretores</p>
                  </div>
                  <div className="p-6">
                    <RankingLeaderboard currentUserId={user.id} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="boost" className="space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Boost de Propriedades</h2>
                    <p className="text-sm text-gray-600">Destaque suas propriedades no feed para maior visibilidade</p>
                  </div>
                  <div className="p-6">
                    <BoostManager userId={user.id} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <PropertyUploadDialog
              open={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
              onAddProperty={(propertyData) => addProperty(propertyData, "sale")} // Default to sale, can be changed in dialog
              userId={user.id}
              userName={user.fullName || user.name || "Usuário"}
            />

            <NotificationsModal open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen} userId={user.id} />

            <UserSettingsModal
              open={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
              user={user}
              onUpdateUser={handleUpdateUser}
            />

            {isStatusDialogOpen && selectedProperty && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Atualizar Status - {selectedProperty.title}
                  </h2>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      const newStatus = formData.get("status") as "available" | "negotiating" | "sold"
                      const saleValue = formData.get("saleValue") ? Number(formData.get("saleValue")) : undefined
                      const buyerInfo = formData.get("buyerInfo") as string

                      updatePropertyStatus({
                        propertyId: selectedProperty.id,
                        newStatus,
                        saleValue,
                        saleDate: newStatus === "sold" ? new Date().toISOString() : undefined,
                        buyerInfo: newStatus === "sold" ? buyerInfo : undefined,
                      })
                    }}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Novo Status</label>
                        <select
                          name="status"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          defaultValue={selectedProperty.status}
                        >
                          <option value="available">Disponível</option>
                          <option value="negotiating">Em Negociação</option>
                          <option value="sold">Vendido</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Valor da Venda (se vendido)
                        </label>
                        <input
                          type="number"
                          name="saleValue"
                          placeholder="R$ 0,00"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Informações do Comprador (se vendido)
                        </label>
                        <input
                          type="text"
                          name="buyerInfo"
                          placeholder="Nome do comprador"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsStatusDialogOpen(false)
                          setSelectedProperty(null)
                        }}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                        Atualizar
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export { PartnerDashboard }
export default PartnerDashboard
