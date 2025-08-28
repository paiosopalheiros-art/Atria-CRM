"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Download, CheckCircle, Home, AlertCircle } from "lucide-react"

// Mock toast function since we can't import sonner in this environment
const toast = {
  info: (message: string) => console.log('INFO:', message),
  success: (message: string) => console.log('SUCCESS:', message),
  error: (message: string) => console.log('ERROR:', message)
}

interface SyncResult {
  ok: boolean
  fetched: number
  upserted: number
  error?: string
  timestamp: string
}

interface PropertyStats {
  total: number
  active: number
  inactive: number
}

export default function AdminFeedsPage() {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)
  const [propertyStats, setPropertyStats] = useState<PropertyStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  // Mock function to simulate CRECI sync
  const handleSyncCRECI = async () => {
    try {
      setSyncing(true)
      toast.info("Iniciando sincronização com CRECI...")

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Mock successful response
      const mockResult: SyncResult = {
        ok: true,
        fetched: Math.floor(Math.random() * 100) + 50,
        upserted: Math.floor(Math.random() * 30) + 10,
        timestamp: new Date().toISOString()
      }

      toast.success(`Sincronização concluída! ${mockResult.upserted} imóveis atualizados.`)
      setLastSync(mockResult)

      // Refresh property stats after sync
      loadPropertyStats()
    } catch (error) {
      toast.error("Erro ao sincronizar com CRECI")
      console.error("Sync error:", error)
    } finally {
      setSyncing(false)
    }
  }

  // Mock function to load property statistics
  const loadPropertyStats = async () => {
    try {
      setLoadingStats(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockStats: PropertyStats = {
        total: Math.floor(Math.random() * 500) + 200,
        active: Math.floor(Math.random() * 400) + 150,
        inactive: Math.floor(Math.random() * 50) + 10
      }
      
      setPropertyStats(mockStats)
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Load initial data
  useEffect(() => {
    loadPropertyStats()
  }, [])

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const syncDate = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Agora há pouco"
    if (diffInMinutes < 60) return `${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''} atrás`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hora${diffInHours > 1 ? 's' : ''} atrás`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} dia${diffInDays > 1 ? 's' : ''} atrás`
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Feeds</h1>
        <p className="text-muted-foreground">Controle a sincronização de dados externos e internos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CRECI Feed */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Feed CRECI
              </CardTitle>
              <Badge variant="secondary">Externo</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3" />
                Ativo
              </Badge>
            </div>

            {lastSync && (
              <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Última sincronização</span>
                  <span className="text-sm font-medium" title={formatDateTime(lastSync.timestamp)}>
                    {getTimeAgo(lastSync.timestamp)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{lastSync.fetched}</div>
                    <div className="text-xs text-muted-foreground">Importados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{lastSync.upserted}</div>
                    <div className="text-xs text-muted-foreground">Atualizados</div>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleSyncCRECI} 
              disabled={syncing} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {syncing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sincronizar Agora
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Átria Feed */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-emerald-600" />
                Átria Imóveis
              </CardTitle>
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Interno</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline" className="flex items-center gap-1 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3" />
                Ativo
              </Badge>
            </div>

            {loadingStats ? (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ) : propertyStats ? (
              <div className="space-y-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-lg font-bold text-gray-800">{propertyStats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-600">{propertyStats.active}</div>
                    <div className="text-xs text-muted-foreground">Ativos</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-amber-600">{propertyStats.inactive}</div>
                    <div className="text-xs text-muted-foreground">Inativos</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700">Erro ao carregar estatísticas</span>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full bg-transparent hover:bg-emerald-50 hover:border-emerald-300"
                onClick={() => toast.info("Navegando para gerenciar imóveis...")}
              >
                <Home className="h-4 w-4 mr-2" />
                Gerenciar Imóveis
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="w-full text-xs"
                onClick={loadPropertyStats}
                disabled={loadingStats}
              >
                {loadingStats ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Atualizar Estatísticas
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
