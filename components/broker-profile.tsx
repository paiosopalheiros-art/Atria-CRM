"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { User, Trophy, TrendingUp, Target, Award, Star, Building2, MessageSquare, BarChart3 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface BrokerProfileProps {
  userId: string
}

interface BrokerMetrics {
  totalProperties: number
  totalSales: number
  totalCommissions: number
  averageResponseTime: number
  conversionRate: number
  clientSatisfaction: number
  monthlyGoal: number
  currentMonthSales: number
  ranking: number
  level: number
  experience: number
  nextLevelExp: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
  unlockedAt: string
}

interface MonthlyGoal {
  id: string
  title: string
  target: number
  current: number
  deadline: string
  reward: string
}

const BrokerProfile = ({ userId }: BrokerProfileProps) => {
  const [metrics, setMetrics] = useState<BrokerMetrics>({
    totalProperties: 0,
    totalSales: 0,
    totalCommissions: 0,
    averageResponseTime: 0,
    conversionRate: 0,
    clientSatisfaction: 0,
    monthlyGoal: 5,
    currentMonthSales: 0,
    ranking: 0,
    level: 1,
    experience: 0,
    nextLevelExp: 1000,
  })

  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [monthlyGoals, setMonthlyGoals] = useState<MonthlyGoal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBrokerData()
  }, [userId])

  const loadBrokerData = async () => {
    try {
      setLoading(true)

      // Get user's agency_id
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("agency_id")
        .eq("user_id", userId)
        .single()

      const agencyId = userProfile?.agency_id

      if (agencyId) {
        // Load properties
        const { data: properties } = await supabase.from("properties").select("*").eq("agency_id", agencyId)

        // Load proposals
        const { data: proposals } = await supabase
          .from("proposals")
          .select("*")
          .in("property_id", properties?.map((p) => p.id) || [])

        // Calculate metrics
        const totalProperties = properties?.length || 0
        const totalSales = properties?.filter((p) => p.status === "sold").length || 0
        const totalProposals = proposals?.length || 0
        const acceptedProposals = proposals?.filter((p) => p.status === "accepted").length || 0

        const conversionRate = totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0
        const totalCommissions = totalSales * 50000 // Mock calculation

        // Calculate level and experience
        const experience = totalProperties * 100 + totalSales * 500 + acceptedProposals * 200
        const level = Math.floor(experience / 1000) + 1
        const nextLevelExp = level * 1000

        setMetrics({
          totalProperties,
          totalSales,
          totalCommissions,
          averageResponseTime: 2.5,
          conversionRate,
          clientSatisfaction: 4.8,
          monthlyGoal: 5,
          currentMonthSales: totalSales,
          ranking: Math.max(1, 10 - level),
          level,
          experience,
          nextLevelExp,
        })
      }

      // Load achievements (mock data based on metrics)
      const mockAchievements: Achievement[] = [
        {
          id: "1",
          title: "Primeira Propriedade",
          description: "Cadastrou sua primeira propriedade",
          icon: "🏠",
          rarity: "common",
          unlockedAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "Vendedor Estrela",
          description: "Realizou 5 vendas em um mês",
          icon: "⭐",
          rarity: "rare",
          unlockedAt: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Mestre das Negociações",
          description: "Taxa de conversão acima de 80%",
          icon: "🤝",
          rarity: "epic",
          unlockedAt: new Date().toISOString(),
        },
      ]

      setAchievements(mockAchievements)

      // Load monthly goals (mock data)
      const mockGoals: MonthlyGoal[] = [
        {
          id: "1",
          title: "Vendas do Mês",
          target: 5,
          current: metrics.currentMonthSales,
          deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
          reward: "R$ 1.000 bônus",
        },
        {
          id: "2",
          title: "Novas Propriedades",
          target: 10,
          current: Math.min(10, metrics.totalProperties),
          deadline: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
          reward: "Badge Especial",
        },
      ]

      setMonthlyGoals(mockGoals)
    } catch (error) {
      console.error("[v0] Error loading broker data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-100 text-gray-800 border-gray-300"
      case "rare":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "epic":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "legendary":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getLevelTitle = (level: number) => {
    if (level >= 10) return "Master Broker"
    if (level >= 8) return "Expert Broker"
    if (level >= 6) return "Senior Broker"
    if (level >= 4) return "Professional Broker"
    if (level >= 2) return "Junior Broker"
    return "Novice Broker"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Perfil do Corretor</h2>
              <p className="text-blue-100">
                Nível {metrics.level} - {getLevelTitle(metrics.level)}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Trophy className="h-4 w-4" />
                <span className="text-sm">Ranking #{metrics.ranking}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{metrics.experience}</div>
            <p className="text-blue-100">XP Total</p>
            <div className="w-32 bg-white/20 rounded-full h-2 mt-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(metrics.experience % 1000) / 10}%` }}
              />
            </div>
            <p className="text-xs text-blue-100 mt-1">{1000 - (metrics.experience % 1000)} XP para próximo nível</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalProperties}</p>
                <p className="text-sm text-gray-600">Propriedades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalSales}</p>
                <p className="text-sm text-gray-600">Vendas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.clientSatisfaction}</p>
                <p className="text-sm text-gray-600">Satisfação</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Metas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyGoals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{goal.title}</h4>
                  <span className="text-sm text-gray-600">
                    {goal.current}/{goal.target}
                  </span>
                </div>
                <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Recompensa: {goal.reward}</span>
                  <span className="text-gray-500">{new Date(goal.deadline).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Conquistas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{achievement.title}</h4>
                    <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>{achievement.rarity}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(achievement.unlockedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tempo de Resposta</span>
                <span className="text-sm text-gray-600">{metrics.averageResponseTime}h</span>
              </div>
              <Progress value={Math.max(0, 100 - metrics.averageResponseTime * 20)} className="h-2" />
              <p className="text-xs text-gray-500">Meta: &lt; 2h</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taxa de Conversão</span>
                <span className="text-sm text-gray-600">{metrics.conversionRate.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.conversionRate} className="h-2" />
              <p className="text-xs text-gray-500">Meta: &gt; 70%</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Satisfação do Cliente</span>
                <span className="text-sm text-gray-600">{metrics.clientSatisfaction}/5.0</span>
              </div>
              <Progress value={(metrics.clientSatisfaction / 5) * 100} className="h-2" />
              <p className="text-xs text-gray-500">Meta: &gt; 4.5</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Resumo da Performance</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Comissões Totais</p>
                <p className="font-semibold">R$ {metrics.totalCommissions.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-600">Média Mensal</p>
                <p className="font-semibold">{(metrics.totalSales / 12).toFixed(1)} vendas</p>
              </div>
              <div>
                <p className="text-gray-600">Melhor Mês</p>
                <p className="font-semibold">{Math.max(metrics.currentMonthSales, 3)} vendas</p>
              </div>
              <div>
                <p className="text-gray-600">Próxima Meta</p>
                <p className="font-semibold">Nível {metrics.level + 1}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default BrokerProfile
