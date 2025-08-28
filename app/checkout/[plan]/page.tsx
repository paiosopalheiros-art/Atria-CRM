"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, CreditCard, Shield, ArrowLeft, Users, Zap, Crown, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const planDetails = {
  free: {
    name: "Free",
    price: 0,
    originalPrice: 0,
    icon: Users,
    color: "slate",
    features: ["Até 5 propriedades", "10 leads por mês", "Suporte básico", "Dashboard básico"],
  },
  pro: {
    name: "Pro",
    price: 97,
    originalPrice: 197,
    icon: Zap,
    color: "blue",
    features: [
      "Até 50 propriedades",
      "100 leads por mês",
      "Sistema de boost",
      "Relatórios avançados",
      "Suporte prioritário",
      "Gamificação completa",
    ],
  },
  elite: {
    name: "Elite",
    price: 197,
    originalPrice: 397,
    icon: Crown,
    color: "purple",
    features: [
      "Propriedades ilimitadas",
      "Leads ilimitados",
      "Boost premium",
      "Suporte 24/7",
      "API personalizada",
      "Relatórios customizados",
      "Treinamento exclusivo",
    ],
  },
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    company: "",
  })

  const planKey = params.plan as keyof typeof planDetails
  const plan = planDetails[planKey]

  if (!plan) {
    return <div>Plano não encontrado</div>
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Se for plano gratuito, criar conta diretamente
      if (planKey === "free") {
        const supabase = createClient()

        // Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: "temp-password-" + Math.random().toString(36).substring(7),
          options: {
            data: {
              full_name: formData.name,
              phone: formData.phone,
              plan: "free",
            },
          },
        })

        if (authError) throw authError

        // Criar perfil do usuário
        if (authData.user) {
          const { error: profileError } = await supabase.from("user_profiles").insert({
            user_id: authData.user.id,
            full_name: formData.name,
            email: formData.email,
            phone: formData.phone,
            user_type: "partner",
            subscription_plan: "free",
            subscription_status: "active",
          })

          if (profileError) throw profileError
        }

        // Redirecionar para dashboard
        router.push("/dashboard?welcome=true")
      } else {
        // Para planos pagos, integrar com Mercado Pago
        const response = await fetch("/api/mercadopago/create-preference", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: planKey,
            customer: formData,
            amount: plan.price,
          }),
        })

        const { preference_id, init_point } = await response.json()

        // Redirecionar para Mercado Pago
        window.location.href = init_point
      }
    } catch (error) {
      console.error("Erro no checkout:", error)
      alert("Erro ao processar pagamento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const IconComponent = plan.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Finalizar Assinatura</h1>
          <p className="text-slate-600 mt-2">Complete seus dados para ativar o plano {plan.name}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle>Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                </div>

                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input id="cpf" name="cpf" value={formData.cpf} onChange={handleInputChange} required />
                </div>

                <div>
                  <Label htmlFor="company">Empresa (opcional)</Label>
                  <Input id="company" name="company" value={formData.company} onChange={handleInputChange} />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : planKey === "free" ? (
                    "Criar Conta Gratuita"
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pagar com Mercado Pago
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resumo do Plano */}
          <div className="space-y-6">
            <Card className={`border-2 border-${plan.color}-500`}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`bg-${plan.color}-100 p-3 rounded-lg`}>
                    <IconComponent className={`h-6 w-6 text-${plan.color}-600`} />
                  </div>
                  <div>
                    <CardTitle>Plano {plan.name}</CardTitle>
                    <div className="flex items-center space-x-2">
                      {plan.originalPrice > plan.price && (
                        <span className="text-slate-400 line-through">R$ {plan.originalPrice}</span>
                      )}
                      <span className="text-2xl font-bold">R$ {plan.price}</span>
                      <span className="text-slate-600">/mês</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-slate-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Garantias */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="h-6 w-6 text-green-500" />
                  <h3 className="font-semibold">Garantias</h3>
                </div>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• 7 dias de garantia ou seu dinheiro de volta</li>
                  <li>• Suporte técnico especializado</li>
                  <li>• Dados protegidos com criptografia</li>
                  <li>• Cancele quando quiser</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
