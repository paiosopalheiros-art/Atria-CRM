"use client"

import { useState, useEffect, useCallback } from "react"
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
  approval_status: "pending" | "approved" | "rejected"
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

export function PropertyFeed({
  currentUserId,
  userType = "partner",
  onEditProperty,
  onShareProperty,
}: PropertyFeedProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastCreatedAt, setLastCreatedAt] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterApproval, setFilterApproval] = useState("all")
  const [sortMode, setSortMode] = useState<"recent" | "top">("recent")

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

      console.log("[v0] Fetching properties for user type:", userType, "sort:", sortMode)

      let query = supabase.from("properties").select("*")

      if (userType !== "admin") {
        query = query.eq("approval_status", "approved")
      }

      if (!reset && lastCreatedAt) {
        query = query.lt("created_at", lastCreatedAt)
      }

      if (sortMode === "recent") {
        query = query.order("created_at", { ascending: false })
      } else {
        query = query.order("price", { ascending: false }).order("created_at", { ascending: false })
      }

      const { data, error } = await query.limit(ITEMS_PER_PAGE)

      if (error) {
        console.error("[v0] Error fetching properties:", error)
        if (reset) setProperties([])
      } else {
        console.log("[v0] Properties fetched:", data?.length || 0)
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
      console.error("[v0] Error in fetchProperties:", error)
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
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === "all" || property.property_type === filterType
    const matchesStatus = filterStatus === "all" || property.status === filterStatus
    const matchesApproval = filterApproval === "all" || property.approval_status === filterApproval

    return matchesSearch && matchesType && matchesStatus && matchesApproval
  })

  const renderMedia = (property: Property) => {
    const media = property.media && property.media.length > 0 ? property.media[0] : null
    const fallbackImage =
      property.images[0] || `/placeholder.svg?height=200&width=300&query=property-${property.property_type}`

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

  const getApprovalStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getApprovalStatusLabel = (status: string) => {
    const labels = {
      pending: "Pendente",
      approved: "Aprovada",
      rejected: "Rejeitada",
    }
    return labels[status as keyof typeof labels] || status
  }

  const openPropertyPage = (property: Property) => {
    if (!property.id) {
      console.error("[v0] Property ID is missing:", property)
      alert("Erro: ID da propriedade não encontrado. Tente recarregar a página.")
      return
    }

    const url = `/property/${property.id}`
    console.log("[v0] Opening property page:", url)

    try {
      window.location.href = url
    } catch (error) {
      console.error("[v0] Error navigating to property page:", error)
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
            {userType === "admin" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Aprovação</label>
                <Select value={filterApproval} onValueChange={setFilterApproval}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovadas</SelectItem>
                    <SelectItem value="rejected">Rejeitadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
                {userType === "admin" && (
                  <Badge className={getApprovalStatusColor(property.approval_status)}>
                    {getApprovalStatusLabel(property.approval_status)}
                  </Badge>
                )}
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="secondary">{getPropertyTypeLabel(property.property_type)}</Badge>
              </div>
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Title and Price */}
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                  <p className="text-2xl font-bold text-primary">{formatPrice(property.price)}</p>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm line-clamp-1">
                    {property.neighborhood}, {property.city}
                  </span>
                </div>

                {/* Property Details */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {property.bedrooms > 0 && (
                    <div className="flex items-center gap-1">
                      <Bed className="h-4 w-4" />
                      <span>{property.bedrooms}</span>
                    </div>
                  )}
                  {property.bathrooms > 0 && (
                    <div className="flex items-center gap-1">
                      <Bath className="h-4 w-4" />
                      <span>{property.bathrooms}</span>
                    </div>
                  )}
                  {property.garages > 0 && (
                    <div className="flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      <span>{property.garages}</span>
                    </div>
                  )}
                  {property.built_area > 0 && (
                    <div className="flex items-center gap-1">
                      <Ruler className="h-4 w-4" />
                      <span>{property.built_area}m²</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                {property.features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {property.features.slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
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
                  Por: <span className="font-medium">{property.owner_name}</span>
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
                  <h3 className="text-lg font-medium mb-2">
                    {userType === "admin" ? "Nenhuma propriedade cadastrada" : "Nenhuma propriedade aprovada"}
                  </h3>
                  <p className="text-sm">
                    {userType === "admin"
                      ? "Seja o primeiro a adicionar uma propriedade ao feed!"
                      : "Aguarde a aprovação das propriedades pelos administradores."}
                  </p>
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
