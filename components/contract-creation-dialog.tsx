"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Users, Percent, Clock, AlertCircle } from "lucide-react"
import type { Contract } from "@/lib/types"

interface ContractCreationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  propertyTitle: string
  captatorId: string
  captatorName: string
  isFromPlatform?: boolean
  onCreateContract: (contract: Omit<Contract, "id" | "createdAt">) => void
}

export function ContractCreationDialog({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  captatorId,
  captatorName,
  isFromPlatform = false,
  onCreateContract,
}: ContractCreationDialogProps) {
  const commissionRules = isFromPlatform
    ? {
        platform: 50,
        partner: 50,
        captator: 0,
        description: "Propriedade captada pela plataforma Atria",
      }
    : {
        platform: 20,
        partner: 50,
        captator: 30,
        description: "Propriedade captada por captador externo",
      }

  const [formData, setFormData] = useState({
    terms: `Contrato de divisão de comissão para venda de imóvel baseado em comissão fixa de 5% do valor da propriedade.

${commissionRules.description}:
- Plataforma Atria: ${commissionRules.platform}% da comissão (${(commissionRules.platform * 0.05).toFixed(1)}% do valor do imóvel)
- Parceiro Vendedor: ${commissionRules.partner}% da comissão (${(commissionRules.partner * 0.05).toFixed(1)}% do valor do imóvel)
${!isFromPlatform ? `- Captador: ${commissionRules.captator}% da comissão (${(commissionRules.captator * 0.05).toFixed(1)}% do valor do imóvel)` : ""}

Este acordo é válido por 90 dias a partir da data de criação.`,
    validityDays: "90",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + Number(formData.validityDays))

    const contract: Omit<Contract, "id" | "createdAt"> = {
      propertyId,
      propertyTitle,
      captatorId,
      captatorName,
      commissionSplit: {
        captator: commissionRules.captator,
        partner: commissionRules.partner,
        platform: commissionRules.platform,
      },
      terms: formData.terms,
      status: "pending",
      expiresAt: expiresAt.toISOString(),
    }

    onCreateContract(contract)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            Criar Contrato de Comissão
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Contrato automático baseado nas regras de comissão para:{" "}
            <span className="font-semibold text-gray-900">{propertyTitle}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2">
          <form onSubmit={handleSubmit} className="space-y-8 py-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-lg font-semibold text-blue-900">Partes Envolvidas</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="text-gray-600 mb-1">Captador</p>
                  <p className="font-semibold text-gray-900">{captatorName}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="text-gray-600 mb-1">Propriedade</p>
                  <p className="font-semibold text-gray-900">{propertyTitle}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-100 md:col-span-2">
                  <p className="text-gray-600 mb-1">Tipo de Captação</p>
                  <p className="font-semibold text-gray-900">{commissionRules.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Percent className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Divisão Automática de Comissão</h3>
                  <p className="text-sm text-gray-600">Baseada em comissão fixa de 5% do valor da propriedade</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-xl border border-gray-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">Plataforma Atria</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">{commissionRules.platform}%</span>
                      <p className="text-xs text-gray-500">{(commissionRules.platform * 0.05).toFixed(1)}% do valor</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Parceiro Vendedor</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">{commissionRules.partner}%</span>
                      <p className="text-xs text-gray-500">{(commissionRules.partner * 0.05).toFixed(1)}% do valor</p>
                    </div>
                  </div>

                  {!isFromPlatform && (
                    <div className="flex justify-between items-center p-4 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="font-medium">Captador</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-purple-600">{commissionRules.captator}%</span>
                        <p className="text-xs text-gray-500">
                          {(commissionRules.captator * 0.05).toFixed(1)}% do valor
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4 flex justify-between items-center p-4 bg-gray-100 rounded-lg font-bold">
                    <span className="text-lg">Total da Comissão</span>
                    <span className="text-2xl">100%</span>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 mb-1">Regras Automáticas</p>
                    <p className="text-amber-700">
                      As porcentagens são calculadas automaticamente baseadas na origem da propriedade conforme as
                      regras da plataforma Atria.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
                <Label htmlFor="validityDays" className="text-lg font-semibold">
                  Validade do Contrato
                </Label>
              </div>
              <Select
                value={formData.validityDays}
                onValueChange={(value) => setFormData({ ...formData, validityDays: value })}
              >
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias (Recomendado)</SelectItem>
                  <SelectItem value="120">120 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <Label htmlFor="terms" className="text-lg font-semibold">
                  Termos e Condições
                </Label>
              </div>
              <div className="relative">
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="min-h-[200px] max-h-[300px] resize-y text-sm leading-relaxed p-4 border-2 focus:border-blue-300"
                  placeholder="Digite os termos e condições do contrato..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                  {formData.terms.length} caracteres
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 pt-6 border-t bg-gray-50 -mx-6 -mb-6 px-6 pb-6">
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="px-8 py-2 h-12">
              Cancelar
            </Button>
            <Button type="submit" onClick={handleSubmit} className="px-8 py-2 h-12 bg-blue-600 hover:bg-blue-700">
              Criar Contrato
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
