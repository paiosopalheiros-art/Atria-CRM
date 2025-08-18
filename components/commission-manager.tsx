"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { DollarSign, TrendingUp, Clock, CheckCircle } from "lucide-react"

interface Commission {
  id: string
  property_id: string
  sale_price: number
  captador_id: string
  vendedor_id: string
  platform_commission: number
  captador_commission: number
  vendedor_commission: number
  status: "pending" | "paid" | "cancelled"
  created_at: string
  paid_at?: string
  property?: {
    title: string
    address: string
  }
}

interface CommissionStats {
  total_earned: number
  pending_amount: number
  paid_amount: number
  total_commissions: number
}

export default function CommissionManager() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<CommissionStats>({
    total_earned: 0,
    pending_amount: 0,
    paid_amount: 0,
    total_commissions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadCommissions()
  }, [])

  const loadCommissions = async () => {
    try {
      setLoading(true)

      // Buscar usuário atual
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Buscar comissões do usuário
      const { data: commissionsData, error } = await supabase
        .from("commissions")
        .select(`
          *,
          property:properties(title, address)
        `)
        .or(`captador_id.eq.${user.id},vendedor_id.eq.${user.id}`)
        .order("created_at", { ascending: false })

      if (error) throw error

      const userCommissions = commissionsData || []
      setCommissions(userCommissions)

      // Calcular estatísticas
      const stats = userCommissions.reduce(
        (acc, comm) => {
          // Determinar quanto o usuário recebe desta comissão
          let userAmount = 0
          if (comm.captador_id === user.id) {
            userAmount += comm.captador_commission
          }
          if (comm.vendedor_id === user.id) {
            userAmount += comm.vendedor_commission
          }

          acc.total_earned += userAmount
          if (comm.status === "pending") {
            acc.pending_amount += userAmount
          } else if (comm.status === "paid") {
            acc.paid_amount += userAmount
          }
          acc.total_commissions++

          return acc
        },
        {
          total_earned: 0,
          pending_amount: 0,
          paid_amount: 0,
          total_commissions: 0,
        },
      )

      setStats(stats)
    } catch (error) {
      console.error("Erro ao carregar comissões:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, label: "Pendente" },
      paid: { variant: "default" as const, label: "Pago" },
      cancelled: { variant: "destructive" as const, label: "Cancelado" },
    }

    const config = variants[status as keyof typeof variants] || variants.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando comissões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com regra de comissão */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sistema de Comissões</h2>
        <p className="text-gray-600 mb-4">
          Regra: <strong>20% Plataforma</strong> • <strong>30% Captador</strong> • <strong>50% Vendedor</strong>
        </p>
        <p className="text-sm text-gray-500">
          Quando você capta e vende o mesmo imóvel, recebe 80% da comissão total (30% + 50%)
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Ganho</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(stats.total_earned)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Pendente</p>
                <p className="text-lg font-semibold text-yellow-600">{formatCurrency(stats.pending_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Pago</p>
                <p className="text-lg font-semibold text-blue-600">{formatCurrency(stats.paid_amount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Comissões</p>
                <p className="text-lg font-semibold text-purple-600">{stats.total_commissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de comissões */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comissões</CardTitle>
          <CardDescription>Suas comissões de captação e vendas</CardDescription>
        </CardHeader>
        <CardContent>
          {commissions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhuma comissão encontrada</p>
              <p className="text-sm text-gray-500">
                Suas comissões aparecerão aqui quando você captar ou vender imóveis
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => {
                // Calcular quanto o usuário recebe
                let userAmount = 0
                let userRole = ""

                if (commission.captador_id === commission.vendedor_id) {
                  userAmount = commission.captador_commission // 80% quando capta e vende
                  userRole = "Captador + Vendedor"
                } else {
                  if (commission.captador_id) {
                    userAmount += commission.captador_commission // 30%
                    userRole = "Captador"
                  }
                  if (commission.vendedor_id) {
                    userAmount += commission.vendedor_commission // 50%
                    userRole = userRole ? "Captador + Vendedor" : "Vendedor"
                  }
                }

                return (
                  <div key={commission.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{commission.property?.title || "Propriedade"}</h4>
                        <p className="text-sm text-gray-600">{commission.property?.address}</p>
                      </div>
                      {getStatusBadge(commission.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Valor da Venda</p>
                        <p className="font-medium">{formatCurrency(commission.sale_price)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Sua Função</p>
                        <p className="font-medium">{userRole}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Sua Comissão</p>
                        <p className="font-medium text-green-600">{formatCurrency(userAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Data</p>
                        <p className="font-medium">{new Date(commission.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
