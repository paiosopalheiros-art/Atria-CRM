"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bot,
  Send,
  Lightbulb,
  TrendingUp,
  Users,
  Target,
  Bell,
  Calendar,
  Home,
  Clock,
  Star,
  CheckCircle2,
  Plus,
  Search,
} from "lucide-react"
import { AtriaLogoAnimated } from "@/components/atria-logo-animated"

interface Client {
  id: string
  name: string
  email: string
  phone: string
  status: "lead" | "prospect" | "client" | "lost"
  temperature: "cold" | "warm" | "hot"
  budget: string
  propertyType: string
  location: string
  lastContact: string
  interactions: Array<{
    date: string
    type: string
    notes: string
  }>
  followUpDate?: string
  profile?: ClientProfile
}

interface ClientProfile {
  id: string
  clientId: string
  demographics: {
    age?: number
    familySize: number
    occupation: string
    income: number
  }
  preferences: {
    propertyTypes: string[]
    locations: string[]
    budgetRange: { min: number; max: number }
    bedrooms: number
    bathrooms: number
    parking: boolean
    amenities: string[]
    urgency: "low" | "medium" | "high"
  }
  lifestyle: {
    workFromHome: boolean
    hasChildren: boolean
    hasPets: boolean
    transportPreference: "car" | "public" | "walking"
    hobbies: string[]
  }
  financialProfile: {
    preApproved: boolean
    downPayment: number
    financingNeeded: boolean
    creditScore?: number
  }
  aiScore: number
  matchedProperties: string[]
  createdAt: string
  updatedAt: string
}

interface AIInsight {
  type: "strategy" | "followup" | "opportunity" | "warning"
  title: string
  description: string
  priority: "low" | "medium" | "high"
  clientId?: string
}

interface ChatMessage {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
}

interface AIReminder {
  id: string
  clientId: string
  clientName: string
  type: "follow_up" | "property_match" | "document" | "meeting" | "call"
  title: string
  description: string
  dueDate: string
  priority: "low" | "medium" | "high"
  completed: boolean
  createdAt: string
}

interface PropertyMatch {
  propertyId: string
  clientId: string
  matchScore: number
  reasons: string[]
  aiRecommendation: string
  createdAt: string
}

export default function AIAssistant() {
  const [clients, setClients] = useState<Client[]>([])
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [reminders, setReminders] = useState<AIReminder[]>([])
  const [propertyMatches, setPropertyMatches] = useState<PropertyMatch[]>([])
  const [activeTab, setActiveTab] = useState("chat")
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [newProfile, setNewProfile] = useState<Partial<ClientProfile>>({
    demographics: { familySize: 1, occupation: "", income: 0 },
    preferences: {
      propertyTypes: [],
      locations: [],
      budgetRange: { min: 0, max: 0 },
      bedrooms: 1,
      bathrooms: 1,
      parking: false,
      amenities: [],
      urgency: "medium",
    },
    lifestyle: {
      workFromHome: false,
      hasChildren: false,
      hasPets: false,
      transportPreference: "car",
      hobbies: [],
    },
    financialProfile: {
      preApproved: false,
      downPayment: 0,
      financingNeeded: true,
    },
  })

  useEffect(() => {
    loadData()
    generateInsights(clients)
    generateReminders()
    generatePropertyMatches()
  }, [])

  const loadData = () => {
    const savedClients = localStorage.getItem("crm-clients")
    const savedReminders = localStorage.getItem("ai-reminders")
    const savedMatches = localStorage.getItem("property-matches")

    if (savedClients) {
      const clientsData = JSON.parse(savedClients)
      setClients(clientsData)
    }

    if (savedReminders) {
      setReminders(JSON.parse(savedReminders))
    }

    if (savedMatches) {
      setPropertyMatches(JSON.parse(savedMatches))
    }
  }

  const generateInsights = (clientsData: Client[]) => {
    const newInsights: AIInsight[] = []

    // Analyze hot clients without recent contact
    const hotClientsNoContact = clientsData.filter(
      (client) =>
        client.temperature === "hot" && new Date(client.lastContact) < new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    )

    hotClientsNoContact.forEach((client) => {
      newInsights.push({
        type: "warning",
        title: `Cliente Quente Sem Contato: ${client.name}`,
        description: `Cliente com alta temperatura não tem contato há ${Math.floor((Date.now() - new Date(client.lastContact).getTime()) / (24 * 60 * 60 * 1000))} dias. Recomendo contato imediato.`,
        priority: "high",
        clientId: client.id,
      })
    })

    // Identify upselling opportunities
    const clientsWithBudget = clientsData.filter(
      (client) => client.status === "client" && Number.parseInt(client.budget.replace(/\D/g, "")) > 500000,
    )

    clientsWithBudget.forEach((client) => {
      newInsights.push({
        type: "opportunity",
        title: `Oportunidade de Upselling: ${client.name}`,
        description: `Cliente com orçamento alto (${client.budget}). Considere apresentar imóveis premium ou investimentos adicionais.`,
        priority: "medium",
        clientId: client.id,
      })
    })

    // Follow-up strategy recommendations
    const warmClients = clientsData.filter((client) => client.temperature === "warm")
    if (warmClients.length > 0) {
      newInsights.push({
        type: "strategy",
        title: `Estratégia para ${warmClients.length} Clientes Mornos`,
        description:
          "Recomendo campanha de nurturing com conteúdo educativo sobre o mercado imobiliário e financiamento.",
        priority: "medium",
      })
    }

    // Conversion opportunity
    const prospects = clientsData.filter((client) => client.status === "prospect")
    if (prospects.length > 3) {
      newInsights.push({
        type: "opportunity",
        title: `${prospects.length} Prospects Prontos para Conversão`,
        description:
          "Identifiquei vários prospects que podem estar prontos para se tornarem clientes. Recomendo follow-up personalizado.",
        priority: "high",
      })
    }

    setInsights(newInsights)
  }

  const generateReminders = () => {
    const newReminders: AIReminder[] = []
    const today = new Date()

    clients.forEach((client) => {
      // Follow-up reminders
      if (client.lastContact) {
        const lastContact = new Date(client.lastContact)
        const daysSinceContact = Math.floor((today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))

        if (daysSinceContact > 3 && client.temperature === "hot") {
          newReminders.push({
            id: `reminder-${client.id}-followup`,
            clientId: client.id,
            clientName: client.name,
            type: "follow_up",
            title: `Follow-up urgente: ${client.name}`,
            description: `Cliente quente sem contato há ${daysSinceContact} dias. Risco de perder oportunidade.`,
            dueDate: today.toISOString(),
            priority: "high",
            completed: false,
            createdAt: today.toISOString(),
          })
        }
      }

      // Property matching reminders
      if (client.profile && client.profile.matchedProperties.length === 0) {
        newReminders.push({
          id: `reminder-${client.id}-match`,
          clientId: client.id,
          clientName: client.name,
          type: "property_match",
          title: `Buscar imóveis para ${client.name}`,
          description: `Cliente com perfil completo aguarda sugestões de propriedades.`,
          dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          priority: "medium",
          completed: false,
          createdAt: today.toISOString(),
        })
      }
    })

    setReminders(newReminders)
    localStorage.setItem("ai-reminders", JSON.stringify(newReminders))
  }

  const generatePropertyMatches = () => {
    const properties = JSON.parse(localStorage.getItem("atria-properties") || "[]")
    const matches: PropertyMatch[] = []

    clients.forEach((client) => {
      if (!client.profile) return

      properties.forEach((property: any) => {
        const score = calculateMatchScore(client.profile!, property)
        if (score > 60) {
          matches.push({
            propertyId: property.id,
            clientId: client.id,
            matchScore: score,
            reasons: generateMatchReasons(client.profile!, property, score),
            aiRecommendation: generateAIRecommendation(client.profile!, property, score),
            createdAt: new Date().toISOString(),
          })
        }
      })
    })

    setPropertyMatches(matches)
    localStorage.setItem("property-matches", JSON.stringify(matches))
  }

  const calculateMatchScore = (profile: ClientProfile, property: any): number => {
    let score = 0
    const weights = {
      budget: 30,
      location: 25,
      propertyType: 20,
      bedrooms: 10,
      amenities: 10,
      lifestyle: 5,
    }

    // Budget matching
    const propertyPrice = property.price || 0
    const budgetMin = profile.preferences.budgetRange.min
    const budgetMax = profile.preferences.budgetRange.max

    if (propertyPrice >= budgetMin && propertyPrice <= budgetMax) {
      score += weights.budget
    } else if (propertyPrice <= budgetMax * 1.1) {
      score += weights.budget * 0.7
    }

    // Location matching
    if (profile.preferences.locations.some((loc) => property.location?.toLowerCase().includes(loc.toLowerCase()))) {
      score += weights.location
    }

    // Property type matching
    if (profile.preferences.propertyTypes.includes(property.propertyType)) {
      score += weights.propertyType
    }

    // Bedrooms matching
    if (property.bedrooms === profile.preferences.bedrooms) {
      score += weights.bedrooms
    } else if (Math.abs(property.bedrooms - profile.preferences.bedrooms) === 1) {
      score += weights.bedrooms * 0.5
    }

    // Amenities matching
    const propertyAmenities = property.amenities || []
    const matchingAmenities = profile.preferences.amenities.filter((amenity) => propertyAmenities.includes(amenity))
    score += (matchingAmenities.length / profile.preferences.amenities.length) * weights.amenities

    return Math.min(100, Math.round(score))
  }

  const generateMatchReasons = (profile: ClientProfile, property: any, score: number): string[] => {
    const reasons = []

    if (
      property.price >= profile.preferences.budgetRange.min &&
      property.price <= profile.preferences.budgetRange.max
    ) {
      reasons.push("Dentro do orçamento especificado")
    }

    if (profile.preferences.locations.some((loc) => property.location?.toLowerCase().includes(loc.toLowerCase()))) {
      reasons.push("Localização preferida")
    }

    if (profile.preferences.propertyTypes.includes(property.propertyType)) {
      reasons.push("Tipo de imóvel desejado")
    }

    if (property.bedrooms === profile.preferences.bedrooms) {
      reasons.push("Número ideal de quartos")
    }

    if (profile.lifestyle.hasChildren && property.amenities?.includes("Playground")) {
      reasons.push("Ideal para famílias com crianças")
    }

    return reasons
  }

  const generateAIRecommendation = (profile: ClientProfile, property: any, score: number): string => {
    if (score >= 90) {
      return "Excelente match! Este imóvel atende perfeitamente ao perfil do cliente. Recomendo agendar visita imediatamente."
    } else if (score >= 75) {
      return "Ótima opção para o cliente. Alguns critérios podem ser flexíveis. Vale apresentar como alternativa."
    } else if (score >= 60) {
      return "Opção interessante que pode despertar interesse. Considere apresentar junto com outras alternativas."
    }
    return "Match básico. Pode ser usado como comparação ou backup."
  }

  const createClientProfile = () => {
    if (!selectedClient || !newProfile.demographics || !newProfile.preferences) return

    const profile: ClientProfile = {
      id: Date.now().toString(),
      clientId: selectedClient,
      demographics: newProfile.demographics,
      preferences: newProfile.preferences,
      lifestyle: newProfile.lifestyle!,
      financialProfile: newProfile.financialProfile!,
      aiScore: calculateClientScore(newProfile as ClientProfile),
      matchedProperties: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Update client with profile
    const updatedClients = clients.map((client) => (client.id === selectedClient ? { ...client, profile } : client))

    setClients(updatedClients)
    localStorage.setItem("crm-clients", JSON.stringify(updatedClients))

    // Reset form
    setSelectedClient("")
    setNewProfile({
      demographics: { familySize: 1, occupation: "", income: 0 },
      preferences: {
        propertyTypes: [],
        locations: [],
        budgetRange: { min: 0, max: 0 },
        bedrooms: 1,
        bathrooms: 1,
        parking: false,
        amenities: [],
        urgency: "medium",
      },
      lifestyle: {
        workFromHome: false,
        hasChildren: false,
        hasPets: false,
        transportPreference: "car",
        hobbies: [],
      },
      financialProfile: {
        preApproved: false,
        downPayment: 0,
        financingNeeded: true,
      },
    })

    generatePropertyMatches()
  }

  const calculateClientScore = (profile: ClientProfile): number => {
    let score = 0

    // Demographics completeness (20 points)
    if (profile.demographics.age) score += 5
    if (profile.demographics.occupation) score += 5
    if (profile.demographics.income > 0) score += 10

    // Preferences completeness (30 points)
    if (profile.preferences.propertyTypes.length > 0) score += 10
    if (profile.preferences.locations.length > 0) score += 10
    if (profile.preferences.budgetRange.max > 0) score += 10

    // Financial readiness (30 points)
    if (profile.financialProfile.preApproved) score += 20
    if (profile.financialProfile.downPayment > 0) score += 10

    // Urgency factor (20 points)
    if (profile.preferences.urgency === "high") score += 20
    else if (profile.preferences.urgency === "medium") score += 10
    else score += 5

    return Math.min(100, score)
  }

  const completeReminder = (reminderId: string) => {
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === reminderId ? { ...reminder, completed: true } : reminder,
    )
    setReminders(updatedReminders)
    localStorage.setItem("ai-reminders", JSON.stringify(updatedReminders))
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    const currentInput = inputMessage
    setInputMessage("")
    setIsAnalyzing(true)

    try {
      // Build context from previous messages
      const context = chatMessages.map((msg) => ({
        role: msg.type === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }))

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentInput,
          userType: "admin", // You can make this dynamic based on user role
          context: context,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get AI response")
      }

      const data = await response.json()

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: data.message,
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error sending message to AI:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "strategy":
        return <Target className="h-4 w-4" />
      case "followup":
        return <Users className="h-4 w-4" />
      case "opportunity":
        return <TrendingUp className="h-4 w-4" />
      case "warning":
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  const getReminderIcon = (type: string) => {
    switch (type) {
      case "follow_up":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "property_match":
        return <Home className="h-4 w-4 text-blue-500" />
      case "meeting":
        return <Calendar className="h-4 w-4 text-green-500" />
      default:
        return <Bot className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="chat">Chat IA</TabsTrigger>
          <TabsTrigger value="reminders">Lembretes</TabsTrigger>
          <TabsTrigger value="profiles">Perfis</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Lembretes Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {reminders
                    .filter((r) => !r.completed)
                    .map((reminder) => (
                      <div key={reminder.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getReminderIcon(reminder.type)}
                            <h4 className="font-medium text-sm">{reminder.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                reminder.priority === "high"
                                  ? "destructive"
                                  : reminder.priority === "medium"
                                    ? "default"
                                    : "secondary"
                              }
                            >
                              {reminder.priority}
                            </Badge>
                            <Button size="sm" onClick={() => completeReminder(reminder.id)}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{reminder.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Vencimento: {new Date(reminder.dueDate).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))}
                  {reminders.filter((r) => !r.completed).length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">Todos os lembretes foram concluídos!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Criação de Perfil de Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Selecionar Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients
                      .filter((c) => !c.profile)
                      .map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} - {client.status}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedClient && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Demografia</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Idade</Label>
                          <Input
                            type="number"
                            value={newProfile.demographics?.age || ""}
                            onChange={(e) =>
                              setNewProfile({
                                ...newProfile,
                                demographics: {
                                  ...newProfile.demographics!,
                                  age: Number.parseInt(e.target.value) || undefined,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tamanho da Família</Label>
                          <Input
                            type="number"
                            value={newProfile.demographics?.familySize || 1}
                            onChange={(e) =>
                              setNewProfile({
                                ...newProfile,
                                demographics: {
                                  ...newProfile.demographics!,
                                  familySize: Number.parseInt(e.target.value) || 1,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Profissão</Label>
                          <Input
                            value={newProfile.demographics?.occupation || ""}
                            onChange={(e) =>
                              setNewProfile({
                                ...newProfile,
                                demographics: {
                                  ...newProfile.demographics!,
                                  occupation: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Renda Mensal</Label>
                          <Input
                            type="number"
                            value={newProfile.demographics?.income || ""}
                            onChange={(e) =>
                              setNewProfile({
                                ...newProfile,
                                demographics: {
                                  ...newProfile.demographics!,
                                  income: Number.parseInt(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Preferências</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Orçamento Mínimo</Label>
                          <Input
                            type="number"
                            value={newProfile.preferences?.budgetRange.min || ""}
                            onChange={(e) =>
                              setNewProfile({
                                ...newProfile,
                                preferences: {
                                  ...newProfile.preferences!,
                                  budgetRange: {
                                    ...newProfile.preferences!.budgetRange,
                                    min: Number.parseInt(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Orçamento Máximo</Label>
                          <Input
                            type="number"
                            value={newProfile.preferences?.budgetRange.max || ""}
                            onChange={(e) =>
                              setNewProfile({
                                ...newProfile,
                                preferences: {
                                  ...newProfile.preferences!,
                                  budgetRange: {
                                    ...newProfile.preferences!.budgetRange,
                                    max: Number.parseInt(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Quartos</Label>
                          <Select
                            value={newProfile.preferences?.bedrooms.toString() || "1"}
                            onValueChange={(value) =>
                              setNewProfile({
                                ...newProfile,
                                preferences: {
                                  ...newProfile.preferences!,
                                  bedrooms: Number.parseInt(value),
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 quarto</SelectItem>
                              <SelectItem value="2">2 quartos</SelectItem>
                              <SelectItem value="3">3 quartos</SelectItem>
                              <SelectItem value="4">4+ quartos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Urgência</Label>
                          <Select
                            value={newProfile.preferences?.urgency || "medium"}
                            onValueChange={(value: "low" | "medium" | "high") =>
                              setNewProfile({
                                ...newProfile,
                                preferences: {
                                  ...newProfile.preferences!,
                                  urgency: value,
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button onClick={createClientProfile} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Perfil com IA
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Matches de Propriedades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {propertyMatches.map((match) => {
                    const client = clients.find((c) => c.id === match.clientId)
                    return (
                      <div key={`${match.propertyId}-${match.clientId}`} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{client?.name}</h4>
                            <p className="text-sm text-muted-foreground">Propriedade ID: {match.propertyId}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                match.matchScore >= 80 ? "default" : match.matchScore >= 60 ? "secondary" : "outline"
                              }
                            >
                              {match.matchScore}% match
                            </Badge>
                            <Star className="h-4 w-4 text-yellow-500" />
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <p className="text-sm font-medium">Motivos do Match:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {match.reasons.map((reason, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">
                            <strong>Recomendação IA:</strong> {match.aiRecommendation}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {propertyMatches.length === 0 && (
                    <div className="text-center py-8">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum match encontrado. Crie perfis de clientes para gerar matches automáticos.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Insights da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getInsightIcon(insight.type)}
                          <h4 className="font-medium text-sm">{insight.title}</h4>
                        </div>
                        <Badge variant={getPriorityColor(insight.priority)}>{insight.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Analisando seus dados para gerar insights...
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AtriaLogoAnimated size={20} />
                Assistente IA
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[320px] p-4">
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                  {isAnalyzing && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm">Analisando dados...</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <Separator />
              <div className="p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Pergunte sobre seus clientes, estratégias ou análises..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
