"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Phone, Mail, MapPin, Calendar, MessageSquare, TrendingUp } from "lucide-react"
import type { Client } from "@/app/page"
import { ClientDetailDialog } from "./client-detail-dialog"

interface ClientListProps {
  clients: Client[]
  onUpdateClient: (client: Client) => void
}

export function ClientList({ clients, onUpdateClient }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || client.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "hot":
        return "bg-red-100 text-red-800 border-red-200"
      case "warm":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "cold":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "closed":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "hot":
        return "Quente"
      case "warm":
        return "Morno"
      case "cold":
        return "Frio"
      case "closed":
        return "Fechado"
      default:
        return status
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="hot">Quente</SelectItem>
            <SelectItem value="warm">Morno</SelectItem>
            <SelectItem value="cold">Frio</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client Cards */}
      <div className="grid gap-4">
        {filteredClients.map((client) => (
          <Card
            key={client.id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedClient(client)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{client.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(client.status)}>{getStatusLabel(client.status)}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {client.score}%
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{client.location}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Orçamento:</span> {formatCurrency(client.budget)}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Tipo:</span> {client.propertyType}
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Origem:</span> {client.source}
                  </div>
                </div>
              </div>

              {client.nextFollowUp && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  <Calendar className="h-4 w-4" />
                  <span>Próximo follow-up: {new Date(client.nextFollowUp).toLocaleDateString("pt-BR")}</span>
                </div>
              )}

              {client.notes && (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  {client.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum cliente encontrado</p>
          </CardContent>
        </Card>
      )}

      {selectedClient && (
        <ClientDetailDialog
          client={selectedClient}
          open={!!selectedClient}
          onOpenChange={() => setSelectedClient(null)}
          onUpdateClient={onUpdateClient}
        />
      )}
    </div>
  )
}
