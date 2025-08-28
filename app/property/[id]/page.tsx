"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  MapPin,
  Bed,
  Bath,
  Car,
  Ruler,
  Phone,
  Mail,
  MessageCircle,
  Share2,
  Heart,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Map,
  Route,
  Check,
  Lock,
  FileText,
  AlertCircle,
} from "lucide-react"
import { PropertyProposalForm } from "@/components/property-proposal-form"
import { ContractRequestModal } from "@/components/contract-request-modal"
import type { Property } from "@/components/property-upload-dialog"
import { createClient } from "@/lib/supabase/client" // Fixed import to use createClient

export default function PropertyPage() {
  const { id } = useParams() as { id: string }
  const idValue: string | number = id && /^\d+$/.test(id) ? Number(id) : id
  const idStr = String(id || "")

  const [property, setProperty] = useState<Property | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isProposalFormOpen, setIsProposalFormOpen] = useState(false)
  const [isContractRequestOpen, setIsContractRequestOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showContactSuccess, setShowContactSuccess] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [hasSignedContract, setHasSignedContract] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [showAccessDenied, setShowAccessDenied] = useState(false)
  const [locationData, setLocationData] = useState<any>(null)
  const [contactData, setContactData] = useState<any>(null)
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([])
  const [transportOptions, setTransportOptions] = useState<any[]>([])

  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    const fetchPropertyData = async () => {
      if (!id) return // Prevent firing without id
      try {
        setIsLoading(true)

        const { data: propertyData, error: propertyError } = await supabase
          .from("properties")
          .select("*")
          .eq("id", idValue)
          .maybeSingle()

        if (propertyError) {
          console.error("[v0] Error fetching property:", propertyError)
        }

        if (!mounted) return

        if (!propertyData) {
          setProperty(null)
          return
        }

        const formattedProperty: Property = {
          id: propertyData.id,
          title: propertyData.title,
          description: propertyData.description,
          price: propertyData.price,
          type: propertyData.property_type,
          propertyType: propertyData.property_type,
          bedrooms: propertyData.bedrooms,
          bathrooms: propertyData.bathrooms,
          area: propertyData.area,
          builtArea: propertyData.built_area,
          lotArea: propertyData.lot_area,
          lotSize: propertyData.lot_area,
          garages: propertyData.garages,
          address: propertyData.address,
          neighborhood: propertyData.neighborhood,
          city: propertyData.city,
          state: propertyData.state,
          zipCode: propertyData.zip_code,
          images: propertyData.images || [],
          features: propertyData.features || [],
          status: propertyData.status,
          approvalStatus: propertyData.approval_status,
          userId: propertyData.user_id,
          userType: propertyData.user_type,
          createdAt: propertyData.created_at,
          updatedAt: propertyData.updated_at,
          views: propertyData.views || 0,
          ownerName: propertyData.owner_name,
        }

        setProperty(formattedProperty)

        setLocationData({
          coordinates: { lat: -23.5505, lng: -46.6333 },
          address: `${formattedProperty.address || "Endereço não informado"}, ${formattedProperty.neighborhood || ""}, ${formattedProperty.city} - ${formattedProperty.state}`,
        })

        if (propertyData.user_id) {
          const { data: userProfile } = await supabase
            .from("user_profiles")
            .select("full_name, email, phone")
            .eq("user_id", propertyData.user_id)
            .maybeSingle()

          if (mounted && userProfile) {
            setContactData({
              phone: userProfile.phone || "(11) 99999-8888",
              email: userProfile.email || "corretor@atria.com.br",
              whatsapp: (userProfile.phone || "").replace(/\D/g, "") || "5511999998888",
              name: userProfile.full_name || formattedProperty.ownerName || "Corretor Responsável",
            })
          }
        }

        const { data: places } = await supabase.from("nearby_places").select("*").eq("property_id", propertyData.id)
        if (mounted && places?.length) setNearbyPlaces(places)

        const { data: transport } = await supabase
          .from("transport_options")
          .select("*")
          .eq("property_id", propertyData.id)
        if (mounted && transport?.length) setTransportOptions(transport)

        // sessão atual
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (mounted && session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email,
          })
          setIsOwner(propertyData.user_id === session.user.id)
        }
      } catch (error) {
        console.error("[v0] Error fetching property data:", error)
        if (mounted) setProperty(null)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchPropertyData()
    return () => {
      mounted = false
    }
  }, [id, idValue, idStr, supabase])

  useEffect(() => {
    const mapElement = document.getElementById("google-map")
    const loadingElement = document.getElementById("map-loading")
    if (mapElement && loadingElement) {
      setTimeout(() => {
        loadingElement.style.display = "none"
      }, 500)
    }
  }, [property])

  const handleRestrictedAction = (_action: string) => {
    setShowAccessDenied(true)
    setTimeout(() => setShowAccessDenied(false), 4000)
  }

  const handleContractRequest = () => {
    setIsContractRequestOpen(true)
  }

  const canSeeFullContent = isOwner || hasSignedContract

  const toggleFavorite = () => {
    const savedFavorites = localStorage.getItem("atria-favorites")
    let favorites: string[] = savedFavorites ? JSON.parse(savedFavorites) : []

    if (isFavorited) {
      favorites = favorites.filter((fid) => fid !== idStr)
    } else {
      favorites.push(idStr)
    }

    localStorage.setItem("atria-favorites", JSON.stringify(favorites))
    setIsFavorited(!isFavorited)
  }

  const callAgent = () => {
    if (contactData?.phone) {
      window.location.href = `tel:${contactData.phone.replace(/\D/g, "")}`
    } else {
      alert("Número de telefone não disponível")
    }
  }

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Tenho interesse na propriedade: ${property?.title}. Código: #${property?.id}`,
    )
    const url = `https://wa.me/${contactData?.whatsapp}?text=${message}`
    window.open(url, "_blank")
  }

  const sendEmail = () => {
    const subject = encodeURIComponent(`Interesse na propriedade: ${property?.title}`)
    const body = encodeURIComponent(
      `Olá ${contactData?.name},\n\nTenho interesse na propriedade:\n\nTítulo: ${property?.title}\nCódigo: #${property?.id}\nPreço: ${formatPrice(
        property?.price || 0,
      )}\n\nGostaria de mais informações.\n\nObrigado!`,
    )
    window.location.href = `mailto:${contactData?.email}?subject=${subject}&body=${body}`
  }

  const showSuccessMessage = (_action: string) => {
    setShowContactSuccess(true)
    setTimeout(() => setShowContactSuccess(false), 3000)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  const getPropertyTypeLabel = (type: string) => {
    const types = {
      house: "Casa",
      apartment: "Apartamento",
      commercial: "Comercial",
      land: "Terreno",
    }
    return types[type as keyof typeof types] || type
  }

  const nextImage = () => {
    if (property?.images?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length)
    }
  }

  const prevImage = () => {
    if (property?.images?.length) {
      setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)
    }
  }

  const shareProperty = () => {
    if (!property) return
    if (navigator.share) {
      navigator.share({
        title: property.title,
        text: `Confira esta propriedade: ${property.title}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert("Link copiado para a área de transferência!")
    }
  }

  const openGoogleMaps = () => {
    const address = encodeURIComponent(locationData?.address || "")
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`
    window.open(url, "_blank")
  }

  const openWaze = () => {
    const address = encodeURIComponent(locationData?.address || "")
    const url = `https://waze.com/ul?q=${address}&navigate=yes`
    window.open(url, "_blank")
  }

  const getDirections = () => {
    const address = encodeURIComponent(locationData?.address || "")
    const url = `https://www.google.com/maps/dir/?api=1&destination=${address}`
    window.open(url, "_blank")
  }

  const images =
    property?.images?.length && property.images.length > 0
      ? property.images
      : [`/placeholder.svg?height=400&width=600&query=property-${property?.propertyType || "default"}`]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando propriedade...</p>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Propriedade não encontrada</h1>
          <p className="text-muted-foreground mb-4">
            A propriedade que você está procurando não existe ou foi removida.
          </p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-2">
              {!canSeeFullContent && (
                <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700">
                  <Lock className="h-3 w-3 mr-1" />
                  Acesso Limitado
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={shareProperty}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFavorite}
                className={isFavorited ? "bg-red-50 border-red-200 text-red-600" : ""}
              >
                <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showAccessDenied && (
        <div className="fixed top-20 right-4 bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Acesso Restrito</p>
            <p>Assine o contrato para ver informações completas</p>
          </div>
        </div>
      )}

      {showContactSuccess && (
        <div className="fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <Check className="h-4 w-4" />
          Ação realizada com sucesso!
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {!canSeeFullContent && (
          <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800 mb-2">Acesso Limitado à Propriedade</h3>
                  <p className="text-orange-700 mb-4">
                    Para visualizar informações completas de contato e localização, é necessário assinar um contrato de
                    comissão com o captador desta propriedade.
                  </p>
                  <div className="flex gap-3">
                    <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={handleContractRequest}>
                      <FileText className="h-4 w-4 mr-2" />
                      Solicitar Contrato
                    </Button>
                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 bg-transparent">
                      Saiba Mais
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative h-96">
                <img
                  src={images[currentImageIndex] || "/placeholder.svg"}
                  alt={`${property.title} - Imagem ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                      onClick={nextImage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="p-4">
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(Math.min(index, images.length - 1))} // Bounds check
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 ${
                          index === currentImageIndex ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Miniatura ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2">{property.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="secondary">{getPropertyTypeLabel(property.propertyType)}</Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Disponível
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{formatPrice(property.price)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Location */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-5 w-5" />
                  <span>
                    {canSeeFullContent ? (
                      <>
                        {property.address && `${property.address}, `}
                        {property.neighborhood}, {property.city} - {property.state}
                        {property.zipCode && ` - ${property.zipCode}`}
                      </>
                    ) : (
                      <>
                        {property.neighborhood}, {property.city} - {property.state}
                        <Lock className="h-4 w-4 ml-2 text-orange-500" />
                      </>
                    )}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {property.bedrooms > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Bed className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{property.bedrooms}</div>
                        <div className="text-sm text-muted-foreground">Quartos</div>
                      </div>
                    </div>
                  )}
                  {property.bathrooms > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Bath className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{property.bathrooms}</div>
                        <div className="text-sm text-muted-foreground">Banheiros</div>
                      </div>
                    </div>
                  )}
                  {property.garages > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Car className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{property.garages}</div>
                        <div className="text-sm text-muted-foreground">Vagas</div>
                      </div>
                    </div>
                  )}
                  {property.builtArea > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <Ruler className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{property.builtArea}m²</div>
                        <div className="text-sm text-muted-foreground">Área Construída</div>
                      </div>
                    </div>
                  )}
                </div>

                {property.lotSize > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Ruler className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Área do Terreno: {property.lotSize}m²</span>
                    </div>
                  </div>
                )}

                {/* Description */}
                {property.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Descrição</h3>
                    <p className="text-muted-foreground leading-relaxed">{property.description}</p>
                  </div>
                )}

                {/* Features */}
                {!!property.features?.length && (
                  <div>
                    <h3 className="font-semibold mb-3">Características</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {property.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-primary rounded-full" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canSeeFullContent ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5" />
                          Localização e Mapa
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="relative">
                          <div
                            id="map-loading"
                            className="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center z-10"
                          >
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Carregando mapa...</p>
                            </div>
                          </div>
                          <div id="google-map" className="w-full h-80 rounded-xl overflow-hidden">
                            <iframe
                              src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dpoWe2_FpKiHs4&q=${encodeURIComponent(
                                locationData?.address || "",
                              )}&zoom=16&maptype=roadmap`}
                              width="100%"
                              height="320"
                              style={{ border: 0, borderRadius: "12px" }}
                              allowFullScreen
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Localização da propriedade"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <Button
                            variant="outline"
                            className="gap-2 bg-white hover:bg-blue-50 border-blue-200 text-blue-700"
                            onClick={openGoogleMaps}
                          >
                            <Map className="h-4 w-4" />
                            Google Maps
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2 bg-white hover:bg-purple-50 border-purple-200 text-purple-700"
                            onClick={openWaze}
                          >
                            <Navigation className="h-4 w-4" />
                            Waze
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2 bg-white hover:bg-green-50 border-green-200 text-green-700"
                            onClick={getDirections}
                          >
                            <Route className="h-4 w-4" />
                            Como Chegar
                          </Button>
                        </div>

                        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold mb-2 text-gray-800">📍 Endereço Completo</h4>
                              <p className="text-gray-600 leading-relaxed">
                                {property.address && `${property.address}, `}
                                {property.neighborhood}, {property.city} - {property.state}
                                {property.zipCode && ` - CEP: ${property.zipCode}`}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(locationData?.address || "")
                                alert("Endereço copiado!")
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              Copiar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Route className="h-5 w-5" />
                          Opções de Transporte
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">Como chegar ao centro da cidade</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {transportOptions.map((option, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 border-2 rounded-xl hover:shadow-md transition-all cursor-pointer border-blue-200 hover:border-blue-300 bg-blue-50/50"
                            onClick={() =>
                              window.open(
                                `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                  locationData?.address || "",
                                )}`,
                                "_blank",
                              )
                            }
                          >
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-blue-100">
                                {option.icon || "🚗"}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-lg capitalize">{option.type}</span>
                                <Badge variant="secondary" className="bg-white/80 text-gray-700">
                                  {option.duration}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {option.distance}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 font-medium">{option.description}</p>
                            </div>
                            <div className="flex-shrink-0">
                              <Button size="sm" variant="ghost" className="text-blue-600">
                                Ver Rota →
                              </Button>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>🏙️ Pontos de Interesse Próximos</CardTitle>
                        <p className="text-sm text-muted-foreground">Principais locais na região</p>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {nearbyPlaces.map((place, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-4 border rounded-xl hover:shadow-md transition-all cursor-pointer bg-gradient-to-r from-white to-gray-50"
                              onClick={() => {
                                const query = encodeURIComponent(`${place.name} próximo a ${locationData?.address}`)
                                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank")
                              }}
                            >
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                                {place.icon || "📍"}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-800">{place.name}</p>
                                <p className="text-xs text-blue-600 font-medium">{place.distance}</p>
                                <p className="text-xs text-gray-500 capitalize">{place.category}</p>
                              </div>
                              <div className="text-gray-400">
                                <MapPin className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-800">
                        <Lock className="h-5 w-5" />
                        Localização Restrita
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <MapPin className="h-16 w-16 text-orange-400 mx-auto mb-4" />
                        <h3 className="font-semibold text-orange-800 mb-2">Informações de Localização Protegidas</h3>
                        <p className="text-orange-700 mb-4 max-w-md mx-auto">
                          O endereço completo, mapa e rotas estão disponíveis apenas após a assinatura do contrato de
                          comissão.
                        </p>
                        <Button
                          className="bg-orange-600 hover:bg-orange-700"
                          onClick={() => handleRestrictedAction("location")}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Solicitar Acesso
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fale com o Corretor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {property.ownerName
                        ? property.ownerName
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)
                        : "??"}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{property.ownerName || "Corretor não informado"}</div>
                    <div className="text-sm text-muted-foreground">Corretor Responsável</div>
                    {canSeeFullContent ? (
                      <div className="text-xs text-blue-600 mt-1">
                        {contactData?.phone} • {contactData?.email}
                      </div>
                    ) : (
                      <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Contato protegido
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {canSeeFullContent ? (
                  <div className="space-y-3">
                    <Button
                      className="w-full gap-2"
                      onClick={() => {
                        callAgent()
                        showSuccessMessage("call")
                      }}
                    >
                      <Phone className="h-4 w-4" />
                      Ligar Agora
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-transparent hover:bg-green-50 border-green-200 text-green-700"
                      onClick={() => {
                        openWhatsApp()
                        showSuccessMessage("whatsapp")
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2 bg-transparent hover:bg-blue-50 border-blue-200 text-blue-700"
                      onClick={() => {
                        sendEmail()
                        showSuccessMessage("email")
                      }}
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-orange-200 text-orange-700 bg-orange-50"
                      onClick={() => handleRestrictedAction("contact")}
                    >
                      <Lock className="h-4 w-4" />
                      Contato Restrito
                    </Button>
                    <p className="text-xs text-orange-600 text-center">
                      Assine o contrato para acessar informações de contato
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Proposal */}
            <Card>
              <CardHeader>
                <CardTitle>Interessado?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Envie uma proposta ou solicite mais informações sobre esta propriedade.
                </p>
                <Button className="w-full" onClick={() => setIsProposalFormOpen(true)}>
                  Enviar Proposta
                </Button>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Propriedade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Código:</span>
                  <span className="font-medium">#{property.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Publicado em:</span>
                  <span className="font-medium">{new Date(property.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{getPropertyTypeLabel(property.propertyType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Disponível
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <PropertyProposalForm open={isProposalFormOpen} onOpenChange={setIsProposalFormOpen} property={property} />

      {property && currentUser && (
        <ContractRequestModal
          isOpen={isContractRequestOpen}
          onClose={() => setIsContractRequestOpen(false)}
          property={property}
          currentUser={currentUser}
        />
      )}
    </div>
  )
}
