"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  MapPin,
  Bed,
  Bath,
  Car,
  Ruler,
  Share2,
  Edit,
  Search,
  Filter,
  ExternalLink,
  TrendingUp,
  Clock,
  Trash2,
} from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Property {
  id: string
  title: string
  description: string
  price: number
  property_type: string
  bedrooms: number
  bathrooms: number
  garages: number
  built_area: number
  total_area?: number
  address: string
  neighborhood: string
  city: string
  state: string
  zip_code: string
  images: string[]
  media?: { kind: "image" | "video"; url: string; width?: number; height?: number; alt?: string }[]
  features: string[]
  status: "available" | "reserved" | "sold"
  owner_id: string
  owner_name: string
  created_at: string
  updated_at: string
}

interface PropertyFeedProps {
  currentUserId: string
  userType?: "admin" | "partner"
  onEditProperty?: (property: Property) => void
  onShareProperty?: (property: Property) => void
}

function PropertyFeed({ currentUserId, userType = "partner", onEditProperty, onShareProperty }: PropertyFeedProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastCreatedAt, setLastCreatedAt] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [sortMode, setSortMode] = useState<"recent" | "top">("recent")
  const router = useRouter()

  const ITEMS_PER_PAGE = 12

  useEffect(() => {
    fetchProperties(true)
  }, [userType, sortMode])

  const fetchProperties = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setProperties([])
        setLastCreatedAt(null)
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      console.log("[v0] Fetching properties - reset:", reset, "userType:", userType, "sortMode:", sortMode)
      console.log("[v0] Current user ID:", currentUserId)

      let query = supabase.from("properties").select("*")

      console.log("[v0] Building query - lastCreatedAt:", lastCreatedAt)

      if (!reset && lastCreatedAt) {
        query = query.lt("created_at", lastCreatedAt)
      }

      if (sortMode === "recent") {
        query = query.order("created_at", { ascending: false })
      } else {
        query = query.order("price", { ascending: false }).order("created_at", { ascending: false })
      }

      console.log("[v0] Executing query with limit:", ITEMS_PER_PAGE)
      const { data, error } = await query.limit(ITEMS_PER_PAGE)

      if (error) {
        console.error("[v0] Error fetching properties:", error.message, error.details)
        if (reset) setProperties([])
      } else {
        console.log("[v0] Properties fetched successfully:", data?.length || 0)
        console.log(
          "[v0] First property sample:",
          data?.[0]
            ? {
                id: data[0].id,
                title: data[0].title,
                owner_id: data[0].owner_id,
                created_at: data[0].created_at,
              }
            : "No properties",
        )

        const newProperties = data || []

        if (reset) {
          setProperties(newProperties)
        } else {
          setProperties((prev) => [...prev, ...newProperties])
        }

        if (newProperties.length > 0) {
          setLastCreatedAt(newProperties[newProperties.length - 1].created_at)
          setHasMore(newProperties.length === ITEMS_PER_PAGE)
        } else {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error("[v0] Exception in fetchProperties:", error)
      if (reset) setProperties([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchProperties(false)
    }
  }, [loadingMore, hasMore])

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) {
        loadMore()
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [loadMore])

  const filteredProperties = properties.filter((property) => {
    const title = property.title || ""
    const neighborhood = property.neighborhood || ""
    const city = property.city || ""

    const matchesSearch =
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || property.property_type === filterType
    const matchesStatus = filterStatus === "all" || property.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  console.log("[v0] Filtered properties count:", filteredProperties.length, "of", properties.length)

  const handleDeleteProperty = async (propertyId: string) => {
    console.log("[v0] Attempting to delete property:", propertyId)

    if (!propertyId) {
      console.error("[v0] Cannot delete property: ID is missing")
      alert("Erro: ID da propriedade não encontrado")
      return
    }

    if (!confirm("Tem certeza que deseja deletar esta propriedade? Esta ação não pode ser desfeita.")) {
      console.log("[v0] Property deletion cancelled by user")
      return
    }

    try {
      console.log("[v0] Executing delete query for property:", propertyId)
      const { error } = await supabase.from("properties").delete().eq("id", propertyId)

      if (error) {
        console.error("[v0] Error deleting property:", error.message, error.details)
        alert("Erro ao deletar propriedade: " + error.message)
        return
      }

      console.log("[v0] Property deleted successfully:", propertyId)
      setProperties((prev) => prev.filter((p) => p.id !== propertyId))
      alert("Propriedade deletada com sucesso")
    } catch (error) {
      console.error("[v0] Exception deleting property:", error)
      alert("Erro interno ao deletar propriedade")
    }
  }

  const renderMedia = (property: Property) => {
    const media = property.media && property.media.length > 0 ? property.media[0] : null
    const fallbackImage =
      (property.images && property.images.length > 0 ? property.images[0] : null) ||
      `/placeholder.svg?height=200&width=300&query=property-${property.property_type}`

    if (media) {
      if (media.kind === "video") {
        return (
          <video
            src={media.url}
            controls
            className="w-full h-full object-cover"
            style={{ maxHeight: "200px" }}
            preload="metadata"
          >
            Seu navegador não suporta vídeos.
          </video>
        )
      } else {
        return (
          <img
            src={media.url || "/placeholder.svg"}
            alt={media.alt || property.title}
            loading="lazy"
            className="w-full h-full object-cover"
            style={{ maxHeight: "200px", objectFit: "cover" }}
            width={media.width}
            height={media.height}
          />
        )
      }
    }

    return (
      <img
        src={fallbackImage || "/placeholder.svg"}
        alt={property.title}
        loading="lazy"
        className="w-full h-full object-cover"
        style={{ maxHeight: "200px", objectFit: "cover" }}
      />
    )
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

  const getStatusColor = (status: string) => {
    const colors = {
      available: "bg-green-100 text-green-800",
      reserved: "bg-yellow-100 text-yellow-800",
      sold: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      available: "Disponível",
      reserved: "Reservado",
      sold: "Vendido",
    }
    return labels[status as keyof typeof labels] || status
  }

  const openPropertyPage = (property: Property) => {
    console.log("[v0] Opening property page for:", {
      id: property.id,
      title: property.title,
      owner_id: property.owner_id,
    })

    if (!property.id) {
      console.error("[v0] Property ID is missing:", property)
      alert("Erro: ID da propriedade não encontrado. Tente recarregar a página.")
      return
    }

    const url = `/property/${property.id}`
    console.log("[v0] Navigating to property page:", url)

    try {
      router.push(url)
    } catch (error) {
      console.error("[v0] Error navigating to property page:", error)
      console.log("[v0] Falling back to window.location.href")
      window.location.href = url
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Carregando propriedades...
            </CardTitle>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-48 bg-gray-200 animate-pulse"></div>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ordenação</label>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={sortMode === "recent" ? "default" : "outline"}
                  onClick={() => setSortMode("recent")}
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Recentes
                </Button>
                <Button
                  size="sm"
                  variant={sortMode === "top" ? "default" : "outline"}
                  onClick={() => setSortMode("top")}
                  className="flex-1"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Top
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, bairro ou cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="house">Casa</SelectItem>
                  <SelectItem value="apartment">Apartamento</SelectItem>
                  <SelectItem value="commercial">Comercial</SelectItem>
                  <SelectItem value="land">Terreno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="reserved">Reservado</SelectItem>
                  <SelectItem value="sold">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Property Media */}
            <div className="relative h-48">
              {renderMedia(property)}
              <div className="absolute top-2 left-2 flex gap-1">
                <Badge className={getStatusColor(property.status)}>{getStatusLabel(property.status)}</Badge>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">{getPropertyTypeLabel(property.property_type)}</Badge>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Title and Price */}
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{property.title || "Título não informado"}</h3>
                  <p className="text-2xl font-bold text-primary">{formatPrice(property.price || 0)}</p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm line-clamp-1">
                    {property.neighborhood || "Bairro não informado"}, {property.city || "Cidade não informada"}
                  </span>
                </div>

                {/* Property Details */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {(property.bedrooms || 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      <span>{property.bedrooms}</span>
                    </div>
                  )}
                  {(property.bathrooms || 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      <span>{property.bathrooms}</span>
                    </div>
                  )}
                  {(property.garages || 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      <span>{property.garages}</span>
                    </div>
                  )}
                  {(property.built_area || 0) > 0 && (
                    <div className="flex items-center gap-1">
                      <Ruler className="h-4 w-4" />
                      <span>{property.built_area}m²</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                {property.features && property.features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {property.features.slice(0, 3).map((feature, index) => (
                      <Badge key={`${feature}-${index}`} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {property.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{property.features.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Owner */}
                <div className="text-sm text-muted-foreground">
                  Por: <span className="font-medium">{property.owner_name || "Proprietário não informado"}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => openPropertyPage(property)}
                    disabled={!property.id}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Ver Página
                  </Button>
                  {property.owner_id === currentUserId && (
                    <Button size="sm" variant="outline" onClick={() => onEditProperty?.(property)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {userType === "admin" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteProperty(property.id)}
                      title="Deletar propriedade"
                      disabled={!property.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => onShareProperty?.(property)}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            Carregando mais propriedades...
          </div>
        </div>
      )}

      {!loading && filteredProperties.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              {properties.length === 0 ? (
                <>
                  <h3 className="text-lg font-medium mb-2">Nenhuma propriedade cadastrada</h3>
                  <p className="text-sm">Seja o primeiro a adicionar uma propriedade ao feed!</p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">Nenhuma propriedade encontrada</h3>
                  <p className="text-sm">Tente ajustar os filtros de busca.</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !hasMore && filteredProperties.length > 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">Todas as propriedades foram carregadas</div>
      )}
    </div>
  )
}

export { PropertyFeed }
export default PropertyFeed
