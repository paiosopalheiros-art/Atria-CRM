"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, Crown, Star, Zap } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface SubscriptionPlan {
  id: string
  name: string
  display_name: string
  price_monthly: number
  price_yearly: number
  max_properties: number | null
  max_leads: number | null
  max_contracts: number | null
  max_team_members: number | null
  features: string[]
}

interface UserUsage {
  properties_count: number
  leads_count: number
  contracts_count: number
  team_members_count: number
}

interface SubscriptionManagerProps {
  userId: string
  currentPlan?: SubscriptionPlan
  onPlanChange?: (planId: string) => void
}

export default function SubscriptionManager({ userId, currentPlan, onPlanChange }: SubscriptionManagerProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [usage, setUsage] = useState<UserUsage>({
    properties_count: 0,
    leads_count: 0,
    contracts_count: 0,
    team_members_count: 1,
  })
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  useEffect(() => {
    loadPlansAndUsage()
  }, [userId])

  const loadPlansAndUsage = async () => {
    try {
      const { data: plansData } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true })

      if (plansData) {
        setPlans(plansData)
      }

      const { data: userProfile } = await supabase
        .from("user_profiles")
        .select("agency_id")
        .eq("user_id", userId)
        .single()

      if (userProfile?.agency_id) {
        const [propertiesResult, leadsResult, contractsResult, teamResult] = await Promise.all([
          supabase.from("properties").select("id", { count: "exact" }).eq("agency_id", userProfile.agency_id),
          supabase.from("leads").select("id", { count: "exact" }).eq("agency_id", userProfile.agency_id),
          supabase.from("contracts").select("id", { count: "exact" }).eq("agency_id", userProfile.agency_id),
          supabase.from("user_profiles").select("id", { count: "exact" }).eq("agency_id", userProfile.agency_id),
        ])

        setUsage({
          properties_count: propertiesResult.count || 0,
          leads_count: leadsResult.count || 0,
          contracts_count: contractsResult.count || 0,
          team_members_count: teamResult.count || 1,
        })
      }
    } catch (error) {
      console.error("Error loading plans and usage:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      console.log("[v0] Starting plan upgrade to:", planId)

      const { data: userProfile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id, agency_id")
        .eq("user_id", userId)
        .single()

      if (profileError) {
        console.error("[v0] Error fetching user profile:", profileError)
        throw new Error("Perfil do usuário não encontrado")
      }

      console.log("[v0] User profile found:", userProfile)

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({
          subscription_plan_id: planId,
          subscription_started_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      if (updateError) {
        console.error("[v0] Error updating subscription:", updateError)
        throw new Error("Erro ao atualizar plano: " + updateError.message)
      }

      console.log("[v0] Plan updated successfully")

      const selectedPlan = plans.find((p) => p.id === planId)
      setSuccessMessage(`Plano ${selectedPlan?.display_name} ativado com sucesso!`)

      onPlanChange?.(planId)

      await loadPlansAndUsage()
    } catch (error: any) {
      console.error("[v0] Plan upgrade error:", error)
      setErrorMessage(error.message || "Erro ao alterar plano. Tente novamente.")
    } finally {
      setUpgrading(null)

      setTimeout(() => {
        setSuccessMessage(null)
        setErrorMessage(null)
      }, 3000)
    }
  }

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (limit === null) return 0
    return Math.min((used / limit) * 100, 100)
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "free":
        return <Star className="h-5 w-5" />
      case "pro":
        return <Zap className="h-5 w-5" />
      case "elite":
        return <Crown className="h-5 w-5" />
      default:
        return <Star className="h-5 w-5" />
    }
  }

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case "free":
        return "bg-gray-100 text-gray-800"
      case "pro":
        return "bg-blue-100 text-blue-800"
      case "elite":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando planos...</div>
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">{successMessage}</div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">{errorMessage}</div>
      )}

      {currentPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getPlanIcon(currentPlan.name)}
              Plano Atual: {currentPlan.display_name}
            </CardTitle>
            <CardDescription>Acompanhe o uso dos recursos do seu plano</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Propriedades</span>
                  <span>
                    {usage.properties_count}/{currentPlan.max_properties || "∞"}
                  </span>
                </div>
                <Progress value={getUsagePercentage(usage.properties_count, currentPlan.max_properties)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Leads</span>
                  <span>
                    {usage.leads_count}/{currentPlan.max_leads || "∞"}
                  </span>
                </div>
                <Progress value={getUsagePercentage(usage.leads_count, currentPlan.max_leads)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Contratos</span>
                  <span>
                    {usage.contracts_count}/{currentPlan.max_contracts || "∞"}
                  </span>
                </div>
                <Progress value={getUsagePercentage(usage.contracts_count, currentPlan.max_contracts)} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Equipe</span>
                  <span>
                    {usage.team_members_count}/{currentPlan.max_team_members || "∞"}
                  </span>
                </div>
                <Progress value={getUsagePercentage(usage.team_members_count, currentPlan.max_team_members)} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Escolha seu Plano</CardTitle>
          <CardDescription>Selecione o plano que melhor atende às suas necessidades</CardDescription>
          <Tabs value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Mensal</TabsTrigger>
              <TabsTrigger value="yearly">Anual (2 meses grátis)</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={`relative ${currentPlan?.id === plan.id ? "ring-2 ring-blue-500" : ""}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {getPlanIcon(plan.name)}
                      {plan.display_name}
                    </CardTitle>
                    {currentPlan?.id === plan.id && <Badge variant="secondary">Atual</Badge>}
                  </div>
                  <div className="text-3xl font-bold">
                    R$ {billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{billingCycle === "monthly" ? "mês" : "ano"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Propriedades</span>
                      <span>{plan.max_properties || "Ilimitado"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Leads</span>
                      <span>{plan.max_leads || "Ilimitado"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Contratos</span>
                      <span>{plan.max_contracts || "Ilimitado"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Membros da Equipe</span>
                      <span>{plan.max_team_members || "Ilimitado"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Recursos Inclusos:</h4>
                    <ul className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className="w-full"
                    variant={currentPlan?.id === plan.id ? "outline" : "default"}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={currentPlan?.id === plan.id || upgrading === plan.id}
                  >
                    {upgrading === plan.id
                      ? "Aplicando..."
                      : currentPlan?.id === plan.id
                        ? "Plano Atual"
                        : "Aplicar Plano"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
