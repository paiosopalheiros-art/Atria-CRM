"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Trophy, Medal, Award, Star, Crown } from "lucide-react"

interface RankingUser {
  user_id: string
  full_name: string
  avatar_url?: string
  total_points: number
  current_level: number
  properties_captured: number
  properties_sold: number
  total_commission: number
  client_satisfaction: number
  monthly_rank: number
  overall_rank: number
  badges_earned: string[]
  achievements: string[]
  agency_name: string
}

interface UserStats {
  total_points: number
  current_level: number
  level_progress: number
  monthly_rank: number
  overall_rank: number
  properties_captured: number
  properties_sold: number
  total_commission: number
}

const LEVEL_NAMES = {
  1: "Novato",
  2: "Iniciante",
  3: "Crescendo",
  4: "Desenvolvendo",
  5: "Intermediário",
  6: "Experiente",
  7: "Avançado",
  8: "Profissional",
  9: "Expert",
  10: "Master",
}

const LEVEL_COLORS = {
  1: "bg-gray-500",
  2: "bg-green-500",
  3: "bg-blue-500",
  4: "bg-purple-500",
  5: "bg-yellow-500",
  6: "bg-orange-500",
  7: "bg-red-500",
  8: "bg-pink-500",
  9: "bg-indigo-500",
  10: "bg-gradient-to-r from-yellow-400 to-orange-500",
}

export default function RankingLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<RankingUser[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("monthly")
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadLeaderboard()
    loadUserStats()
  }, [activeTab])

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from("leaderboard")
        .select("*")
        .order(activeTab === "monthly" ? "monthly_rank" : "overall_rank")
        .limit(50)

      if (error) throw error
      setLeaderboard(data || [])
    } catch (error) {
      console.error("Error loading leaderboard:", error)
    }
  }

  const loadUserStats = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase.from("user_rankings").select("*").eq("user_id", user.id).single()

      if (error && error.code !== "PGRST116") throw error
      setUserStats(data)
    } catch (error) {
      console.error("Error loading user stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Trophy className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Medal className="h-6 w-6 text-amber-600" />
    if (rank <= 10) return <Award className="h-5 w-5 text-blue-500" />
    return <span className="text-sm font-medium text-gray-500">#{rank}</span>
  }

  const getLevelBadge = (level: number) => {
    const levelName = LEVEL_NAMES[level as keyof typeof LEVEL_NAMES] || "Novato"
    const colorClass = LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || "bg-gray-500"

    return (
      <Badge className={`${colorClass} text-white font-medium`}>
        Nível {level} - {levelName}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Stats Card */}
      {userStats && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Seu Desempenho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{userStats.total_points}</div>
                <div className="text-sm text-gray-600">Pontos Totais</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">#{userStats.monthly_rank || "N/A"}</div>
                <div className="text-sm text-gray-600">Ranking Mensal</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.properties_sold}</div>
                <div className="text-sm text-gray-600">Vendas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{userStats.properties_captured}</div>
                <div className="text-sm text-gray-600">Captações</div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                {getLevelBadge(userStats.current_level)}
                <span className="text-sm text-gray-600">{userStats.level_progress.toFixed(1)}% para próximo nível</span>
              </div>
              <Progress value={userStats.level_progress} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking dos Corretores
          </CardTitle>
          <CardDescription>Competição entre os melhores corretores da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Ranking Mensal</TabsTrigger>
              <TabsTrigger value="overall">Ranking Geral</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-4">
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((user, index) => {
                  const rank = user.monthly_rank || index + 1
                  const isTopThree = rank <= 3

                  return (
                    <div
                      key={user.user_id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                        isTopThree
                          ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-center w-12">{getRankIcon(rank)}</div>

                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {user.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-600">{user.agency_name}</div>
                        <div className="mt-1">{getLevelBadge(user.current_level)}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">{user.total_points.toLocaleString()} pts</div>
                        <div className="text-sm text-gray-600">
                          {user.properties_sold} vendas • {user.properties_captured} captações
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          R$ {user.total_commission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="overall" className="space-y-4">
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((user, index) => {
                  const rank = user.overall_rank || index + 1
                  const isTopThree = rank <= 3

                  return (
                    <div
                      key={user.user_id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all hover:shadow-md ${
                        isTopThree
                          ? "bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-center w-12">{getRankIcon(rank)}</div>

                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback>
                          {user.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "U"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-600">{user.agency_name}</div>
                        <div className="mt-1">{getLevelBadge(user.current_level)}</div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-600">
                          {user.total_points.toLocaleString()} pts
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.properties_sold} vendas • {user.properties_captured} captações
                        </div>
                        <div className="text-sm text-green-600 font-medium">
                          R$ {user.total_commission.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Achievement Showcase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" />
            Hall da Fama
          </CardTitle>
          <CardDescription>Corretores que se destacaram este mês</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaderboard.slice(0, 3).map((user, index) => {
              const titles = ["👑 Rei das Vendas", "🥈 Vice-Campeão", "🥉 Terceiro Lugar"]
              const colors = [
                "from-yellow-400 to-orange-500",
                "from-gray-300 to-gray-500",
                "from-amber-400 to-amber-600",
              ]

              return (
                <div key={user.user_id} className={`p-4 rounded-lg bg-gradient-to-br ${colors[index]} text-white`}>
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-3 border-4 border-white">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-gray-800">
                        {user.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="font-bold text-lg">{user.full_name}</div>
                    <div className="text-sm opacity-90">{titles[index]}</div>
                    <div className="text-2xl font-bold mt-2">{user.total_points.toLocaleString()} pts</div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
