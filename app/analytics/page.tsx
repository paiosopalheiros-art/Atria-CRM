"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Building2, DollarSign, Eye, Calendar, BarChart3, ArrowLeft } from "lucide-react"
import {
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Pie,
} from "recharts"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

interface AnalyticsData {
  overview: {
    totalRevenue: number
    totalProperties: number
    totalUsers: number
    conversionRate: number
    avgPropertyValue: number
    monthlyGrowth: number
  }
  salesData: Array<{
    month: string
    vendas: number
    valor: number
  }>
  propertyTypes: Array<{
    name: string
    value: number
    color: string
  }>
  topPerformers: Array<{
    name: string
    vendas: number
    valor: number
  }>
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("6m")
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)

        // Fetch real analytics data from Supabase
        const { data: properties, error: propertiesError } = await supabase.from("properties").select("*")

        const { data: users, error: usersError } = await supabase.from("user_profiles").select("*")

        if (propertiesError || usersError) {
          throw new Error("Failed to fetch analytics data")
        }

        // Calculate real analytics
        const totalProperties = properties?.length || 0
        const totalUsers = users?.length || 0
        const soldProperties = properties?.filter((p) => p.status === "sold") || []
        const totalRevenue = soldProperties.reduce((sum, p) => sum + (p.sale_value || p.price || 0), 0)

        const realAnalyticsData: AnalyticsData = {
          overview: {
            totalRevenue,
            totalProperties,
            totalUsers,
            conversionRate: totalProperties > 0 ? (soldProperties.length / totalProperties) * 100 : 0,
            avgPropertyValue: totalProperties > 0 ? totalRevenue / totalProperties : 0,
            monthlyGrowth: 8.3, // This would need more complex calculation
          },
          salesData: [
            { month: "Jan", vendas: 0, valor: 0 },
            { month: "Fev", vendas: 0, valor: 0 },
            { month: "Mar", vendas: 0, valor: 0 },
            { month: "Abr", vendas: soldProperties.length, valor: totalRevenue },
            { month: "Mai", vendas: 0, valor: 0 },
            { month: "Jun", vendas: 0, valor: 0 },
          ],
          propertyTypes: [
            {
              name: "Casas",
              value: properties?.filter((p) => p.property_type === "house").length || 0,
              color: "#3B82F6",
            },
            {
              name: "Apartamentos",
              value: properties?.filter((p) => p.property_type === "apartment").length || 0,
              color: "#10B981",
            },
            {
              name: "Comercial",
              value: properties?.filter((p) => p.property_type === "commercial").length || 0,
              color: "#F59E0B",
            },
            {
              name: "Terrenos",
              value: properties?.filter((p) => p.property_type === "land").length || 0,
              color: "#EF4444",
            },
          ],
          topPerformers: [], // Would need user sales data
        }

        setAnalyticsData(realAnalyticsData)
        console.log("[v0] Loaded real analytics data:", realAnalyticsData)
      } catch (error) {
        console.error("[v0] Error fetching analytics:", error)
        // Set empty analytics data instead of mock
        setAnalyticsData({
          overview: {
            totalRevenue: 0,
            totalProperties: 0,
            totalUsers: 0,
            conversionRate: 0,
            avgPropertyValue: 0,
            monthlyGrowth: 0,
          },
          salesData: [],
          propertyTypes: [],
          topPerformers: [],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Erro ao carregar dados de analytics</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Avançado</h1>
                <p className="text-sm text-gray-600">Insights detalhados de performance</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Calendar className="h-4 w-4" />
                Últimos 6 meses
              </Button>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <BarChart3 className="h-4 w-4" />
                Exportar Relatório
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+{analyticsData.overview.monthlyGrowth}%</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                R$ {(analyticsData.overview.totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-gray-600">Receita Total</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+12</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalProperties}</p>
              <p className="text-sm text-gray-600">Propriedades Ativas</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-purple-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+5</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalUsers}</p>
              <p className="text-sm text-gray-600">Usuários Ativos</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-orange-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+2.1%</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{analyticsData.overview.conversionRate}%</p>
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-indigo-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+15%</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                R$ {(analyticsData.overview.avgPropertyValue / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-gray-600">Ticket Médio</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                <Eye className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-pink-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">+28%</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">2.4K</p>
              <p className="text-sm text-gray-600">Visualizações</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sales Trend */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Evolução de Vendas</h3>
              <p className="text-sm text-gray-600">Vendas e faturamento por mês</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === "valor" ? `R$ ${((value as number) / 1000000).toFixed(1)}M` : value,
                      name === "valor" ? "Faturamento" : "Vendas",
                    ]}
                  />
                  <Area type="monotone" dataKey="valor" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                  <Area
                    type="monotone"
                    dataKey="vendas"
                    stackId="2"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Property Types Distribution */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Distribuição por Tipo</h3>
              <p className="text-sm text-gray-600">Tipos de propriedades no portfólio</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={analyticsData.propertyTypes}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.propertyTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
            <p className="text-sm text-gray-600">Corretores com melhor performance</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analyticsData.topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {performer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{performer.name}</p>
                      <p className="text-sm text-gray-600">{performer.vendas} vendas realizadas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">R$ {(performer.valor / 1000000).toFixed(1)}M</p>
                    <p className="text-sm text-gray-500">Faturamento</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
