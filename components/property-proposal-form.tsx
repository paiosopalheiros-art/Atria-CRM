"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Send, User, DollarSign } from "lucide-react"
import type { Property } from "./property-upload-dialog"
import { createClient } from "@/lib/supabase/client" // Fixed import to use createClient
import { getPropertyCreditCost, spendCreditsClient, type PropertySource, type PropertyTier } from "@/lib/utils"

interface PropertyProposalFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: Property
}

export interface Proposal {
  id: string
  propertyId: string
  propertyTitle: string
  clientName: string
  clientEmail: string
  clientPhone: string
  proposalType: "purchase" | "rent" | "information"
  proposedValue?: number
  message: string
  financing: boolean
  visitRequested: boolean
  createdAt: string
  status: "pending" | "accepted" | "rejected" | "negotiating"
}

export function PropertyProposalForm({ open, onOpenChange, property }: PropertyProposalFormProps) {
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    proposalType: "",
    proposedValue: "",
    message: "",
    financing: false,
    visitRequested: false,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate required fields
    if (!formData.clientName || !formData.clientEmail || !formData.proposalType) {
      alert("Por favor, preencha todos os campos obrigatórios")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        alert("Usuário não autenticado")
        setIsLoading(false)
        return
      }

      let src: PropertySource = property?.source ?? "user"
      let tier: PropertyTier = property?.tier ?? "medio"

      if (!property?.source || !property?.tier) {
        const { data: p } = await supabase
          .from("properties")
          .select("source, tier")
          .eq("id", property?.id)
          .maybeSingle()
        src = (p?.source as PropertySource) || src
        tier = (p?.tier as PropertyTier) || tier
      }

      const cost = getPropertyCreditCost({ source: src, tier })
      console.log("[v0] Proposal submission cost:", { source: src, tier, cost })

      const creditResult = await spendCreditsClient({
        supabase,
        userId: user.id,
        amount: cost,
        reason: "aplicar_venda",
        propertyId: property?.id,
        meta: {
          form: formData,
          source: src,
          tier,
          propertyTitle: property.title,
        },
      })

      if (!creditResult.ok) {
        alert(`Saldo insuficiente para aplicar. Você precisa de ${cost} créditos. ${creditResult.error || ""}`)
        setIsLoading(false)
        return
      }

      const proposalData = {
        property_id: property.id,
        client_name: formData.clientName,
        client_email: formData.clientEmail,
        client_phone: formData.clientPhone,
        proposal_type: formData.proposalType,
        proposed_value: formData.proposedValue ? Number(formData.proposedValue) : null,
        message: formData.message,
        financing: formData.financing,
        visit_requested: formData.visitRequested,
        status: "pending",
      }

      const { data, error } = await supabase.from("proposals").insert([proposalData]).select().single()

      if (error) {
        console.error("[v0] Error creating proposal:", error)
        alert("Erro ao enviar proposta. Tente novamente.")
        setIsLoading(false)
        return
      }

      console.log("[v0] Proposal created successfully:", data)
      alert(`Proposta enviada com sucesso! (-${cost} créditos)\n\nO corretor entrará em contato em breve.`)
      onOpenChange(false)

      // Reset form
      setFormData({
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        proposalType: "",
        proposedValue: "",
        message: "",
        financing: false,
        visitRequested: false,
      })
    } catch (error) {
      console.error("[v0] Error creating proposal:", error)
      alert("Erro interno ao enviar proposta. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const proposalCost = getPropertyCreditCost({
    source: property?.source ?? "user",
    tier: property?.tier ?? "medio",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Proposta</DialogTitle>
          <DialogDescription>
            Preencha o formulário abaixo para enviar sua proposta para "{property.title}"
          </DialogDescription>
        </DialogHeader>

        {/* Property Summary */}
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <div className="flex items-center gap-4">
            <img
              src={
                property.images?.[0] || `/placeholder.svg?height=80&width=120&query=property-${property.propertyType}`
              }
              alt={property.title}
              className="w-20 h-16 object-cover rounded"
            />
            <div>
              <h3 className="font-medium">{property.title}</h3>
              <p className="text-sm text-muted-foreground">
                {property.neighborhood}, {property.city}
              </p>
              <p className="text-lg font-bold text-primary">{formatPrice(property.price)}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Custo para aplicar:</strong> {proposalCost} créditos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome Completo *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">Telefone</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={formData.clientPhone}
                onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          {/* Proposal Details */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Detalhes da Proposta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposalType">Tipo de Interesse *</Label>
                <Select
                  value={formData.proposalType}
                  onValueChange={(value) => setFormData({ ...formData, proposalType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Compra</SelectItem>
                    <SelectItem value="rent">Aluguel</SelectItem>
                    <SelectItem value="information">Mais Informações</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(formData.proposalType === "purchase" || formData.proposalType === "rent") && (
                <div className="space-y-2">
                  <Label htmlFor="proposedValue">
                    Valor Proposto {formData.proposalType === "rent" ? "(Mensal)" : ""}
                  </Label>
                  <Input
                    id="proposedValue"
                    type="number"
                    value={formData.proposedValue}
                    onChange={(e) => setFormData({ ...formData, proposedValue: e.target.value })}
                    placeholder="Digite o valor"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Conte mais sobre seu interesse, dúvidas ou condições especiais..."
              rows={4}
            />
          </div>

          {/* Additional Options */}
          <div className="space-y-3">
            <h3 className="font-medium">Opções Adicionais</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="financing"
                  checked={formData.financing}
                  onCheckedChange={(checked) => setFormData({ ...formData, financing: !!checked })}
                />
                <Label htmlFor="financing" className="text-sm">
                  Preciso de financiamento bancário
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="visitRequested"
                  checked={formData.visitRequested}
                  onCheckedChange={(checked) => setFormData({ ...formData, visitRequested: !!checked })}
                />
                <Label htmlFor="visitRequested" className="text-sm">
                  Gostaria de agendar uma visita
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </div>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Proposta
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
