"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, User, Building, Percent, CheckCircle, ScrollText, Shield } from "lucide-react"

interface Property {
  id: string
  title: string
  price: number
  userId: string
  ownerName?: string
}

interface ContractRequestModalProps {
  isOpen: boolean
  onClose: () => void
  property: Property
  currentUser: any
}

export function ContractRequestModal({ isOpen, onClose, property, currentUser }: ContractRequestModalProps) {
  const [formData, setFormData] = useState({
    message: `Olá! Tenho interesse em trabalhar com a venda da propriedade "${property.title}". Gostaria de discutir os termos de comissão e formalizar nossa parceria através de um contrato.`,
    experience: "",
    references: "",
    fullName: currentUser.fullName || "",
    cpf: "",
    rg: "",
    creci: "",
    address: "",
    city: "",
    state: "",
    cep: "",
    phone: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const isPropertyFromPlatform = property.userId === "atria-platform" || !property.userId
  const commissionRules = isPropertyFromPlatform
    ? {
        platform: 50,
        seller: 50,
        captador: 0,
        type: "Propriedade da Plataforma",
      }
    : {
        platform: 20,
        seller: 50,
        captador: 30,
        type: "Propriedade de Captador Externo",
      }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    setTimeout(() => {
      const activeContract = {
        id: Date.now().toString(),
        propertyId: property.id,
        propertyTitle: property.title,
        propertyPrice: property.price,
        creatorId: property.userId,
        creatorName: property.ownerName || "Proprietário",
        partnerId: currentUser.id,
        partnerName: formData.fullName,
        partnerEmail: currentUser.email,
        partnerPersonalInfo: {
          cpf: formData.cpf,
          rg: formData.rg,
          creci: formData.creci,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          cep: formData.cep,
          phone: formData.phone,
        },
        commissionRules: commissionRules,
        platformPercentage: commissionRules.platform,
        partnerPercentage: commissionRules.seller,
        captadorPercentage: commissionRules.captador,
        terms: `Contrato de parceria para venda da propriedade "${property.title}". Comissão total de 5% sobre o valor de venda, dividida conforme regras da plataforma.`,
        additionalTerms: formData.message,
        experience: formData.experience,
        references: formData.references,
        status: "signed",
        createdAt: new Date().toISOString(),
        signedAt: new Date().toISOString(),
        type: "partnership_contract",
      }

      const existingContracts = JSON.parse(localStorage.getItem("atria-contracts") || "[]")
      existingContracts.push(activeContract)
      localStorage.setItem("atria-contracts", JSON.stringify(existingContracts))

      const notification = {
        id: Date.now().toString(),
        userId: property.userId,
        type: "contract_signed",
        title: "Contrato de Parceria Ativo",
        message: `${formData.fullName} aceitou os termos e agora pode vender a propriedade "${property.title}"`,
        data: activeContract,
        read: false,
        createdAt: new Date().toISOString(),
      }

      const existingNotifications = JSON.parse(localStorage.getItem("atria-notifications") || "[]")
      existingNotifications.push(notification)
      localStorage.setItem("atria-notifications", JSON.stringify(existingNotifications))

      setIsSubmitting(false)
      setIsSuccess(true)

      setTimeout(() => {
        setIsSuccess(false)
        onClose()
        window.location.reload()
      }, 2000)
    }, 1500)
  }

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Contrato Ativo!</h3>
            <p className="text-gray-600 mb-4">Você aceitou os termos e agora pode vender esta propriedade.</p>
            <p className="text-sm text-gray-500">O proprietário foi notificado sobre a parceria ativa.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Contrato de Parceria Comercial
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Building className="h-4 w-4 text-gray-600" />
              <span className="font-medium">Propriedade</span>
            </div>
            <h4 className="font-semibold">{property.title}</h4>
            <p className="text-sm text-gray-600">Valor: R$ {property.price.toLocaleString("pt-BR")}</p>
            <p className="text-sm text-gray-600">Proprietário: {property.ownerName || "Não informado"}</p>
          </div>

          {/* Personal Information Section */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-amber-600" />
              <span className="font-medium text-amber-800">Informações Pessoais (Obrigatório)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="rg">RG *</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rg: e.target.value }))}
                  placeholder="00.000.000-0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="creci">CRECI *</Label>
                <Input
                  id="creci"
                  value={formData.creci}
                  onChange={(e) => setFormData((prev) => ({ ...prev, creci: e.target.value }))}
                  placeholder="CRECI/SP 000000"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">Endereço Completo *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, complemento"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="SP"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cep: e.target.value }))}
                  placeholder="00000-000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
            </div>
          </div>

          {/* Complete contract template section */}
          <div className="bg-white border-2 border-blue-200 rounded-lg">
            <div className="bg-blue-50 p-4 border-b border-blue-200">
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">CONTRATO DE PARCERIA COMERCIAL</span>
              </div>
            </div>

            <div className="p-6 space-y-4 text-sm leading-relaxed max-h-80 overflow-y-auto">
              <div className="text-center font-bold text-lg mb-4">
                CONTRATO DE PARCERIA PARA INTERMEDIAÇÃO IMOBILIÁRIA
              </div>

              <div className="space-y-3">
                <div className="border p-3 rounded bg-gray-50">
                  <p className="font-semibold mb-2">CONTRATANTE:</p>
                  <p>
                    <strong>Razão Social:</strong> Atria Tecnologia Imobiliária LTDA
                  </p>
                  <p>
                    <strong>CNPJ:</strong> 12.345.678/0001-90
                  </p>
                  <p>
                    <strong>Endereço:</strong> Av. Paulista, 1000, São Paulo/SP, CEP: 01310-100
                  </p>
                  <p>
                    <strong>Representante Legal:</strong> João Silva Santos
                  </p>
                  <p>
                    <strong>CPF:</strong> 123.456.789-00
                  </p>
                </div>

                <div className="border p-3 rounded bg-blue-50">
                  <p className="font-semibold mb-2">CONTRATADO:</p>
                  <p>
                    <strong>Nome:</strong> {formData.fullName || "[Nome a ser preenchido]"}
                  </p>
                  <p>
                    <strong>CPF:</strong> {formData.cpf || "[CPF a ser preenchido]"}
                  </p>
                  <p>
                    <strong>RG:</strong> {formData.rg || "[RG a ser preenchido]"}
                  </p>
                  <p>
                    <strong>CRECI:</strong> {formData.creci || "[CRECI a ser preenchido]"}
                  </p>
                  <p>
                    <strong>Endereço:</strong> {formData.address || "[Endereço a ser preenchido]"},{" "}
                    {formData.city || "[Cidade]"}/{formData.state || "[UF]"}, CEP: {formData.cep || "[CEP]"}
                  </p>
                  <p>
                    <strong>Telefone:</strong> {formData.phone || "[Telefone a ser preenchido]"}
                  </p>
                  <p>
                    <strong>Email:</strong> {currentUser.email}
                  </p>
                </div>

                <div className="border p-3 rounded bg-green-50">
                  <p className="font-semibold mb-2">PROPRIEDADE OBJETO DO CONTRATO:</p>
                  <p>
                    <strong>Identificação:</strong> {property.title}
                  </p>
                  <p>
                    <strong>Valor de Referência:</strong> R$ {property.price.toLocaleString("pt-BR")}
                  </p>
                  <p>
                    <strong>Proprietário:</strong> {property.ownerName || "Não informado"}
                  </p>
                </div>
              </div>

              {/* Contract Clauses */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">CLÁUSULA 1ª - DO OBJETO</h4>
                <p>
                  O presente contrato tem por objeto a parceria comercial para intermediação da venda do imóvel acima
                  identificado, estabelecendo as condições de comissão e responsabilidades entre as partes, com base na
                  Lei 6.530/78 que regulamenta a profissão de corretor de imóveis.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">CLÁUSULA 2ª - DA COMISSÃO</h4>
                <p>
                  A comissão total será de <strong>5% (cinco por cento)</strong> sobre o valor final de venda do imóvel,
                  dividida da seguinte forma:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>
                    Plataforma Atria: <strong>{commissionRules.platform}%</strong>
                  </li>
                  <li>
                    Parceiro Vendedor: <strong>{commissionRules.seller}%</strong>
                  </li>
                  {commissionRules.captador > 0 && (
                    <li>
                      Captador Original: <strong>{commissionRules.captador}%</strong>
                    </li>
                  )}
                </ul>
                <p className="mt-2 font-semibold text-green-700">
                  Valor estimado para o contratado: R${" "}
                  {((property.price * 0.05 * commissionRules.seller) / 100).toLocaleString("pt-BR")}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">CLÁUSULA 3ª - DAS RESPONSABILIDADES E OBRIGAÇÕES</h4>
                <p>
                  <strong>O CONTRATADO se compromete a:</strong>
                </p>
                <ul className="list-disc ml-6 mt-1 space-y-1">
                  <li>Atuar com profissionalismo e ética na intermediação da venda</li>
                  <li>Manter sigilo sobre informações confidenciais do imóvel e proprietário</li>
                  <li>Apresentar propostas de forma transparente e tempestiva</li>
                  <li>Cumprir a legislação vigente sobre atividade imobiliária (Lei 6.530/78)</li>
                  <li>Manter registro ativo no CRECI durante toda a vigência do contrato</li>
                  <li>Responder civil e criminalmente por suas ações na intermediação</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">CLÁUSULA 4ª - DO PAGAMENTO</h4>
                <p>
                  A comissão será paga no prazo de até 5 (cinco) dias úteis após a conclusão da venda e recebimento
                  integral do valor pelo proprietário, mediante apresentação da documentação comprobatória e nota
                  fiscal.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">CLÁUSULA 5ª - DA VIGÊNCIA E RESCISÃO</h4>
                <p>
                  Este contrato terá vigência de 180 (cento e oitenta) dias, podendo ser renovado mediante acordo entre
                  as partes ou rescindido a qualquer momento com aviso prévio de 30 dias, sem prejuízo das comissões já
                  devidas por negócios em andamento.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">CLÁUSULA 6ª - DO FORO</h4>
                <p>
                  Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer questões oriundas deste contrato,
                  renunciando as partes a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>

              <div className="border-t pt-4 text-center">
                <p className="font-semibold">Data: {new Date().toLocaleDateString("pt-BR")}</p>
                <p className="mt-4 text-xs text-gray-600">
                  Ao clicar em "Assinar", você declara que todas as informações fornecidas são verdadeiras e concorda
                  com todos os termos e condições acima descritos, assumindo as responsabilidades legais decorrentes
                  deste contrato.
                </p>
              </div>
            </div>
          </div>

          {/* Resumo da Comissão */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Resumo da Comissão</span>
            </div>
            <div className="space-y-2">
              <Badge variant="secondary" className="mb-2">
                {commissionRules.type}
              </Badge>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span>Plataforma Atria:</span>
                  <span className="font-semibold">{commissionRules.platform}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Parceiro Vendedor (você):</span>
                  <span className="font-semibold text-green-600">{commissionRules.seller}%</span>
                </div>
                {commissionRules.captador > 0 && (
                  <div className="flex justify-between">
                    <span>Captador Original:</span>
                    <span className="font-semibold">{commissionRules.captador}%</span>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-green-200">
                <div className="flex justify-between font-semibold">
                  <span>Sua comissão:</span>
                  <span className="text-green-600">
                    R$ {((property.price * 0.05 * commissionRules.seller) / 100).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dados do Contratado */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Dados do Contratado</span>
            </div>
            <p className="font-semibold">{formData.fullName}</p>
            <p className="text-sm text-gray-600">{currentUser.email}</p>
            <Badge variant="secondary" className="mt-1">
              {currentUser.userType === "captador" ? "Captador" : "Parceiro"}
            </Badge>
          </div>

          {/* Observações Adicionais */}
          <div className="space-y-2">
            <Label htmlFor="message">Observações Adicionais</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
              placeholder="Adicione observações ou comentários sobre sua proposta..."
              rows={3}
              required
            />
          </div>

          {/* Experiência no Mercado Imobiliário */}
          <div className="space-y-2">
            <Label htmlFor="experience">Experiência no Mercado Imobiliário</Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => setFormData((prev) => ({ ...prev, experience: e.target.value }))}
              placeholder="Descreva sua experiência, especializações e histórico de vendas..."
              rows={3}
            />
          </div>

          {/* Referências */}
          <div className="space-y-2">
            <Label htmlFor="references">Referências (Opcional)</Label>
            <Textarea
              id="references"
              value={formData.references}
              onChange={(e) => setFormData((prev) => ({ ...prev, references: e.target.value }))}
              placeholder="Contatos de referência, clientes anteriores, etc..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Processando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Assinar Contrato
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
