"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, User, Phone, Mail, MapPin, Calendar, Clock, Star, TrendingUp, Users } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { Client, Visit } from "@/lib/types"

interface ClientManagementProps {
  userId: string
}

export function ClientManagement({ userId }: ClientManagementProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false)
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadClients()
    loadVisits()
  }, [userId])

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("[v0] Error loading clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadVisits = async () => {
    try {
      const { data, error } = await supabase
        .from("visits")
        .select("*")
        .eq("user_id", userId)
        .order("visit_date", { ascending: false })

      if (error) throw error
      setVisits(data || [])
    } catch (error) {
      console.error("[v0] Error loading visits:", error)
    }
  }

  const addClient = async (clientData: Omit<Client, "id" | "created_at" | "user_id">) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .insert([
          {
            ...clientData,
            user_id: userId,
          },
        ])
        .select()
        .single()

      if (error) throw error
      setClients((prev) => [data, ...prev])
    } catch (error) {
      console.error("[v0] Error adding client:", error)
    }
  }

  const addVisit = async (visitData: Omit<Visit, "id" | "created_at" | "user_id">) => {
    try {
      const { data, error } = await supabase
        .from("visits")
        .insert([
          {
            ...visitData,
            user_id: userId,
          },
        ])
        .select()
        .single()

      if (error) throw error
      setVisits((prev) => [data, ...prev])
    } catch (error) {
      console.error("[v0] Error adding visit:", error)
    }
  }

  const getStatusColor = (status: Client["status"]) => {
    switch (status) {
      case "lead":
        return "bg-gray-100 text-gray-800"
      case "interested":
        return "bg-blue-100 text-blue-800"
      case "negotiating":
        return "bg-yellow-100 text-yellow-800"
      case "closed":
        return "bg-green-100 text-green-800"
      case "lost":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status: Client["status"]) => {
    switch (status) {
      case "lead":
        return "Lead"
      case "interested":
        return "Interessado"
      case "negotiating":
        return "Negociando"
      case "closed":
        return "Fechado"
      case "lost":
        return "Perdido"
      default:
        return "Lead"
    }
  }

  const todayVisits = visits.filter((v) => {
    const visitDate = new Date(v.visit_date).toDateString()
    const today = new Date().toDateString()
    return visitDate === today
  })

  const upcomingVisits = visits.filter((v) => {
    const visitDate = new Date(v.visit_date)
    const today = new Date()
    return visitDate > today && v.status === "scheduled"
  })

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando clientes...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-50 rounded-xl">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-2xl font-semibold text-gray-900">{clients.length}</p>
              <p className="text-sm text-gray-600">Total de Clientes</p>
              <p className="text-xs text-gray-500">
                {clients.filter((c) => c.status === "interested").length} interessados
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-50 rounded-xl">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-2xl font-semibold text-gray-900">
                {clients.filter((c) => c.status === "negotiating").length}
              </p>
              <p className="text-sm text-gray-600">Em Negociação</p>
              <p className="text-xs text-gray-500">Oportunidades ativas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-50 rounded-xl">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-2xl font-semibold text-gray-900">{todayVisits.length}</p>
              <p className="text-sm text-gray-600">Visitas Hoje</p>
              <p className="text-xs text-gray-500">{upcomingVisits.length} agendadas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <Star className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-2xl font-semibold text-gray-900">
                {clients.filter((c) => c.status === "closed").length}
              </p>
              <p className="text-sm text-gray-600">Vendas Fechadas</p>
              <p className="text-xs text-gray-500">Este mês</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clients" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="visits">Visitas</TabsTrigger>
          </TabsList>

          <div className="flex gap-3">
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
                </DialogHeader>
                <ClientForm onSubmit={addClient} onClose={() => setIsClientDialogOpen(false)} />
              </DialogContent>
            </Dialog>

            <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Calendar className="h-4 w-4" />
                  Agendar Visita
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Agendar Nova Visita</DialogTitle>
                </DialogHeader>
                <VisitForm clients={clients} onSubmit={addVisit} onClose={() => setIsVisitDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4">
            {clients.map((client) => (
              <Card key={client.id} className="border-gray-200 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">{client.full_name}</h3>
                          <Badge className={getStatusColor(client.status)}>{getStatusLabel(client.status)}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {client.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {client.phone}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {client.preferred_location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {client.preferred_location}
                            </div>
                          )}
                          {client.budget && <span>Orçamento: {client.budget}</span>}
                        </div>
                        {client.notes && <p className="text-sm text-gray-600 mt-2">{client.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>Cadastrado em</p>
                      <p>{new Date(client.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          <div className="grid gap-4">
            {visits.map((visit) => {
              const client = clients.find((c) => c.id === visit.client_id)
              return (
                <Card key={visit.id} className="border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-gray-900">
                            {client?.full_name || "Cliente não encontrado"}
                          </h3>
                          <Badge
                            className={
                              visit.status === "scheduled"
                                ? "bg-blue-100 text-blue-800"
                                : visit.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : visit.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                            }
                          >
                            {visit.status === "scheduled"
                              ? "Agendada"
                              : visit.status === "completed"
                                ? "Realizada"
                                : visit.status === "cancelled"
                                  ? "Cancelada"
                                  : "Faltou"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(visit.visit_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {visit.visit_time}
                          </div>
                        </div>
                        {visit.notes && <p className="text-sm text-gray-600">{visit.notes}</p>}
                        {visit.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600">{visit.rating}/5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ClientForm({
  onSubmit,
  onClose,
}: {
  onSubmit: (data: Omit<Client, "id" | "created_at" | "user_id">) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    budget: "",
    property_type: "",
    preferred_location: "",
    notes: "",
    status: "lead" as Client["status"],
    source: "",
    last_contact: new Date().toISOString(),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome Completo *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip_code">CEP</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Orçamento</Label>
          <Select value={formData.budget} onValueChange={(value) => setFormData({ ...formData, budget: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o orçamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Até R$ 300.000">Até R$ 300.000</SelectItem>
              <SelectItem value="R$ 300.000 - R$ 500.000">R$ 300.000 - R$ 500.000</SelectItem>
              <SelectItem value="R$ 500.000 - R$ 800.000">R$ 500.000 - R$ 800.000</SelectItem>
              <SelectItem value="R$ 800.000 - R$ 1.200.000">R$ 800.000 - R$ 1.200.000</SelectItem>
              <SelectItem value="Acima de R$ 1.200.000">Acima de R$ 1.200.000</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="property_type">Tipo de Imóvel</Label>
          <Select
            value={formData.property_type}
            onValueChange={(value) => setFormData({ ...formData, property_type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Casa">Casa</SelectItem>
              <SelectItem value="Apartamento">Apartamento</SelectItem>
              <SelectItem value="Cobertura">Cobertura</SelectItem>
              <SelectItem value="Loft">Loft</SelectItem>
              <SelectItem value="Terreno">Terreno</SelectItem>
              <SelectItem value="Comercial">Comercial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="preferred_location">Localização Preferida</Label>
          <Input
            id="preferred_location"
            value={formData.preferred_location}
            onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Como nos conheceu?</Label>
          <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Google">Google</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="Indicação">Indicação</SelectItem>
              <SelectItem value="Site">Site</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value as Client["status"] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="interested">Interessado</SelectItem>
            <SelectItem value="negotiating">Negociando</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
            <SelectItem value="lost">Perdido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Cadastrar Cliente
        </Button>
      </div>
    </form>
  )
}

function VisitForm({
  clients,
  onSubmit,
  onClose,
}: {
  clients: Client[]
  onSubmit: (data: Omit<Visit, "id" | "created_at" | "user_id">) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState({
    client_id: "",
    property_id: "",
    visit_date: "",
    visit_time: "",
    status: "scheduled" as Visit["status"],
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="client_id">Cliente *</Label>
        <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="property_id">ID da Propriedade</Label>
        <Input
          id="property_id"
          value={formData.property_id}
          onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
          placeholder="ID da propriedade a ser visitada"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="visit_date">Data *</Label>
          <Input
            id="visit_date"
            type="date"
            value={formData.visit_date}
            onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="visit_time">Horário *</Label>
          <Input
            id="visit_time"
            type="time"
            value={formData.visit_time}
            onChange={(e) => setFormData({ ...formData, visit_time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
          Agendar Visita
        </Button>
      </div>
    </form>
  )
}
