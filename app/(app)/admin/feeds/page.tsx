"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Download, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function AdminFeedsPage() {
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<any>(null)

  const handleSyncCRECI = async () => {
    try {
      setSyncing(true)
      toast.info("Iniciando sincronização com CRECI...")

      const response = await fetch("/api/ats/creci")
      const result = await response.json()

      if (result.ok) {
        toast.success(`Sincronização concluída! ${result.upserted} imóveis atualizados.`)
        setLastSync(result)
      } else {
        toast.error(`Erro na sincronização: ${result.error}`)
      }
    } catch (error) {
      toast.error("Erro ao sincronizar com CRECI")
      console.error("Sync error:", error)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Feeds</h1>
        <p className="text-muted-foreground">Controle a sincronização de dados externos e internos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CRECI Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Feed CRECI
              </CardTitle>
              <Badge variant="secondary">Externo</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Ativo
              </Badge>
            </div>

            {lastSync && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Última sincronização</span>
                  <span className="text-sm">Agora há pouco</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Importados</span>
                  <span className="text-sm font-medium">{lastSync.fetched}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Atualizados</span>
                  <span className="text-sm font-medium">{lastSync.upserted}</span>
                </div>
              </div>
            )}

            <Button onClick={handleSyncCRECI} disabled={syncing} className="w-full">
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Átria Imóveis
              </CardTitle>
              <Badge>Interno</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Ativo
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total de imóveis</span>
                <span className="text-sm font-medium">--</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Ativos</span>
                <span className="text-sm font-medium">--</span>
              </div>
            </div>

            <Button variant="outline" className="w-full bg-transparent">
              Gerenciar Imóveis
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
