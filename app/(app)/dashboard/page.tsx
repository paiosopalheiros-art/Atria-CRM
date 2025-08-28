"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  Building2, 
  TrendingUp, 
  Users, 
  MapPin, 
  DollarSign,
  Calendar,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"

interface DashboardStats {
  totalProperties: number
  atriaProperties: number
  creciProperties: number
  activeListings: number
  totalViews: number
  avgPrice: number
  newThisWeek: number
  soldThisMonth: number
}

interface RecentActivity {
  id: string
  type: 'new_listing' | 'sold' | 'price_update' | 'inquiry'
  title: string
  description: string
  timestamp: string
  value?: string
}

// Mock PropertyFeed component since we don't have access to the original
const PropertyFeed = () => {
  const [properties, setProperties] = useState([
    {
      id: '1',
      title: 'Apartamento 3 quartos - Copacabana',
      price: 'R$ 850.000',
      location: 'Copacabana, Rio de Janeiro',
      type: 'Apartamento',
      bedrooms: 3,
      bathrooms: 2,
      area: '95m²',
      source: 'atria'
    },
    {
      id: '2',
      title: 'Casa 4 quartos - Barra da Tijuca',
      price: 'R$ 1.200.000',
      location: 'Barra da Tijuca, Rio de Janeiro',
      type: 'Casa',
      bedrooms: 4,
      bathrooms: 3,
      area: '180m²',
      source: 'creci'
    },
    {
      id: '3',
      title: 'Apartamento 2 quartos - Ipanema',
      price: 'R$ 1.100.000',
      location: 'Ipanema, Rio de Janeiro',
      type: 'Apartamento',
      bedrooms: 2,
      bathrooms: 2,
      area: '80m²',
      source: 'atria'
    }
  ])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Imóveis Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {properties.map((property) => (
            <div key={property.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{property.title}</h4>
                  <Badge variant={property.source === 'atria' ? 'default' : 'secondary'} className="text-xs">
                    {property.source === 'atria' ? 'Átria' : 'CRECI'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {property.location}
                  </span>
                  <span>{property.bedrooms} quartos</span>
                  <span>{property.area}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-lg">{property.price}</div>
                <div className="text-sm text-muted-foreground">{property.type}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  // Mock function to load dashboard data
  const loadDashboardData = async () => {
    setLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockStats: DashboardStats = {
      totalProperties: Math.floor(Math.random() * 500) + 300,
      atriaProperties: Math.floor(Math.random() * 200) + 150,
      creciProperties: Math.floor(Math.random() * 300) + 150,
      activeListings: Math.floor(Math.random() * 400) + 250,
      totalViews: Math.floor(Math.random() * 10000) + 5000,
      avgPrice: Math.floor(Math.random() * 500000) + 600000,
      newThisWeek: Math.floor(Math.random() * 20) + 5,
      soldThisMonth: Math.floor(Math.random() * 30) + 15
    }

    const mockActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'new_listing',
        title: 'Nova propriedade adicionada',
        description: 'Apartamento 3 quartos em Copacabana',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        value: 'R$ 850.000'
      },
      {
        id: '2',
        type: 'sold',
        title: 'Propriedade vendida',
        description: 'Casa 4 quartos na Barra da Tijuca',
        timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
        value: 'R$ 1.200.000'
      },
      {
        id: '3',
        type: 'inquiry',
        title: 'Nova consulta recebida',
        description: 'Interesse em apartamento no Leblon',
        timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString()
      },
      {
        id: '4',
        type: 'price_update',
        title: 'Preço atualizado',
        description: 'Apartamento 2 quartos em Ipanema',
        timestamp: new Date(Date.now() - 6 * 60 * 60000).toISOString(),
        value: 'R$ 1.100.000'
      }
    ]

    setStats(mockStats)
    setRecentActivity(mockActivity)
    setLoading(false)
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const activityDate = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Agora há pouco"
    if (diffInMinutes < 60) return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''} atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`
    
    return "Há mais de 1 dia"
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'new_listing': return <Home className="h-4 w-4 text-green-600" />
      case 'sold': return <DollarSign className="h-4 w-4 text-blue-600" />
      case 'inquiry': return <Users className="h-4 w-4 text-purple-600" />
      case 'price_update': return <TrendingUp className="h-4 w-4 text-orange-600" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral dos imóveis e atividades da plataforma</p>
          </div>
          <Button 
            onClick={loadDashboardData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Imóveis
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold">{stats ? formatNumber(stats.totalProperties) : '--'}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              ) : (
                <>+{stats?.newThisWeek} esta semana</>
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Átria Imóveis
            </CardTitle>
            <Home className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-emerald-600">
                {stats ? formatNumber(stats.atriaProperties) : '--'}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                Interno
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              CRECI
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ) : (
              <div className="text-2xl font-bold text-blue-600">
                {stats ? formatNumber(stats.creciProperties) : '--'}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                Externo
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">Preço Médio</div>
                <div className="font-semibold">
                  {loading ? '--' : stats ? formatCurrency(stats.avgPrice) : '--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-sm text-muted-foreground">Visualizações</div>
                <div className="font-semibold">
                  {loading ? '--' : stats ? formatNumber(stats.totalViews) : '--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-sm text-muted-foreground">Ativos</div>
                <div className="font-semibold">
                  {loading ? '--' : stats ? formatNumber(stats.activeListings) : '--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-muted-foreground">Vendidos</div>
                <div className="font-semibold">
                  {loading ? '--' : stats ? formatNumber(stats.soldThisMonth) : '--'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Property Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                    <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{activity.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {activity.value && (
                        <div className="text-sm font-medium">{activity.value}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {getTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <PropertyFeed />
      </div>
    </div>
  )
}
