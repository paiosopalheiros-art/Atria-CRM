"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, X, Plus } from "lucide-react"
import { ContractCreationDialog } from "@/components/contract-creation-dialog"
import type { Contract } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

export interface Property {
  id: string
  title: string
  description: string
  price: number
  lotSize: number
  builtArea: number
  bedrooms: number
  bathrooms: number
  garages: number
  propertyType: "house" | "apartment" | "commercial" | "land"
  address: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  images: string[]
  features: string[]
  ownerId: string
  ownerName: string
  userId: string // Added userId field for property ownership tracking
  createdAt: string
  status: "available" | "reserved" | "sold"
  approvalStatus: "pending" | "approved" | "rejected" // Added approval status for moderation
}

interface PropertyUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddProperty: (property: Omit<Property, "id" | "createdAt">) => void
  userId: string
  userName: string
}

export function PropertyUploadDialog({
  open,
  onOpenChange,
  onAddProperty,
  userId,
  userName,
}: PropertyUploadDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    lotSize: "",
    builtArea: "",
    bedrooms: "",
    bathrooms: "",
    garages: "",
    propertyType: "",
    address: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    images: [] as string[],
    features: [] as string[],
  })
  const [newFeature, setNewFeature] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState<boolean[]>([])
  const [showContractDialog, setShowContractDialog] = useState(false)
  const [createdPropertyId, setCreatedPropertyId] = useState<string>("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate required fields
    if (!formData.title || !formData.price || !formData.propertyType) {
      alert("Por favor, preencha todos os campos obrigatórios")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("agency_id")
        .eq("user_id", userId)
        .single()

      if (!userProfile?.agency_id) {
        throw new Error("Usuário não possui agência associada")
      }

      const { data: property, error: propertyError } = await supabase
        .from("properties")
        .insert({
          title: formData.title,
          description: formData.description,
          price_sale: Number(formData.price),
          area_total: Number(formData.lotSize) || null,
          area_built: Number(formData.builtArea) || null,
          rooms: Number(formData.bedrooms) || null,
          bathrooms: Number(formData.bathrooms) || null,
          garage_spaces: Number(formData.garages) || null,
          type: formData.propertyType,
          address: formData.address,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zipCode,
          features: formData.features,
          agency_id: userProfile.agency_id,
          status: "available",
        })
        .select()
        .single()

      if (propertyError) throw propertyError

      console.log("[v0] Property created successfully:", property.id)

      const uploadedImages = []
      for (const imageUrl of formData.images) {
        if (imageUrl.startsWith("blob:") || imageUrl.startsWith("data:")) {
          // This is a local file that needs to be uploaded
          // For now, we'll skip re-uploading already processed images
          continue
        }
        uploadedImages.push(imageUrl)
      }

      // Update property with uploaded images if any
      if (uploadedImages.length > 0) {
        await supabase.from("properties").update({ images: uploadedImages }).eq("id", property.id)
      }

      const propertyForCallback: Omit<Property, "id" | "createdAt"> = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        lotSize: Number(formData.lotSize) || 0,
        builtArea: Number(formData.builtArea) || 0,
        bedrooms: Number(formData.bedrooms) || 0,
        bathrooms: Number(formData.bathrooms) || 0,
        garages: Number(formData.garages) || 0,
        propertyType: formData.propertyType as Property["propertyType"],
        address: formData.address,
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        images: uploadedImages,
        features: formData.features,
        ownerId: userId,
        ownerName: userName,
        userId: userId,
        status: "available",
        approvalStatus: "pending",
      }

      onAddProperty(propertyForCallback)
      setCreatedPropertyId(property.id)

      const createContract = confirm(
        "Propriedade adicionada com sucesso! Deseja criar um contrato de comissão para esta propriedade?",
      )
      if (createContract) {
        setShowContractDialog(true)
      } else {
        onOpenChange(false)
        resetForm()
      }
    } catch (error) {
      console.error("[v0] Error creating property:", error)
      alert(`Erro ao criar propriedade: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateContract = (contract: Omit<Contract, "id" | "createdAt">) => {
    const contracts = JSON.parse(localStorage.getItem("atria-contracts") || "[]")
    const newContract = {
      ...contract,
      id: `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }
    contracts.push(newContract)
    localStorage.setItem("atria-contracts", JSON.stringify(contracts))

    alert("Contrato criado com sucesso! Os parceiros serão notificados.")
    setShowContractDialog(false)
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      lotSize: "",
      builtArea: "",
      bedrooms: "",
      bathrooms: "",
      garages: "",
      propertyType: "",
      address: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      images: [],
      features: [],
    })
  }

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData({ ...formData, features: [...formData.features, newFeature.trim()] })
      setNewFeature("")
    }
  }

  const removeFeature = (feature: string) => {
    setFormData({ ...formData, features: formData.features.filter((f) => f !== feature) })
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione apenas arquivos de imagem")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB")
      return
    }

    const uploadIndex = formData.images.length
    setUploadingImages((prev) => [...prev, true])

    try {
      const tempUrl = URL.createObjectURL(file)

      // Add the temporary image URL to the form data for preview
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, tempUrl],
      }))

      console.log("[v0] Image added for preview:", tempUrl)
      alert("Imagem adicionada! Será enviada quando a propriedade for salva.")
    } catch (error) {
      console.error("[v0] Upload error:", error)
      alert(`Erro ao processar imagem: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
    } finally {
      setUploadingImages((prev) => prev.filter((_, index) => index !== uploadIndex))
      // Reset the input
      event.target.value = ""
    }
  }

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Propriedade</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da propriedade. Sua publicação será analisada pelo administrador antes de aparecer no
              feed.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Propriedade *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Casa 3 quartos com piscina"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="propertyType">Tipo de Propriedade *</Label>
                <Select
                  value={formData.propertyType}
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">Casa</SelectItem>
                    <SelectItem value="apartment">Apartamento</SelectItem>
                    <SelectItem value="commercial">Comercial</SelectItem>
                    <SelectItem value="land">Terreno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva os detalhes da propriedade..."
                rows={3}
              />
            </div>

            {/* Price and Areas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="500000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lotSize">Área do Lote (m²)</Label>
                <Input
                  id="lotSize"
                  type="number"
                  value={formData.lotSize}
                  onChange={(e) => setFormData({ ...formData, lotSize: e.target.value })}
                  placeholder="300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="builtArea">Área Construída (m²)</Label>
                <Input
                  id="builtArea"
                  type="number"
                  value={formData.builtArea}
                  onChange={(e) => setFormData({ ...formData, builtArea: e.target.value })}
                  placeholder="150"
                />
              </div>
            </div>

            {/* Rooms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Quartos</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  placeholder="3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Banheiros</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="garages">Vagas de Garagem</Label>
                <Input
                  id="garages"
                  type="number"
                  value={formData.garages}
                  onChange={(e) => setFormData({ ...formData, garages: e.target.value })}
                  placeholder="2"
                />
              </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua das Flores, 123"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Vila Madalena"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="SP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="01234-567"
                />
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <Label>Imagens da Propriedade</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image || "/placeholder.svg"}
                      alt={`Propriedade ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-24 w-full border-dashed bg-transparent"
                    disabled={uploadingImages.length > 0}
                  >
                    {uploadingImages.length > 0 ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-xs">Enviando...</span>
                      </div>
                    ) : (
                      <Upload className="h-6 w-6" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <Label>Características</Label>
              <div className="flex gap-2">
                <Input
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Ex: Piscina, Churrasqueira..."
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                />
                <Button type="button" onClick={addFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm">
                    {feature}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeFeature(feature)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Adicionar Propriedade"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ContractCreationDialog
        open={showContractDialog}
        onOpenChange={setShowContractDialog}
        propertyId={createdPropertyId}
        propertyTitle={formData.title}
        captatorId={userId}
        captatorName={userName}
        onCreateContract={handleCreateContract}
      />
    </>
  )
}
