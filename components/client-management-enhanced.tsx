"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Users,
  Target,
  Award,
  CheckCircle,
  Upload,
  FileText,
} from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  stage: "lead" | "interested" | "negotiation" | "closed" | "lost"
  source: string
  notes: string
  created_at: string
  updated_at: string
  user_id: string
  agency_id: string
  budget?: number
  property_interest?: string
  property_id?: string // Added property_id to link client to specific property
}

interface ClientManagementEnhancedProps {
  currentUserId: string
}

const STAGES = {
  lead: { label: "Lead", color: "bg-blue-100 text-blue-800", icon: Users },
  interested: { label: "Interessado", color: "bg-yellow-100 text-yellow-800", icon: Target },
  negotiation: { label: "Negociação", color: "bg-orange-100 text-orange-800", icon: TrendingUp },
  closed: { label: "Fechado", color: "bg-green-100 text-green-800", icon: Award },
  lost: { label: "Perdido", color: "bg-red-100 text-red-800", icon: Users },
}

export default function ClientManagementEnhanced({ currentUserId }: ClientManagementEnhancedProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [isAddingClient, setIsAddingClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newClient, setNewClient] = useState({
    name: "",
    email: "",
    phone: "",
    stage: "lead" as Client["stage"],
    source: "",
    notes: "",
    budget: "",
    property_interest: "",
    property_id: "", // Added property_id field
  })

  const [isConfirmingSale, setIsConfirmingSale] = useState(false)
  const [saleToConfirm, setSaleToConfirm] = useState<{ clientId: string; clientName: string } | null>(null)
  const [saleConfirmation, setSaleConfirmation] = useState({
    saleValue: "",
    commission: "",
    propertyDetails: "",
    propertyId: "", // Added propertyId field
    notes: "",
  })
  const [saleProofFile, setSaleProofFile] = useState<File | null>(null) // Added file upload state
  const [uploadingProof, setUploadingProof] = useState(false) // Added upload loading state

  const supabase = createClient()

  useEffect(() => {
    loadClients()
  }, [currentUserId])

  const loadClients = async () => {
    try {
      console.log("[v0] Loading clients for user:", currentUserId)

      // First get user profile to get agency_id
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("agency_id")
        .eq("user_id", currentUserId)
        .single()

      if (!userProfile?.agency_id) {
        console.log("[v0] No agency_id found for user")
        setLoading(false)
        return
      }

      // Load clients from contacts table or create if doesn't exist
      const { data: clientsData, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("agency_id", userProfile.agency_id)
        .order("created_at", { ascending: false })

      if (error) {
        console.log("[v0] Error loading clients:", error.message)
        // If table doesn't exist, use fallback data
        setClients([])
      } else {
        console.log("[v0] Loaded clients:", clientsData?.length || 0)
        setClients(clientsData || [])
      }
    } catch (error) {
      console.error("[v0] Error in loadClients:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateClientStage = async (clientId: string, newStage: Client["stage"]) => {
    try {
      console.log("[v0] Updating client stage:", clientId, newStage)

      // If moving to "closed", show confirmation modal
      if (newStage === "closed") {
        const client = clients.find((c) => c.id === clientId)
        if (client) {
          setSaleToConfirm({ clientId, clientName: client.name })
          setIsConfirmingSale(true)
          return
        }
      }

      const { error } = await supabase
        .from("contacts")
        .update({
          stage: newStage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId)

      if (error) {
        console.error("[v0] Error updating client stage:", error)
        return
      }

      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId ? { ...client, stage: newStage, updated_at: new Date().toISOString() } : client,
        ),
      )
    } catch (error) {
      console.error("[v0] Error in updateClientStage:", error)
    }
  }

  const confirmSale = async () => {
    if (!saleToConfirm || !saleProofFile) {
      // Require proof file
      alert("Por favor, anexe um arquivo de prova da venda")
      return
    }

    try {
      console.log("[v0] Confirming sale for client:", saleToConfirm.clientName)
      setUploadingProof(true)

      // Get user profile for agency_id
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("agency_id, full_name")
        .eq("user_id", currentUserId)
        .single()

      if (!userProfile?.agency_id) {
        alert("Erro: Agência não encontrada")
        return
      }

      const fileExtension = saleProofFile.name.split(".").pop()
      const fileName = `sale-proof-${saleToConfirm.clientId}-${Date.now()}.${fileExtension}`
      const filePath = `sales-proofs/${userProfile.agency_id}/${currentUserId}/${fileName}`

      // Create bucket if it doesn't exist
      const { data: buckets } = await supabase.storage.listBuckets()
      const salesProofsBucket = buckets?.find((bucket) => bucket.name === "sales-proofs")

      if (!salesProofsBucket) {
        await supabase.storage.createBucket("sales-proofs", {
          public: false,
          allowedMimeTypes: [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          ],
          fileSizeLimit: 10485760, // 10MB
        })
      }

      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("sales-proofs")
        .upload(filePath, saleProofFile)

      if (uploadError) {
        console.error("[v0] Error uploading proof file:", uploadError)
        alert("Erro ao fazer upload do arquivo de prova")
        return
      }

      // Get file URL
      const { data: urlData } = supabase.storage.from("sales-proofs").getPublicUrl(filePath)

      // Update client to closed stage
      const { error: clientError } = await supabase
        .from("contacts")
        .update({
          stage: "closed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", saleToConfirm.clientId)

      if (clientError) {
        console.error("[v0] Error updating client:", clientError)
        alert("Erro ao confirmar venda")
        return
      }

      if (saleConfirmation.propertyId) {
        const { error: propertyError } = await supabase
          .from("properties")
          .update({
            status: "sold",
            updated_at: new Date().toISOString(),
          })
          .eq("id", saleConfirmation.propertyId)

        if (propertyError) {
          console.error("[v0] Error updating property status:", propertyError)
          // Don't fail the sale confirmation if property update fails
        } else {
          console.log("[v0] Property marked as sold:", saleConfirmation.propertyId)
        }
      }

      // Create sale record in activity_logs for tracking
      const saleRecord = {
        user_id: currentUserId,
        agency_id: userProfile.agency_id,
        action: "sale_confirmed",
        description: `Venda confirmada - Cliente: ${saleToConfirm.clientName}, Valor: R$ ${saleConfirmation.saleValue}`,
        metadata: {
          client_id: saleToConfirm.clientId,
          client_name: saleToConfirm.clientName,
          sale_value: Number.parseFloat(saleConfirmation.saleValue) || 0,
          commission: Number.parseFloat(saleConfirmation.commission) || 0,
          property_details: saleConfirmation.propertyDetails,
          property_id: saleConfirmation.propertyId || null,
          proof_file_url: urlData.publicUrl, // Store proof file URL
          proof_file_path: filePath,
          notes: saleConfirmation.notes,
          confirmed_at: new Date().toISOString(),
          confirmed_by: userProfile.full_name || "Usuário",
        },
        created_at: new Date().toISOString(),
      }

      const { error: logError } = await supabase.from("activity_logs").insert([saleRecord])

      if (logError) {
        console.error("[v0] Error creating sale log:", logError)
      }

      // Update gamification points (add 100 points for confirmed sale)
      try {
        const currentPoints = localStorage.getItem(`gamification_${currentUserId}`)
        const gameData = currentPoints
          ? JSON.parse(currentPoints)
          : {
              level: 1,
              experience: 0,
              totalSales: 0,
              totalProperties: 0,
              totalClients: 0,
            }

        gameData.experience += 100 // 100 points for confirmed sale
        gameData.totalSales += 1
        gameData.totalClients += 1

        // Level up logic
        const experienceForNextLevel = gameData.level * 200
        if (gameData.experience >= experienceForNextLevel) {
          gameData.level += 1
          gameData.experience = gameData.experience - experienceForNextLevel
        }

        localStorage.setItem(`gamification_${currentUserId}`, JSON.stringify(gameData))
        console.log("[v0] Updated gamification points:", gameData)
      } catch (gamificationError) {
        console.error("[v0] Error updating gamification:", gamificationError)
      }

      // Update local state
      setClients((prev) =>
        prev.map((client) =>
          client.id === saleToConfirm.clientId
            ? { ...client, stage: "closed", updated_at: new Date().toISOString() }
            : client,
        ),
      )

      // Reset modal state
      setIsConfirmingSale(false)
      setSaleToConfirm(null)
      setSaleConfirmation({
        saleValue: "",
        commission: "",
        propertyDetails: "",
        propertyId: "",
        notes: "",
      })
      setSaleProofFile(null) // Reset file state

      alert("🎉 Venda confirmada com sucesso! Arquivo de prova salvo e imóvel marcado como vendido.")
    } catch (error) {
      console.error("[v0] Error in confirmSale:", error)
      alert("Erro ao confirmar venda")
    } finally {
      setUploadingProof(false)
    }
  }

  const addClient = async () => {
    try {
      console.log("[v0] Adding new client:", newClient.name)

      // Get user profile for agency_id
      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("agency_id")
        .eq("user_id", currentUserId)
        .single()

      if (!userProfile?.agency_id) {
        alert("Erro: Agência não encontrada")
        return
      }

      const clientData = {
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        stage: newClient.stage,
        source: newClient.source,
        notes: newClient.notes,
        budget: newClient.budget ? Number.parseFloat(newClient.budget) : null,
        property_interest: newClient.property_interest,
        property_id: newClient.property_id, // Include property_id in client data
        user_id: currentUserId,
        agency_id: userProfile.agency_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("contacts").insert([clientData]).select().single()

      if (error) {
        console.error("[v0] Error adding client:", error)
        alert("Erro ao adicionar cliente: " + error.message)
        return
      }

      console.log("[v0] Client added successfully:", data.id)
      setClients((prev) => [data, ...prev])
      setNewClient({
        name: "",
        email: "",
        phone: "",
        stage: "lead",
        source: "",
        notes: "",
        budget: "",
        property_interest: "",
        property_id: "", // Reset property_id field
      })
      setIsAddingClient(false)
      alert("Cliente adicionado com sucesso!")
    } catch (error) {
      console.error("[v0] Error in addClient:", error)
      alert("Erro ao adicionar cliente")
    }
  }

  const getMetrics = () => {
    const total = clients.length
    const leads = clients.filter((c) => c.stage === "lead").length
    const interested = clients.filter((c) => c.stage === "interested").length
    const negotiation = clients.filter((c) => c.stage === "negotiation").length
    const closed = clients.filter((c) => c.stage === "closed").length
    const conversionRate = total > 0 ? ((closed / total) * 100).toFixed(1) : "0"

    return { total, leads, interested, negotiation, closed, conversionRate }
  }

  const metrics = getMetrics()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Carregando clientes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Leads</p>
                <p className="text-2xl font-bold">{metrics.leads}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Negociação</p>
                <p className="text-2xl font-bold">{metrics.negotiation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Fechados</p>
                <p className="text-2xl font-bold">{metrics.closed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Conversão</p>
                <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header com botão adicionar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pipeline de Clientes</h2>
          <p className="text-sm text-gray-600">Gerencie leads e acompanhe o funil de vendas</p>
        </div>

        <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <Label htmlFor="stage">Estágio</Label>
                <Select
                  value={newClient.stage}
                  onValueChange={(value: Client["stage"]) => setNewClient((prev) => ({ ...prev, stage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STAGES).map(([key, stage]) => (
                      <SelectItem key={key} value={key}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="source">Origem do Lead</Label>
                <Input
                  id="source"
                  value={newClient.source}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, source: e.target.value }))}
                  placeholder="Site, indicação, redes sociais..."
                />
              </div>

              <div>
                <Label htmlFor="budget">Orçamento (R$)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newClient.budget}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, budget: e.target.value }))}
                  placeholder="500000"
                />
              </div>

              <div>
                <Label htmlFor="property_interest">Interesse em Imóvel</Label>
                <Input
                  id="property_interest"
                  value={newClient.property_interest}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, property_interest: e.target.value }))}
                  placeholder="Apartamento 2 quartos, Casa..."
                />
              </div>

              <div>
                <Label htmlFor="property_id">ID do Imóvel (opcional)</Label>
                <Input
                  id="property_id"
                  value={newClient.property_id}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, property_id: e.target.value }))}
                  placeholder="ID do imóvel para marcar como vendido"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Se informado, o imóvel será automaticamente marcado como vendido no feed
                </p>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={newClient.notes}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Informações adicionais sobre o cliente..."
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={addClient}
                  disabled={!newClient.name || !newClient.email || !newClient.phone}
                  className="flex-1"
                >
                  Adicionar Cliente
                </Button>
                <Button variant="outline" onClick={() => setIsAddingClient(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de clientes */}
      <div className="space-y-4">
        {clients.length > 0 ? (
          clients.map((client) => {
            const StageIcon = STAGES[client.stage].icon
            return (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        <Badge className={STAGES[client.stage].color}>
                          <StageIcon className="h-3 w-3 mr-1" />
                          {STAGES[client.stage].label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{client.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{client.phone}</span>
                        </div>
                        {client.budget && (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Orçamento:</span>
                            <span>R$ {client.budget.toLocaleString()}</span>
                          </div>
                        )}
                        {client.property_interest && (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">Interesse:</span>
                            <span>{client.property_interest}</span>
                          </div>
                        )}
                        {client.property_id && (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">ID do Imóvel:</span>
                            <span>{client.property_id}</span>
                          </div>
                        )}
                      </div>

                      {client.source && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">Origem:</span> {client.source}
                        </div>
                      )}

                      {client.notes && (
                        <div className="mt-2 text-sm text-gray-700">
                          <span className="font-medium">Observações:</span> {client.notes}
                        </div>
                      )}

                      <div className="flex items-center space-x-2 mt-3 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Criado em {new Date(client.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="ml-4">
                      <Select
                        value={client.stage}
                        onValueChange={(value: Client["stage"]) => updateClientStage(client.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(STAGES).map(([key, stage]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center space-x-2">
                                <stage.icon className="h-3 w-3" />
                                <span>{stage.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente ainda</h3>
              <p className="text-gray-600 mb-4">Comece adicionando seu primeiro cliente ao pipeline</p>
              <Button onClick={() => setIsAddingClient(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Primeiro Cliente
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sales Confirmation Modal */}
      <Dialog open={isConfirmingSale} onOpenChange={setIsConfirmingSale}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Confirmar Venda</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Cliente:</strong> {saleToConfirm?.clientName}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Confirme os detalhes da venda e anexe um documento de prova para registrar no sistema.
              </p>
            </div>

            <div>
              <Label htmlFor="saleValue">Valor da Venda (R$) *</Label>
              <Input
                id="saleValue"
                type="number"
                value={saleConfirmation.saleValue}
                onChange={(e) => setSaleConfirmation((prev) => ({ ...prev, saleValue: e.target.value }))}
                placeholder="500000"
              />
            </div>

            <div>
              <Label htmlFor="commission">Comissão (R$)</Label>
              <Input
                id="commission"
                type="number"
                value={saleConfirmation.commission}
                onChange={(e) => setSaleConfirmation((prev) => ({ ...prev, commission: e.target.value }))}
                placeholder="15000"
              />
            </div>

            <div>
              <Label htmlFor="propertyDetails">Detalhes do Imóvel</Label>
              <Input
                id="propertyDetails"
                value={saleConfirmation.propertyDetails}
                onChange={(e) => setSaleConfirmation((prev) => ({ ...prev, propertyDetails: e.target.value }))}
                placeholder="Apartamento 2 quartos, 80m²..."
              />
            </div>

            <div>
              <Label htmlFor="propertyId">ID do Imóvel (opcional)</Label>
              <Input
                id="propertyId"
                value={saleConfirmation.propertyId}
                onChange={(e) => setSaleConfirmation((prev) => ({ ...prev, propertyId: e.target.value }))}
                placeholder="ID do imóvel para marcar como vendido"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se informado, o imóvel será automaticamente marcado como vendido no feed
              </p>
            </div>

            <div>
              <Label htmlFor="saleProof">Arquivo de Prova da Venda *</Label>
              <div className="mt-2">
                <input
                  id="saleProof"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => setSaleProofFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("saleProof")?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {saleProofFile ? saleProofFile.name : "Selecionar Arquivo"}
                </Button>
                {saleProofFile && (
                  <div className="flex items-center space-x-2 mt-2 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    <span>{saleProofFile.name}</span>
                    <span>({(saleProofFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Aceita: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)</p>
              </div>
            </div>

            <div>
              <Label htmlFor="saleNotes">Observações da Venda</Label>
              <Textarea
                id="saleNotes"
                value={saleConfirmation.notes}
                onChange={(e) => setSaleConfirmation((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Detalhes adicionais sobre a venda..."
                rows={3}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-blue-800">
                <Award className="h-4 w-4" />
                <span className="text-sm font-medium">Recompensas</span>
              </div>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• +100 pontos de experiência</li>
                <li>• +1 venda no ranking</li>
                <li>• Possível subida de nível</li>
                <li>• Imóvel marcado como vendido</li>
              </ul>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={confirmSale}
                disabled={!saleConfirmation.saleValue || !saleProofFile || uploadingProof}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {uploadingProof ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirmar Venda
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsConfirmingSale(false)
                  setSaleToConfirm(null)
                  setSaleProofFile(null)
                }}
                disabled={uploadingProof}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
