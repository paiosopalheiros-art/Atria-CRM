"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Star, Target, Award, Users, Calendar, CheckCircle, Crown, Medal, Flame } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Client {
  id: string
  full_name: string
  status: "lead" | "interested" | "negotiating" | "closed" | "lost"
  created_at: string
  user_id: string
}

interface GameStats {
  totalPoints: number
  level: number
  streak: number
  badges: BadgeInterface[]
  dailyGoals: DailyGoal[]
  weeklyGoals: WeeklyGoal[]
  achievements: Achievement[]
}

interface DailyGoal {
  id: string
  name: string
  description: string
  target: number
  current: number
  points: number
  completed: boolean
}

interface WeeklyGoal {
  id: string
  name: string
  description: string
  target: number
  current: number
  points: number
  completed: boolean
}

interface Achievement {
  id: string
  name: string
  description: string
  points: number
  unlockedAt: string
  category: "clients" | "followups" | "conversions" | "streak"
}

interface BadgeInterface {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: string
  rarity: "common" | "rare" | "epic" | "legendary"
}

function GamificationSystem({ userId }: { userId: string }) {
  const [gameStats, setGameStats] = useState<GameStats>({
    totalPoints: 0,
    level: 1,
    streak: 0,
    badges: [],
    dailyGoals: [],
    weeklyGoals: [],
    achievements: [],
  })
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGameStats()
    loadClients()
  }, [userId])

  useEffect(() => {
    if (clients.length > 0) {
      updateGameStats(clients)
    }
  }, [clients])

  const loadGameStats = async () => {
    try {
      const { data, error } = await supabase.from("user_game_stats").select("*").eq("user_id", userId).single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setGameStats(data.stats)
      } else {
        initializeGameStats()
      }
    } catch (error) {
      console.error("[v0] Error loading game stats:", error)
      initializeGameStats()
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, full_name, status, created_at, user_id")
        .eq("user_id", userId)

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("[v0] Error loading clients:", error)
    }
  }

  const initializeGameStats = () => {
    const initialStats: GameStats = {
      totalPoints: 0,
      level: 1,
      streak: 0,
      badges: [],
      dailyGoals: [
        {
          id: "daily-contacts",
          name: "Contatos Diários",
          description: "Fazer 5 contatos hoje",
          target: 5,
          current: 0,
          points: 50,
          completed: false,
        },
        {
          id: "daily-followups",
          name: "Follow-ups do Dia",
          description: "Completar 3 follow-ups hoje",
          target: 3,
          current: 0,
          points: 30,
          completed: false,
        },
        {
          id: "daily-new-client",
          name: "Novo Cliente",
          description: "Adicionar 1 novo cliente hoje",
          target: 1,
          current: 0,
          points: 100,
          completed: false,
        },
      ],
      weeklyGoals: [
        {
          id: "weekly-conversions",
          name: "Conversões da Semana",
          description: "Converter 2 leads em clientes",
          target: 2,
          current: 0,
          points: 500,
          completed: false,
        },
        {
          id: "weekly-hot-clients",
          name: "Clientes Interessados",
          description: "Ter 5 clientes interessados ativos",
          target: 5,
          current: 0,
          points: 300,
          completed: false,
        },
      ],
      achievements: [],
    }
    setGameStats(initialStats)
    saveGameStats(initialStats)
  }

  const saveGameStats = async (stats: GameStats) => {
    try {
      const { error } = await supabase.from("user_game_stats").upsert({
        user_id: userId,
        stats: stats,
      })

      if (error) throw error
    } catch (error) {
      console.error("[v0] Error saving game stats:", error)
    }
  }

  const updateGameStats = async (clientsData: Client[]) => {
    const today = new Date().toISOString().split("T")[0]

    // Calculate current progress
    const todayNewClients = clientsData.filter((c) => c.created_at.startsWith(today)).length
    const interestedClients = clientsData.filter((c) => c.status === "interested").length
    const closedClients = clientsData.filter((c) => c.status === "closed").length

    // Update daily goals
    const updatedDailyGoals = gameStats.dailyGoals.map((goal) => {
      switch (goal.id) {
        case "daily-new-client":
          return { ...goal, current: todayNewClients, completed: todayNewClients >= goal.target }
        default:
          return goal
      }
    })

    // Update weekly goals
    const updatedWeeklyGoals = gameStats.weeklyGoals.map((goal) => {
      switch (goal.id) {
        case "weekly-conversions":
          return { ...goal, current: closedClients, completed: closedClients >= goal.target }
        case "weekly-hot-clients":
          return { ...goal, current: interestedClients, completed: interestedClients >= goal.target }
        default:
          return goal
      }
    })

    // Calculate total points
    const completedDailyPoints = updatedDailyGoals.filter((g) => g.completed).reduce((sum, g) => sum + g.points, 0)
    const completedWeeklyPoints = updatedWeeklyGoals.filter((g) => g.completed).reduce((sum, g) => sum + g.points, 0)
    const totalPoints = completedDailyPoints + completedWeeklyPoints + clientsData.length * 10

    // Calculate level
    const level = Math.floor(totalPoints / 1000) + 1

    // Check for new badges and achievements
    const newBadges = checkForNewBadges(clientsData, gameStats.badges)
    const newAchievements = checkForNewAchievements(clientsData, gameStats.achievements)

    const updatedStats: GameStats = {
      ...gameStats,
      totalPoints,
      level,
      dailyGoals: updatedDailyGoals,
      weeklyGoals: updatedWeeklyGoals,
      badges: [...gameStats.badges, ...newBadges],
      achievements: [...gameStats.achievements, ...newAchievements],
    }

    setGameStats(updatedStats)
    saveGameStats(updatedStats)
  }

  const checkForNewBadges = (clientsData: Client[], currentBadges: BadgeInterface[]): BadgeInterface[] => {
    const newBadges: BadgeInterface[] = []
    const badgeIds = currentBadges.map((b) => b.id)

    // First Client Badge
    if (clientsData.length >= 1 && !badgeIds.includes("first-client")) {
      newBadges.push({
        id: "first-client",
        name: "Primeiro Cliente",
        description: "Adicionou seu primeiro cliente",
        icon: "users",
        unlockedAt: new Date().toISOString(),
        rarity: "common",
      })
    }

    // Client Collector Badge
    if (clientsData.length >= 10 && !badgeIds.includes("client-collector")) {
      newBadges.push({
        id: "client-collector",
        name: "Colecionador de Clientes",
        description: "Cadastrou 10 clientes",
        icon: "trophy",
        unlockedAt: new Date().toISOString(),
        rarity: "rare",
      })
    }

    // Interested Streak Badge
    const interestedClients = clientsData.filter((c) => c.status === "interested")
    if (interestedClients.length >= 5 && !badgeIds.includes("interested-streak")) {
      newBadges.push({
        id: "interested-streak",
        name: "Sequência de Interessados",
        description: "5 clientes interessados simultâneos",
        icon: "flame",
        unlockedAt: new Date().toISOString(),
        rarity: "epic",
      })
    }

    // Closer Badge
    const closedClients = clientsData.filter((c) => c.status === "closed")
    if (closedClients.length >= 3 && !badgeIds.includes("closer")) {
      newBadges.push({
        id: "closer",
        name: "Fechador",
        description: "Fechou 3 negócios",
        icon: "award",
        unlockedAt: new Date().toISOString(),
        rarity: "legendary",
      })
    }

    return newBadges
  }

  const checkForNewAchievements = (clientsData: Client[], currentAchievements: Achievement[]): Achievement[] => {
    const newAchievements: Achievement[] = []
    const achievementIds = currentAchievements.map((a) => a.id)

    if (clientsData.length >= 5 && !achievementIds.includes("growing-network")) {
      newAchievements.push({
        id: "growing-network",
        name: "Rede em Crescimento",
        description: "Cadastrou 5 clientes",
        points: 200,
        unlockedAt: new Date().toISOString(),
        category: "clients",
      })
    }

    return newAchievements
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "bg-gray-500"
      case "rare":
        return "bg-blue-500"
      case "epic":
        return "bg-purple-500"
      case "legendary":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      users: Users,
      trophy: Trophy,
      flame: Flame,
      award: Award,
      star: Star,
      crown: Crown,
      medal: Medal,
    }
    const IconComponent = icons[iconName] || Trophy
    return <IconComponent className="h-6 w-6" />
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando gamificação...</div>
  }

  return (
    <div className="space-y-6">
      {/* Player Stats Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Seu Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{gameStats.totalPoints}</div>
              <p className="text-sm text-muted-foreground">Pontos Totais</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">Nível {gameStats.level}</div>
              <p className="text-sm text-muted-foreground">Nível Atual</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">{gameStats.streak}</div>
              <p className="text-sm text-muted-foreground">Sequência</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{gameStats.badges.length}</div>
              <p className="text-sm text-muted-foreground">Badges</p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso para Nível {gameStats.level + 1}</span>
              <span>{gameStats.totalPoints % 1000}/1000</span>
            </div>
            <Progress value={(gameStats.totalPoints % 1000) / 10} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
        </TabsList>

        <TabsContent value="goals">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Metas Diárias
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameStats.dailyGoals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{goal.name}</h4>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={goal.completed ? "default" : "secondary"}>{goal.points} pts</Badge>
                        {goal.completed && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                    <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {goal.current}/{goal.target}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Weekly Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Metas Semanais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameStats.weeklyGoals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{goal.name}</h4>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={goal.completed ? "default" : "secondary"}>{goal.points} pts</Badge>
                        {goal.completed && <CheckCircle className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                    <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {goal.current}/{goal.target}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Medal className="h-5 w-5" />
                Suas Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameStats.badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {gameStats.badges.map((badge) => (
                    <div key={badge.id} className="p-4 border rounded-lg text-center">
                      <div
                        className={`w-16 h-16 rounded-full ${getRarityColor(badge.rarity)} flex items-center justify-center mx-auto mb-3 text-white`}
                      >
                        {getIconComponent(badge.icon)}
                      </div>
                      <h4 className="font-medium">{badge.name}</h4>
                      <p className="text-sm text-muted-foreground">{badge.description}</p>
                      <Badge variant="outline" className="mt-2">
                        {badge.rarity}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma badge desbloqueada ainda. Continue trabalhando para ganhar suas primeiras conquistas!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gameStats.achievements.length > 0 ? (
                <div className="space-y-4">
                  {gameStats.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Desbloqueado em {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="default">+{achievement.points} pts</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma conquista desbloqueada ainda. Continue usando o CRM para desbloquear conquistas!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { GamificationSystem }
export default GamificationSystem
