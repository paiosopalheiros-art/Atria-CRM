"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Calendar, User, Building2, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Contract {
  id: string
  property_id: string
  property_title: string
  captador_id: string
  captador_name: string
  parceiro_id: string
  parceiro_name: string
  property_value: number
  commission_total: number
  captador_percentage: number
  parceiro_percentage: number
  plataforma_percentage: number
  captador_amount: number
  parceiro_amount: number
  plataforma_amount: number
  terms: string
  status: "pending" | "signed" | "active" | "completed"
  created_at: string
  signed_at?: string
  property_origin: "platform" | "external"
}

interface ContractManagementProps {
  userType?: "admin" | "partner" | "captador"
  userId?: string
}

export function ContractManagement({ userType = "admin", userId }: ContractManagementProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContracts()
  }, [userType, userId])

  const fetchContracts = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching contracts for user type:", userType)

      let query = supabase.from("contracts").select("*")

      if (userType !== "admin" && userId) {
        query = query.or(`captador_id.eq.${userId},parceiro_id.eq.${userId}`)
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching contracts:", error)
        setContracts([])
      } else {
        console.log("[v0] Contracts fetched:", data?.length || 0)
        setContracts(data || [])
      }
    } catch (error) {
      console.error("[v0] Error in fetchContracts:", error)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadContract = (contract: Contract) => {
    const contractContent = `
CONTRATO DE COMISSÃO - ATRIA IMÓVEIS

Propriedade: ${contract.property_title}
Valor do Imóvel: R$ ${contract.property_value.toLocaleString("pt-BR")}
Comissão Total (5%): R$ ${contract.commission_total.toLocaleString("pt-BR")}

DIVISÃO DE COMISSÃO:
${contract.property_origin === "external" ? "Captador" : "Plataforma"}: ${contract.captador_percentage}% - R$ ${contract.captador_amount.toLocaleString("pt-BR")}
Parceiro Vendedor: ${contract.parceiro_percentage}% - R$ ${contract.parceiro_amount.toLocaleString("pt-BR")}
${contract.property_origin === "external" ? "Plataforma" : ""}: ${contract.plataforma_percentage > 0 ? `${contract.plataforma_percentage}% - R$ ${contract.plataforma_amount.toLocaleString("pt-BR")}` : ""}

Termos: ${contract.terms}

Data de Criação: ${new Date(contract.created_at).toLocaleDateString("pt-BR")}
${contract.signed_at ? `Data de Assinatura: ${new Date(contract.signed_at).toLocaleDateString("pt-BR")}` : ""}
Status: ${contract.status === "signed" ? "Assinado" : contract.status === "pending" ? "Pendente" : contract.status}
    `

    const blob = new Blob([contractContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `contrato-${contract.id}-${contract.property_title.replace(/\s+/g, "-").toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: Contract["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Pendente
          </Badge>
        )
      case "signed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Assinado
          </Badge>
        )
      case "active":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            Ativo
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="default" className="bg-purple-100 text-purple-800">
            Concluído
          </Badge>
        )
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Contratos de Comissão</h2>
                <p className="text-sm text-gray-600">Carregando contratos...</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Contratos de Comissão</h2>
              <p className="text-sm text-gray-600">
                {userType === "admin"
                  ? "Visualize e gerencie todos os contratos da plataforma"
                  : "Seus contratos de comissão"}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">{contracts.length} contratos</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {contracts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum contrato encontrado</h3>
                <p className="text-gray-500">
                  {userType === "admin" ? "Nenhum contrato foi criado ainda" : "Você não possui contratos no momento"}
                </p>
              </div>
            ) : (
              contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{contract.property_title}</h3>
                        {getStatusBadge(contract.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Criado em {new Date(contract.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                        {contract.signed_at && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>Assinado em {new Date(contract.signed_at).toLocaleDateString("pt-BR")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        R$ {contract.property_value.toLocaleString("pt-BR")}
                      </div>
                      <p className="text-sm text-gray-500">Valor do imóvel</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">
                          {contract.property_origin === "external" ? "Captador" : "Plataforma"}
                        </span>
                      </div>
                      <p className="text-lg font-semibold">{contract.captador_name}</p>
                      <p className="text-sm text-gray-600">
                        {contract.captador_percentage}% - R$ {contract.captador_amount.toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">Parceiro Vendedor</span>
                      </div>
                      <p className="text-lg font-semibold">{contract.parceiro_name}</p>
                      <p className="text-sm text-gray-600">
                        {contract.parceiro_percentage}% - R$ {contract.parceiro_amount.toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">Comissão Total</span>
                      </div>
                      <p className="text-lg font-semibold">R$ {contract.commission_total.toLocaleString("pt-BR")}</p>
                      <p className="text-sm text-gray-600">5% do valor do imóvel</p>
                    </div>
                  </div>

                  {contract.plataforma_percentage > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-800">Taxa da Plataforma</span>
                        <span className="text-sm font-semibold text-blue-900">
                          {contract.plataforma_percentage}% - R$ {contract.plataforma_amount.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleDownloadContract(contract)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download Contrato
                    </Button>
                    <Button variant="outline" className="px-6 gap-2 bg-transparent">
                      <Eye className="h-4 w-4" />
                      Visualizar Detalhes
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total de Contratos</span>
            </div>
            <div className="text-2xl font-bold">{contracts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Contratos Assinados</span>
            </div>
            <div className="text-2xl font-bold">{contracts.filter((c) => c.status === "signed").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pendentes</span>
            </div>
            <div className="text-2xl font-bold">{contracts.filter((c) => c.status === "pending").length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Valor Total</span>
            </div>
            <div className="text-lg font-bold">
              R$ {contracts.reduce((acc, c) => acc + c.commission_total, 0).toLocaleString("pt-BR")}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
