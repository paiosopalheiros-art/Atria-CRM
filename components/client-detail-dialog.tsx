"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, Mail, MapPin, Plus, MessageSquare } from "lucide-react"
import type { Client, Interaction } from "@/app/page"

interface ClientDetailDialogProps {
  client: Client
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdateClient: (client: Client) => void
}

export function ClientDetailDialog({ client, open, onOpenChange, onUpdateClient }: ClientDetailDialogProps) {
  const [editMode, setEditMode] = useState(false)
  const [editedClient, setEditedClient] = useState(client)
  const [newInteraction, setNewInteraction] = useState({
    type: "call" as Interaction["type"],
    notes: "",
    outcome: "neutral" as Interaction["outcome"],
  })

  const handleSave = () => {
    onUpdateClient(editedClient)
    setEditMode(false)
  }

  const addInteraction = () => {
    if (!newInteraction.notes.trim()) return

    const interaction: Interaction = {
      id: Date.now().toString(),
      type: newInteraction.type,
      date: new Date().toISOString(),
      notes: newInteraction.notes,
      outcome: newInteraction.outcome,
    }

    const updatedClient = {
      ...editedClient,
      interactions: [...editedClient.interactions, interaction],
      lastContact: new Date().toISOString().split("T")[0],
    }

    setEditedClient(updatedClient)
    onUpdateClient(updatedClient)

    setNewInteraction({
      type: "call",
      notes: "",
      outcome: "neutral",
    })
  }

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

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "call":
        return "📞"
      case "email":
        return "📧"
      case "meeting":
        return "🤝"
      case "whatsapp":
        return "💬"
      case "visit":
        return "🏠"
      default:
        return "📝"
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{client.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(client.status)}>
                {client.status === "hot"
                  ? "Quente"
                  : client.status === "warm"
                    ? "Morno"
                    : client.status === "cold"
                      ? "Frio"
                      : "Fechado"}
              </Badge>
              <Button
                variant={editMode ? "default" : "outline"}
                size="sm"
                onClick={() => (editMode ? handleSave() : setEditMode(true))}
              >
                {editMode ? "Salvar" : "Editar"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="interactions">Interações ({client.interactions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editMode ? (
                    <>
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={editedClient.name}
                          onChange={(e) => setEditedClient({ ...editedClient, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={editedClient.email}
                          onChange={(e) => setEditedClient({ ...editedClient, email: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input
                          value={editedClient.phone}
                          onChange={(e) => setEditedClient({ ...editedClient, phone: e.target.value })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{client.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{client.location}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Preferências</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editMode ? (
                    <>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={editedClient.status}
                          onValueChange={(value: Client["status"]) =>
                            setEditedClient({ ...editedClient, status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cold">Frio</SelectItem>
                            <SelectItem value="warm">Morno</SelectItem>
                            <SelectItem value="hot">Quente</SelectItem>
                            <SelectItem value="closed">Fechado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Orçamento</Label>
                        <Input
                          type="number"
                          value={editedClient.budget}
                          onChange={(e) =>
                            setEditedClient({ ...editedClient, budget: Number.parseFloat(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Imóvel</Label>
                        <Input
                          value={editedClient.propertyType}
                          onChange={(e) => setEditedClient({ ...editedClient, propertyType: e.target.value })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="font-medium">Orçamento:</span> {formatCurrency(client.budget)}
                      </div>
                      <div>
                        <span className="font-medium">Tipo:</span> {client.propertyType}
                      </div>
                      <div>
                        <span className="font-medium">Origem:</span> {client.source}
                      </div>
                      <div>
                        <span className="font-medium">Score:</span> {client.score}%
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                {editMode ? (
                  <Textarea
                    value={editedClient.notes}
                    onChange={(e) => setEditedClient({ ...editedClient, notes: e.target.value })}
                    rows={4}
                  />
                ) : (
                  <p className="text-muted-foreground">{client.notes || "Nenhuma observação"}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nova Interação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    value={newInteraction.type}
                    onValueChange={(value: Interaction["type"]) =>
                      setNewInteraction({ ...newInteraction, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Ligação</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="visit">Visita</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={newInteraction.outcome}
                    onValueChange={(value: Interaction["outcome"]) =>
                      setNewInteraction({ ...newInteraction, outcome: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positivo</SelectItem>
                      <SelectItem value="neutral">Neutro</SelectItem>
                      <SelectItem value="negative">Negativo</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button onClick={addInteraction} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>

                <Textarea
                  placeholder="Descreva a interação..."
                  value={newInteraction.notes}
                  onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                  rows={3}
                />
              </CardContent>
            </Card>

            <div className="space-y-3">
              {client.interactions.map((interaction) => (
                <Card key={interaction.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{getInteractionIcon(interaction.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium capitalize">{interaction.type}</span>
                          <Badge
                            variant={
                              interaction.outcome === "positive"
                                ? "default"
                                : interaction.outcome === "negative"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {interaction.outcome === "positive"
                              ? "Positivo"
                              : interaction.outcome === "negative"
                                ? "Negativo"
                                : "Neutro"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(interaction.date).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{interaction.notes}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {client.interactions.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma interação registrada</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
