"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { Zap, Star, Crown, TrendingUp, DollarSign } from "lucide-react"

interface BoostType {
  id: string
  name: string
  description: string
  multiplier: number
  price: number
  duration_days: number
  color: string
  icon: string
}

interface PropertyBoost {
  id: string
  property_id: string
  boost_type: BoostType
  started_at: string
  expires_at: string
  is_active: boolean
  payment_status: string
  property: {
    title: string
    price_sale: number
  }
}

interface Property {
  id: string
  title: string
  price_sale: number
  boost_score: number
  has_active_boost: boolean
  boost_name?: string
  boost_color?: string
  boost_expires_at?: string
}

const iconMap = {
  Zap: Zap,
  Star: Star,
  Crown: Crown,
}

export default function BoostManager() {
  const [boostTypes, setBoostTypes] = useState<BoostType[]>([])
  const [activeBoosts, setActiveBoosts] = useState<PropertyBoost[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalSpent: 0,
    activeBoosts: 0,
    totalViews: 0,
  })

  const supabase = createClient()

  useEffect(() => {
    loadBoostTypes()
    loadActiveBoosts()
    loadProperties()
    loadStats()
  }, [])

  const loadBoostTypes = async () => {
    try {
      const { data, error } = await supabase.from("boost_types").select("*").order("price")

      if (error) throw error
      setBoostTypes(data || [])
    } catch (error) {
      console.error("Error loading boost types:", error)
    }
  }

  const loadActiveBoosts = async () => {
    try {
      const { data, error } = await supabase
        .from("property_boosts")
        .select(`
          *,
          boost_type:boost_types(*),
          property:properties(title, price_sale)
        `)
        .eq("is_active", true)
        .gte("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })

      if (error) throw error
      setActiveBoosts(data || [])
    } catch (error) {
      console.error("Error loading active boosts:", error)
    }
  }

  const loadProperties = async () => {
    try {
      const { data, error } = await supabase
        .from("properties_with_boost")
        .select("*")
        .order("boost_score", { ascending: false })
        .limit(20)

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error("Error loading properties:", error)
    }
  }

  const loadStats = async () => {
    try {
      // Calcular estatísticas dos boosts
      const { data: boosts } = await supabase
        .from("property_boosts")
        .select("boost_type:boost_types(price)")
        .eq("payment_status", "paid")

      const totalSpent = boosts?.reduce((sum, boost) => sum + (boost.boost_type?.price || 0), 0) || 0
      const activeBoostsCount = activeBoosts.length

      setStats({
        totalSpent,
        activeBoosts: activeBoostsCount,
        totalViews: Math.floor(totalSpent * 10), // Simulação baseada no gasto
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const handleBoostProperty = async (boostTypeId: string) => {
    if (!selectedProperty) return

    setLoading(true)
    try {
      const boostType = boostTypes.find((bt) => bt.id === boostTypeId)
      if (!boostType) return

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + boostType.duration_days)

      const { error } = await supabase.from("property_boosts").insert({
        property_id: selectedProperty,
        boost_type_id: boostTypeId,
        expires_at: expiresAt.toISOString(),
        payment_status: "paid", // Simulação - em produção seria 'pending'
      })

      if (error) throw error

      // Recarregar dados
      await Promise.all([loadActiveBoosts(), loadProperties(), loadStats()])
      setSelectedProperty("")
    } catch (error) {
      console.error("Error boosting property:", error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diffTime = expires.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getBoostIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Zap
    return IconComponent
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Investido</p>
                <p className="text-2xl font-bold">R$ {stats.totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Boosts Ativos</p>
                <p className="text-2xl font-bold">{stats.activeBoosts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visualizações Extra</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="boost" className="space-y-4">
        <TabsList>
          <TabsTrigger value="boost">Aplicar Boost</TabsTrigger>
          <TabsTrigger value="active">Boosts Ativos</TabsTrigger>
          <TabsTrigger value="ranking">Ranking com Boost</TabsTrigger>
        </TabsList>

        <TabsContent value="boost" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aplicar Boost em Imóvel</CardTitle>
              <CardDescription>Destaque seus imóveis no feed para aumentar visualizações e leads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seleção de Propriedade */}
              <div>
                <label className="text-sm font-medium">Selecionar Imóvel</label>
                <select
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="">Escolha um imóvel...</option>
                  {properties
                    .filter((p) => !p.has_active_boost)
                    .map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title} - R$ {property.price_sale?.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              {/* Tipos de Boost */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {boostTypes.map((boostType) => {
                  const IconComponent = getBoostIcon(boostType.icon)
                  return (
                    <Card key={boostType.id} className="relative overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="h-5 w-5" style={{ color: boostType.color }} />
                          <CardTitle className="text-lg">{boostType.name}</CardTitle>
                        </div>
                        <CardDescription>{boostType.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold" style={{ color: boostType.color }}>
                            R$ {boostType.price.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">{boostType.duration_days} dias</p>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Multiplicador:</span>
                            <span className="font-medium">{boostType.multiplier}x</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Duração:</span>
                            <span className="font-medium">{boostType.duration_days} dias</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleBoostProperty(boostType.id)}
                          disabled={!selectedProperty || loading}
                          className="w-full"
                          style={{ backgroundColor: boostType.color }}
                        >
                          {loading ? "Aplicando..." : "Aplicar Boost"}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Boosts Ativos</CardTitle>
              <CardDescription>Acompanhe o desempenho dos seus boosts ativos</CardDescription>
            </CardHeader>
            <CardContent>
              {activeBoosts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum boost ativo no momento</p>
              ) : (
                <div className="space-y-4">
                  {activeBoosts.map((boost) => {
                    const daysRemaining = getDaysRemaining(boost.expires_at)
                    const totalDays = boost.boost_type.duration_days
                    const progress = ((totalDays - daysRemaining) / totalDays) * 100
                    const IconComponent = getBoostIcon(boost.boost_type.icon)

                    return (
                      <Card key={boost.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <IconComponent className="h-5 w-5" style={{ color: boost.boost_type.color }} />
                              <div>
                                <h4 className="font-medium">{boost.property.title}</h4>
                                <p className="text-sm text-muted-foreground">Boost {boost.boost_type.name}</p>
                              </div>
                            </div>

                            <div className="text-right">
                              <Badge
                                variant="secondary"
                                style={{
                                  backgroundColor: `${boost.boost_type.color}20`,
                                  color: boost.boost_type.color,
                                }}
                              >
                                {daysRemaining} dias restantes
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progresso:</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ranking com Boost</CardTitle>
              <CardDescription>Veja como seus imóveis estão posicionados no feed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {properties.slice(0, 10).map((property, index) => (
                  <div
                    key={property.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      property.has_active_boost ? "bg-gradient-to-r from-blue-50 to-purple-50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index < 3 ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white" : "bg-gray-200"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div>
                        <h4 className="font-medium">{property.title}</h4>
                        <p className="text-sm text-muted-foreground">Score: {property.boost_score.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {property.has_active_boost && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: property.boost_color + "20",
                            color: property.boost_color,
                          }}
                        >
                          <Zap className="h-3 w-3 mr-1" />
                          {property.boost_name}
                        </Badge>
                      )}
                      <span className="font-medium">R$ {property.price_sale?.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
