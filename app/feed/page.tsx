"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface FeedItem {
  id: string
  title: string
  price: number
  city: string
  state: string
  source_type: string
  credits_cost: number
  image_urls: string[]
  created_at: string
  listing_type: string
  status: string
}

export default function FeedPage() {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFeed()
  }, [])

  const loadFeed = async () => {
    try {
      const { data, error } = await supabase
        .from("feed_published")
        .select("*")
        .eq("listing_type", "sale") // Only show sale properties
        .eq("status", "approved") // Only show approved properties
        .limit(50)

      if (error) throw error
      setFeed(data || [])
    } catch (error) {
      console.error("Error loading feed:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  if (loading) {
    return <div className="p-6">Carregando feed...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Feed de Imóveis à Venda</h1>
        <Badge variant="secondary">{feed.length} imóveis disponíveis</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {feed.map((item) => (
          <Card
            key={item.id}
            className={`hover:shadow-lg transition-shadow ${
              item.source_type === "ATS" ? "border-orange-200 bg-orange-50/50" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <Badge variant={item.source_type === "ATS" ? "destructive" : "default"}>
                    {item.source_type === "ATS" ? "ATS" : "Manual"} ({item.credits_cost} créditos)
                  </Badge>
                  {item.source_type === "ATS" && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Auto-aprovado
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {item.image_urls?.[0] && (
                <img
                  src={item.image_urls[0] || "/placeholder.svg"}
                  alt={item.title}
                  className="w-full h-48 object-cover rounded mb-3"
                  onError={(e) => {
                    e.currentTarget.src = "/traditional-spanish-casa.png"
                  }}
                />
              )}

              <CardTitle className="text-lg mb-2 line-clamp-2">{item.title}</CardTitle>

              <div className="space-y-2">
                <p className="text-xl font-bold text-green-600">{formatPrice(item.price)}</p>
                <p className="text-sm text-muted-foreground">
                  {item.city}, {item.state}
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    À Venda
                  </Badge>
                  {item.source_type === "ATS" && (
                    <span className="text-xs text-orange-600 font-medium">Importado via CRECI</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Publicado em {new Date(item.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {feed.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhum imóvel à venda disponível no momento</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
