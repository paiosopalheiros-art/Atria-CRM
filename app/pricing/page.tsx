import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import CheckoutButton from "@/components/CheckoutButton"

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "R$ 0",
      period: "/mês",
      description: "Para começar",
      features: ["Até 5 propriedades", "Dashboard básico", "Suporte por email"],
      plan: null,
    },
    {
      name: "Pro",
      price: "R$ 97",
      period: "/mês",
      description: "Para profissionais",
      features: [
        "Propriedades ilimitadas",
        "Dashboard avançado",
        "Sistema de boost",
        "Relatórios detalhados",
        "Suporte prioritário",
      ],
      plan: "pro" as const,
      popular: true,
    },
    {
      name: "Elite",
      price: "R$ 197",
      period: "/mês",
      description: "Para equipes",
      features: [
        "Tudo do Pro",
        "Múltiplos usuários",
        "API personalizada",
        "Integração CRM",
        "Suporte 24/7",
        "Consultoria mensal",
      ],
      plan: "elite" as const,
    },
  ]

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Escolha seu plano</h1>
          <p className="text-xl text-muted-foreground">Encontre o plano perfeito para suas necessidades</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative ${plan.popular ? "border-primary shadow-lg" : ""}`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">Mais Popular</Badge>
              )}

              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {plan.plan ? (
                  <CheckoutButton plan={plan.plan} className="w-full">
                    Assinar {plan.name}
                  </CheckoutButton>
                ) : (
                  <div className="w-full text-center py-2 text-muted-foreground">Plano atual</div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
