"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, TrendingUp, Users, Zap, Crown, Rocket, Target, Award, BarChart3, Trophy } from "lucide-react"

export default function LandingPage() {
  const [selectedPlan, setSelectedPlan] = useState("pro")

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "R$ 0",
      period: "/mês",
      description: "Perfeito para começar",
      features: ["Até 10 propriedades", "3 leads por mês", "Dashboard básico", "Suporte por email"],
      limitations: ["Sem boost", "Sem gamificação", "Relatórios limitados"],
      popular: false,
      cta: "Começar Grátis",
    },
    {
      id: "pro",
      name: "Pro",
      price: "R$ 97",
      period: "/mês",
      description: "Para corretores profissionais",
      features: [
        "Até 100 propriedades",
        "50 leads por mês",
        "Dashboard completo",
        "Sistema de boost",
        "Gamificação completa",
        "Relatórios avançados",
        "Suporte prioritário",
      ],
      limitations: [],
      popular: true,
      cta: "Escolher Pro",
    },
    {
      id: "elite",
      name: "Elite",
      price: "R$ 197",
      period: "/mês",
      description: "Para equipes e imobiliárias",
      features: [
        "Propriedades ilimitadas",
        "Leads ilimitados",
        "Multi-usuários",
        "Boost premium",
        "Ranking competitivo",
        "API personalizada",
        "Suporte 24/7",
        "Consultoria mensal",
      ],
      limitations: [],
      popular: false,
      cta: "Escolher Elite",
    },
  ]

  const boostFeatures = [
    {
      icon: <Rocket className="h-8 w-8 text-secondary" />,
      title: "Boost Básico",
      description: "Destaque sua propriedade por 7 dias",
      price: "R$ 29",
      multiplier: "2x mais visualizações",
    },
    {
      icon: <Star className="h-8 w-8 text-secondary" />,
      title: "Boost Premium",
      description: "Destaque premium por 15 dias",
      price: "R$ 59",
      multiplier: "5x mais visualizações",
    },
    {
      icon: <Crown className="h-8 w-8 text-secondary" />,
      title: "Super Boost",
      description: "Máximo destaque por 30 dias",
      price: "R$ 99",
      multiplier: "10x mais visualizações",
    },
  ]

  const gamificationLevels = [
    { level: 1, name: "Novato", points: "0-100", color: "bg-gray-400" },
    { level: 2, name: "Iniciante", points: "101-300", color: "bg-green-400" },
    { level: 3, name: "Experiente", points: "301-600", color: "bg-blue-400" },
    { level: 4, name: "Profissional", points: "601-1000", color: "bg-purple-400" },
    { level: 5, name: "Expert", points: "1001-1500", color: "bg-orange-400" },
    { level: 6, name: "Master", points: "1501+", color: "bg-red-400" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-xl">Atria</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#plans" className="text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <a href="#boost" className="text-muted-foreground hover:text-foreground transition-colors">
              Boost
            </a>
            <a href="#gamification" className="text-muted-foreground hover:text-foreground transition-colors">
              Gamificação
            </a>
            <a href="#commission" className="text-muted-foreground hover:text-foreground transition-colors">
              Comissões
            </a>
          </nav>
          <Button>Entrar</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-background to-accent/5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-secondary/10 text-secondary border-secondary/20">
              🚀 Novo: Sistema de Boost para Propriedades
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Transforme Sua Experiência Imobiliária
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              CRM completo com gamificação, sistema de boost, ranking competitivo e comissões inteligentes. Tudo que
              você precisa para vender mais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Começar Grátis
              </Button>
              <Button size="lg" variant="outline">
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="plans" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Escolha Seu Plano</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Planos flexíveis que crescem com seu negócio
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${plan.popular ? "ring-2 ring-secondary shadow-lg scale-105" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-secondary">
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-secondary flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  {plan.limitations.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-2">Limitações:</p>
                      {plan.limitations.map((limitation, index) => (
                        <p key={index} className="text-xs text-muted-foreground">
                          • {limitation}
                        </p>
                      ))}
                    </div>
                  )}
                  <Button className="w-full mt-6" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Boost Features Section */}
      <section id="boost" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Sistema de Boost</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Destaque suas propriedades e receba até 10x mais visualizações
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
            {boostFeatures.map((boost, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-fit">{boost.icon}</div>
                  <CardTitle className="text-xl">{boost.title}</CardTitle>
                  <CardDescription>{boost.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-secondary mb-2">{boost.price}</div>
                  <Badge variant="secondary" className="mb-4">
                    {boost.multiplier}
                  </Badge>
                  <Button className="w-full bg-transparent" variant="outline">
                    Aplicar Boost
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Boost Visual Mockup */}
          <div className="bg-card rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center">Como Funciona o Boost</h3>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground font-bold">
                    1
                  </div>
                  <span>Selecione a propriedade que deseja destacar</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground font-bold">
                    2
                  </div>
                  <span>Escolha o tipo de boost (Básico, Premium ou Super)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground font-bold">
                    3
                  </div>
                  <span>Sua propriedade aparece em destaque no feed</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground font-bold">
                    4
                  </div>
                  <span>Receba mais visualizações e leads qualificados</span>
                </div>
              </div>
              <div className="bg-muted rounded-lg p-6">
                <div className="space-y-3">
                  <div className="bg-secondary/20 border-2 border-secondary rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="h-4 w-4 text-secondary" />
                      <Badge variant="secondary">SUPER BOOST</Badge>
                    </div>
                    <h4 className="font-semibold">Casa Moderna - R$ 850.000</h4>
                    <p className="text-sm text-muted-foreground">3 quartos • 2 banheiros • 150m²</p>
                  </div>
                  <div className="bg-background rounded-lg p-4 opacity-60">
                    <h4 className="font-semibold">Apartamento Centro - R$ 420.000</h4>
                    <p className="text-sm text-muted-foreground">2 quartos • 1 banheiro • 80m²</p>
                  </div>
                  <div className="bg-background rounded-lg p-4 opacity-60">
                    <h4 className="font-semibold">Casa Condomínio - R$ 650.000</h4>
                    <p className="text-sm text-muted-foreground">4 quartos • 3 banheiros • 200m²</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gamification Section */}
      <section id="gamification" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Sistema de Gamificação</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Evolua seu nível, ganhe pontos e compete com outros corretores
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h3 className="text-2xl font-bold mb-6">Níveis e Progressão</h3>
                <div className="space-y-3">
                  {gamificationLevels.map((level) => (
                    <div key={level.level} className="flex items-center gap-4 p-3 bg-card rounded-lg">
                      <div className={`h-3 w-3 rounded-full ${level.color}`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">
                            Nível {level.level}: {level.name}
                          </span>
                          <span className="text-sm text-muted-foreground">{level.points} pts</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-secondary" />
                  Top 3 Corretores
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-lg border border-yellow-500/20">
                    <div className="h-8 w-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">João Silva</p>
                      <p className="text-sm text-muted-foreground">1,847 pontos</p>
                    </div>
                    <Crown className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-400/10 to-gray-500/10 rounded-lg border border-gray-400/20">
                    <div className="h-8 w-8 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Maria Santos</p>
                      <p className="text-sm text-muted-foreground">1,623 pontos</p>
                    </div>
                    <Award className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-600/10 to-orange-700/10 rounded-lg border border-orange-600/20">
                    <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">Carlos Lima</p>
                      <p className="text-sm text-muted-foreground">1,401 pontos</p>
                    </div>
                    <Target className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Como Ganhar Pontos</h3>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-lg">
                  <Users className="h-8 w-8 text-secondary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Captar Propriedade</h4>
                  <p className="text-2xl font-bold text-secondary">+50 pts</p>
                </div>
                <div className="bg-card p-6 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-secondary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Fechar Venda</h4>
                  <p className="text-2xl font-bold text-secondary">+100 pts</p>
                </div>
                <div className="bg-card p-6 rounded-lg">
                  <Star className="h-8 w-8 text-secondary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Avaliação 5★</h4>
                  <p className="text-2xl font-bold text-secondary">+25 pts</p>
                </div>
                <div className="bg-card p-6 rounded-lg">
                  <Zap className="h-8 w-8 text-secondary mx-auto mb-3" />
                  <h4 className="font-semibold mb-2">Login Diário</h4>
                  <p className="text-2xl font-bold text-secondary">+5 pts</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commission Section */}
      <section id="commission" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Sistema de Comissões</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Regra transparente: 20% plataforma, 30% captador, 50% vendedor
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-lg p-8 mb-12">
              <h3 className="text-2xl font-bold mb-6 text-center">Como Funciona a Divisão</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h4 className="font-semibold mb-2">Plataforma</h4>
                  <p className="text-3xl font-bold text-muted-foreground mb-2">20%</p>
                  <p className="text-sm text-muted-foreground">Taxa de manutenção e suporte</p>
                </div>
                <div className="text-center">
                  <div className="h-20 w-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-secondary" />
                  </div>
                  <h4 className="font-semibold mb-2">Captador</h4>
                  <p className="text-3xl font-bold text-secondary mb-2">30%</p>
                  <p className="text-sm text-muted-foreground">Quem trouxe a propriedade</p>
                </div>
                <div className="text-center">
                  <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="font-semibold mb-2">Vendedor</h4>
                  <p className="text-3xl font-bold text-primary mb-2">50%</p>
                  <p className="text-sm text-muted-foreground">Quem fechou a venda</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-center">Exemplo Prático</h3>
              <div className="bg-background rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold mb-4">Cenário 1: Usuários Diferentes</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Venda:</strong> R$ 500.000
                      </p>
                      <p>
                        <strong>Comissão (6%):</strong> R$ 30.000
                      </p>
                      <hr className="my-3" />
                      <p>
                        Plataforma (20%): <strong>R$ 6.000</strong>
                      </p>
                      <p>
                        Captador (30%): <strong>R$ 9.000</strong>
                      </p>
                      <p>
                        Vendedor (50%): <strong>R$ 15.000</strong>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-4">Cenário 2: Mesmo Usuário</h4>
                    <div className="space-y-2 text-sm">
                      <p>
                        <strong>Venda:</strong> R$ 500.000
                      </p>
                      <p>
                        <strong>Comissão (6%):</strong> R$ 30.000
                      </p>
                      <hr className="my-3" />
                      <p>
                        Plataforma (20%): <strong>R$ 6.000</strong>
                      </p>
                      <p>
                        Corretor (80%): <strong>R$ 24.000</strong>
                      </p>
                      <p className="text-secondary font-semibold">+60% a mais!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Pronto para Transformar Suas Vendas?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a centenas de corretores que já estão vendendo mais com Atria
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Começar Grátis Agora
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary bg-transparent"
            >
              Falar com Consultor
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">A</span>
                </div>
                <span className="font-bold text-xl">Atria</span>
              </div>
              <p className="text-muted-foreground">O CRM mais completo para corretores e imobiliárias.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Funcionalidades
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Preços
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contato
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Carreiras
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <hr className="my-8 border-border" />
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground">© 2024 Atria. Todos os direitos reservados.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Termos
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
