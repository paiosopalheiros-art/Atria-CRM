"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Publication {
  id: string
  title: string
  price: number
  city: string
  state: string
  source: string
  source_url: string
  status: string
  credits_cost: number
  created_at: string
  image_urls: string[]
}

export default function AdminPublicacoes() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPublications()
  }, [])

  const loadPublications = async () => {
    try {
      const { data, error } = await supabase
        .from("publications")
        .select("*")
        .eq("status", "review")
        .order("created_at", { ascending: false })

      if (error) throw error
      setPublications(data || [])
    } catch (error) {
      console.error("Error loading publications:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: "published" | "draft" | "archived") => {
    try {
      const response = await fetch(`/api/publications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await loadPublications() // Recarregar lista
      }
    } catch (error) {
      console.error("Error updating publication:", error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  if (loading) {
    return <div className="p-6">Carregando publicações...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Moderação de Publicações</h1>
        <Badge variant="secondary">{publications.length} aguardando revisão</Badge>
      </div>

      <div className="grid gap-4">
        {publications.map((pub) => (
          <Card key={pub.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{pub.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {pub.city}, {pub.state} • {formatPrice(pub.price)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant={pub.source === "creci" ? "destructive" : "default"}>
                    {pub.source === "creci" ? "ATS" : "MANUAL"} ({pub.credits_cost} créditos)
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {pub.image_urls?.slice(0, 3).map((url, idx) => (
                  <img
                    key={idx}
                    src={url || "/placeholder.svg"}
                    alt={`Imagem ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.style.display = "none"
                    }}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => updateStatus(pub.id, "published")} className="bg-green-600 hover:bg-green-700">
                  Publicar
                </Button>
                <Button onClick={() => updateStatus(pub.id, "draft")} variant="outline">
                  Rascunho
                </Button>
                <Button onClick={() => updateStatus(pub.id, "archived")} variant="destructive">
                  Arquivar
                </Button>
              </div>

              {pub.source_url && (
                <p className="text-xs text-muted-foreground mt-2">
                  Fonte:{" "}
                  <a href={pub.source_url} target="_blank" rel="noopener noreferrer" className="underline">
                    {pub.source_url}
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {publications.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Nenhuma publicação aguardando revisão</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
