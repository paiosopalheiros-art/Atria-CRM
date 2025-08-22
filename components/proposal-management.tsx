"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Send, Phone, Mail, User, Filter } from "lucide-react"
import type { Proposal } from "./property-proposal-form"
import { supabase } from "@/lib/supabase/client"

interface ProposalManagementProps {
  userId: string
  userType: "admin" | "partner"
}

interface ProposalMessage {
  id: string
  proposalId: string
  senderId: string
  senderName: string
  senderType: "client" | "agent"
  message: string
  createdAt: string
}

export function ProposalManagement({ userId, userType }: ProposalManagementProps) {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [messages, setMessages] = useState<ProposalMessage[]>([])
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProposalsFromSupabase()
    loadMessagesFromSupabase()
    loadCurrentUser()
  }, [userId, userType])

  const loadCurrentUser = async () => {
    try {
      const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle()

      if (error) {
        console.error("[v0] Error loading current user:", error.message)
        return
      }

      if (!data) {
        console.log("[v0] No user profile found, using fallback data")
        setCurrentUser({
          user_id: userId,
          full_name: "Usuário",
          user_type: userType,
        })
        return
      }

      setCurrentUser(data)
    } catch (error) {
      console.error("[v0] Error loading current user:", error)
    }
  }

  const loadProposalsFromSupabase = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from("proposals")
        .select(`
          *,
          properties (
            title
          )
        `)
        .order("created_at", { ascending: false })

      if (userType === "partner") {
        const { data: userProfile } = await supabase
          .from("user_profiles")
          .select("agency_id")
          .eq("user_id", userId)
          .maybeSingle()

        if (userProfile?.agency_id) {
          const { data: agencyProperties } = await supabase
            .from("properties")
            .select("id")
            .eq("agency_id", userProfile.agency_id)

          const propertyIds = agencyProperties?.map((p) => p.id) || []
          if (propertyIds.length > 0) {
            query = query.in("property_id", propertyIds)
          } else {
            setProposals([])
            setLoading(false)
            return
          }
        } else {
          setProposals([])
          setLoading(false)
          return
        }
      }

      const { data, error } = await query

      if (error) {
        console.error("[v0] Error loading proposals:", error.message)
        return
      }

      const formattedProposals: Proposal[] = (data || []).map((proposal: any) => ({
        id: proposal.id,
        propertyId: proposal.property_id,
        propertyTitle: proposal.properties?.title || "Propriedade",
        clientName: proposal.client_name,
        clientEmail: proposal.client_email,
        clientPhone: proposal.client_phone,
        proposalType: proposal.proposal_type,
        proposedValue: proposal.proposed_value,
        message: proposal.message,
        financing: proposal.financing || false,
        visitRequested: proposal.visit_requested || false,
        createdAt: proposal.created_at,
        status: proposal.status,
      }))

      setProposals(formattedProposals)
    } catch (error) {
      console.error("[v0] Error loading proposals:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessagesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("proposal_messages")
        .select("*")
        .order("created_at", { ascending: true })

      if (error) {
        // Check if the error is due to missing table
        if (error.message.includes("Could not find the table") || error.message.includes("schema cache")) {
          console.log("[v0] proposal_messages table not found, using empty messages array")
          setMessages([])
          return
        }
        console.error("[v0] Error loading messages:", error)
        return
      }

      const formattedMessages: ProposalMessage[] = (data || []).map((message: any) => ({
        id: message.id,
        proposalId: message.proposal_id,
        senderId: message.sender_id,
        senderName: message.sender_name,
        senderType: message.sender_type,
        message: message.message,
        createdAt: message.created_at,
      }))

      setMessages(formattedMessages)
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
      setMessages([])
    }
  }

  const filteredProposals = proposals.filter((proposal) => {
    if (filterStatus === "all") return true
    return proposal.status === filterStatus
  })

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      negotiating: "bg-blue-100 text-blue-800 border-blue-200",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendente",
      accepted: "Aceita",
      rejected: "Rejeitada",
      negotiating: "Negociando",
    }
    return labels[status as keyof typeof labels] || status
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      accepted: CheckCircle,
      rejected: XCircle,
      negotiating: AlertCircle,
    }
    const Icon = icons[status as keyof typeof icons] || Clock
    return <Icon className="h-4 w-4" />
  }

  const getProposalTypeLabel = (type: string) => {
    const types = {
      purchase: "Compra",
      rent: "Aluguel",
      information: "Informações",
    }
    return types[type as keyof typeof types] || type
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const updateProposalStatus = async (proposalId: string, newStatus: Proposal["status"]) => {
    try {
      const { error } = await supabase.from("proposals").update({ status: newStatus }).eq("id", proposalId)

      if (error) {
        console.error("[v0] Error updating proposal status:", error)
        alert("Erro ao atualizar status da proposta")
        return
      }

      const updatedProposals = proposals.map((p) => (p.id === proposalId ? { ...p, status: newStatus } : p))
      setProposals(updatedProposals)
    } catch (error) {
      console.error("[v0] Error updating proposal status:", error)
      alert("Erro interno ao atualizar status da proposta")
    }
  }

  const sendMessage = async (proposalId: string) => {
    if (!newMessage.trim()) return

    try {
      const messageData = {
        proposal_id: proposalId,
        sender_id: userId,
        sender_name: currentUser?.full_name || "Corretor",
        sender_type: "agent",
        message: newMessage,
      }

      const { data, error } = await supabase.from("proposal_messages").insert([messageData]).select().single()

      if (error) {
        // Check if the error is due to missing table
        if (error.message.includes("Could not find the table") || error.message.includes("schema cache")) {
          alert("Sistema de mensagens ainda não está disponível. Execute o script SQL para ativar esta funcionalidade.")
          return
        }
        console.error("[v0] Error sending message:", error)
        alert("Erro ao enviar mensagem")
        return
      }

      const formattedMessage: ProposalMessage = {
        id: data.id,
        proposalId: data.proposal_id,
        senderId: data.sender_id,
        senderName: data.sender_name,
        senderType: data.sender_type,
        message: data.message,
        createdAt: data.created_at,
      }

      setMessages([...messages, formattedMessage])
      setNewMessage("")
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      alert("Erro interno ao enviar mensagem")
    }
  }

  const getProposalMessages = (proposalId: string) => {
    return messages.filter((m) => m.proposalId === proposalId)
  }

  const pendingCount = proposals.filter((p) => p.status === "pending").length
  const negotiatingCount = proposals.filter((p) => p.status === "negotiating").length

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando propostas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{pendingCount}</div>
                <div className="text-sm text-gray-500">Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <AlertCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{negotiatingCount}</div>
                <div className="text-sm text-gray-500">Negociando</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {proposals.filter((p) => p.status === "accepted").length}
                </div>
                <div className="text-sm text-gray-500">Aceitas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{proposals.length}</div>
                <div className="text-sm text-gray-500">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                loadProposalsFromSupabase()
                loadMessagesFromSupabase()
              }}
              className="ml-auto"
            >
              Atualizar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="negotiating">Negociando</SelectItem>
                <SelectItem value="accepted">Aceitas</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Proposals List */}
      <div className="space-y-4">
        {filteredProposals.map((proposal) => (
          <Card key={proposal.id} className="hover:shadow-md transition-shadow border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">{proposal.propertyTitle}</h3>
                    <Badge className={`${getStatusColor(proposal.status)} border`}>
                      {getStatusIcon(proposal.status)}
                      <span className="ml-1">{getStatusLabel(proposal.status)}</span>
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{proposal.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{proposal.clientEmail}</span>
                    </div>
                    {proposal.clientPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{proposal.clientPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    {new Date(proposal.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium mb-1 text-gray-700">Tipo de Interesse</div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {getProposalTypeLabel(proposal.proposalType)}
                  </Badge>
                </div>
                {proposal.proposedValue && (
                  <div>
                    <div className="text-sm font-medium mb-1 text-gray-700">Valor Proposto</div>
                    <div className="text-lg font-semibold text-blue-600">{formatPrice(proposal.proposedValue)}</div>
                  </div>
                )}
              </div>

              {proposal.message && (
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2 text-gray-700">Mensagem do Cliente</div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    {proposal.message}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4 text-sm">
                {proposal.financing && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    💰 Precisa de financiamento
                  </Badge>
                )}
                {proposal.visitRequested && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    🏠 Quer agendar visita
                  </Badge>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {proposal.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateProposalStatus(proposal.id, "accepted")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProposalStatus(proposal.id, "negotiating")}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                      >
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Negociar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProposalStatus(proposal.id, "rejected")}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                  {proposal.status === "negotiating" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => updateProposalStatus(proposal.id, "accepted")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateProposalStatus(proposal.id, "rejected")}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedProposal(proposal)}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Chat ({getProposalMessages(proposal.id).length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>Conversa com {proposal.clientName}</DialogTitle>
                      <DialogDescription>Proposta para: {proposal.propertyTitle}</DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col h-96">
                      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        {getProposalMessages(proposal.id).map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.senderType === "agent" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-xs px-4 py-2 rounded-lg ${
                                message.senderType === "agent"
                                  ? "bg-blue-600 text-white"
                                  : "bg-white border border-gray-200 text-gray-900"
                              }`}
                            >
                              <div className="text-sm">{message.message}</div>
                              <div
                                className={`text-xs mt-1 ${
                                  message.senderType === "agent" ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {new Date(message.createdAt).toLocaleString("pt-BR")}
                              </div>
                            </div>
                          </div>
                        ))}
                        {getProposalMessages(proposal.id).length === 0 && (
                          <div className="text-center text-gray-500 py-8">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p>Nenhuma mensagem ainda.</p>
                            <p className="text-sm">Inicie a conversa com o cliente!</p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Input
                          placeholder="Digite sua mensagem..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && sendMessage(proposal.id)}
                          className="flex-1"
                        />
                        <Button onClick={() => sendMessage(proposal.id)} className="bg-blue-600 hover:bg-blue-700">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProposals.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2 text-gray-900">Nenhuma proposta encontrada</h3>
              <p className="text-sm text-gray-500">
                {proposals.length === 0
                  ? "Quando clientes enviarem propostas, elas aparecerão aqui."
                  : "Tente ajustar os filtros para ver outras propostas."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
