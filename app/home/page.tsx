"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  TrendingUp,
  Shield,
  CheckCircle,
  Star,
  ArrowRight,
  BarChart3,
  Handshake,
  Globe,
  Zap,
  Crown,
  Trophy,
  Rocket,
  Flame,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface HomePageProps {
  onShowLogin?: () => void
}

export default function HomePage({ onShowLogin }: HomePageProps) {
  const router = useRouter()

  const handleAccessSystem = () => {
    if (onShowLogin) {
      onShowLogin()
    }
  }

  const handleCheckout = (plan: "free" | "pro" | "elite") => {
    router.push(`/checkout/${plan}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-jZJokxvWuhL2lwAy1kbMXmC9jNj4Ay.png"
                alt="Atria Logo"
                className="h-8 w-auto"
              />
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#funcionalidades" className="text-slate-600 hover:text-blue-600 transition-colors">
                Funcionalidades
              </a>
              <a href="#como-funciona" className="text-slate-600 hover:text-blue-600 transition-colors">
                Como Funciona
              </a>
              <a href="#depoimentos" className="text-slate-600 hover:text-blue-600 transition-colors">
                Depoimentos
              </a>
              <Button onClick={handleAccessSystem} className="bg-blue-600 hover:bg-blue-700 text-white">
                Acessar Sistema
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-100">CRM Imobiliário Profissional</Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6">
              ATRIA: o CRM imobiliário que conecta <span className="text-blue-600">corretores, captadores</span> e
              clientes qualificados
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Gestão inteligente de leads, contratos digitais e divisão automática de comissões. Mais clareza, mais
              segurança e mais negócios fechados.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
                Solicitar Demonstração
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button onClick={handleAccessSystem} size="lg" variant="outline" className="px-8 py-4 bg-transparent">
                Acessar Agora
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Tudo o que você precisa para transformar oportunidades em vendas
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Funcionalidades desenvolvidas especificamente para o mercado imobiliário
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Gestão de Leads Quentes</h3>
                <p className="text-slate-600">
                  Classifique e acompanhe clientes de acordo com o nível de interesse (frio, morno, quente) e nunca
                  perca uma oportunidade.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-red-50">
              <CardContent className="p-8">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Sistema de Boost</h3>
                <p className="text-slate-600">
                  Destaque seus imóveis no topo do feed com boost básico, premium ou super. Mais visibilidade = mais
                  vendas.
                </p>
                <div className="mt-4 flex items-center space-x-2">
                  <Badge className="bg-orange-100 text-orange-700">Básico 2x</Badge>
                  <Badge className="bg-purple-100 text-purple-700">Premium 5x</Badge>
                  <Badge className="bg-red-100 text-red-700">Super 10x</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-blue-50">
              <CardContent className="p-8">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Ranking Gamificado</h3>
                <p className="text-slate-600">
                  Sistema de níveis, pontuação e ranking competitivo. Ganhe XP por vendas, captações e conquiste badges
                  especiais.
                </p>
                <div className="mt-4 flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-700">Novato</Badge>
                  <Badge className="bg-blue-100 text-blue-700">Expert</Badge>
                  <Badge className="bg-purple-100 text-purple-700">Master</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Handshake className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Parcerias Estruturadas</h3>
                <p className="text-slate-600">
                  Corretores e captadores colaboram em um único ambiente, com fluxos claros e registros auditáveis.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Comissão Automática</h3>
                <p className="text-slate-600">
                  Sistema que aplica regras pré-definidas: 20% plataforma, 30% captador, 50% vendedor. Transparente e
                  sem conflitos.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Links Profissionais</h3>
                <p className="text-slate-600">
                  Crie páginas exclusivas com fotos em alta resolução, descrição completa e botão de proposta direta.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Planos que crescem com seu negócio</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Escolha o plano ideal para seu perfil profissional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="border-2 border-slate-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Free</h3>
                  <p className="text-slate-600">Para começar</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">R$ 0</span>
                    <span className="text-slate-600">/mês</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">Até 5 propriedades</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">10 leads por mês</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">Suporte básico</span>
                  </li>
                </ul>
                <Button className="w-full bg-transparent" variant="outline" onClick={() => handleCheckout("free")}>
                  Começar Grátis
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="border-2 border-blue-500 hover:border-blue-600 transition-colors relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">Mais Popular</Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Pro</h3>
                  <p className="text-slate-600">Para profissionais</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">R$ 97</span>
                    <span className="text-slate-600">/mês</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">Até 50 propriedades</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">100 leads por mês</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">Sistema de boost</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">Relatórios avançados</span>
                  </li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => handleCheckout("pro")}>
                  Escolher Pro
                </Button>
              </CardContent>
            </Card>

            {/* Elite Plan */}
            <Card className="border-2 border-purple-500 hover:border-purple-600 transition-colors">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Elite</h3>
                  <p className="text-slate-600">Para equipes</p>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">R$ 197</span>
                    <span className="text-slate-600">/mês</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">Propriedades ilimitadas</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">Leads ilimitados</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">Boost premium</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-slate-600">Suporte prioritário</span>
                  </li>
                </ul>
                <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleCheckout("elite")}>
                  Escolher Elite
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Sistema de Boost: Destaque seus imóveis
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Aumente a visibilidade dos seus imóveis com nosso sistema de boost inteligente
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Como funciona o Boost</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Flame className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Boost Básico (2x)</h4>
                    <p className="text-slate-600">
                      Multiplica por 2 a visibilidade do imóvel por 7 dias. Ideal para propriedades novas.
                    </p>
                    <Badge className="mt-2 bg-orange-100 text-orange-700">R$ 29,90</Badge>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Boost Premium (5x)</h4>
                    <p className="text-slate-600">
                      Multiplica por 5 a visibilidade por 14 dias. Para imóveis estratégicos.
                    </p>
                    <Badge className="mt-2 bg-purple-100 text-purple-700">R$ 69,90</Badge>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <Rocket className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Boost Super (10x)</h4>
                    <p className="text-slate-600">
                      Multiplica por 10 a visibilidade por 30 dias. Máxima exposição garantida.
                    </p>
                    <Badge className="mt-2 bg-red-100 text-red-700">R$ 129,90</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl">
              <h4 className="font-semibold text-slate-900 mb-4 text-center">Mockup: Feed com Boost</h4>
              <div className="space-y-4">
                {/* Super Boost Property */}
                <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 rounded-lg text-white relative">
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <Rocket className="h-3 w-3 mr-1" />
                    SUPER 10x
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-white/20 rounded-lg"></div>
                    <div>
                      <h5 className="font-semibold">Casa Luxuosa - R$ 850.000</h5>
                      <p className="text-sm opacity-90">3 quartos • 2 banheiros • 150m²</p>
                    </div>
                  </div>
                </div>

                {/* Premium Boost Property */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-lg text-white relative">
                  <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <Zap className="h-3 w-3 mr-1" />
                    PREMIUM 5x
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-white/20 rounded-lg"></div>
                    <div>
                      <h5 className="font-semibold">Apartamento Central - R$ 420.000</h5>
                      <p className="text-sm opacity-90">2 quartos • 1 banheiro • 80m²</p>
                    </div>
                  </div>
                </div>

                {/* Basic Boost Property */}
                <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4 rounded-lg text-white relative">
                  <div className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs px-2 py-1 rounded-full flex items-center">
                    <Flame className="h-3 w-3 mr-1" />
                    BÁSICO 2x
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-white/20 rounded-lg"></div>
                    <div>
                      <h5 className="font-semibold">Casa Familiar - R$ 320.000</h5>
                      <p className="text-sm opacity-90">3 quartos • 1 banheiro • 120m²</p>
                    </div>
                  </div>
                </div>

                {/* Regular Property */}
                <div className="bg-slate-200 p-4 rounded-lg text-slate-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-slate-300 rounded-lg"></div>
                    <div>
                      <h5 className="font-semibold">Apartamento Compacto - R$ 180.000</h5>
                      <p className="text-sm opacity-75">1 quarto • 1 banheiro • 45m²</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-slate-600 text-sm mt-4">
                Imóveis com boost aparecem primeiro e com destaque visual
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="como-funciona" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Da captação ao fechamento, em 5 passos
            </h2>
            <p className="text-xl text-slate-600">Processo simplificado e transparente</p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {[
              {
                step: "1",
                title: "Cadastro do Imóvel",
                description: "Captador insere fotos, detalhes e valor.",
              },
              {
                step: "2",
                title: "Definição da Comissão",
                description: "A divisão é gerada automaticamente e validada pelas partes.",
              },
              {
                step: "3",
                title: "Assinatura Digital",
                description: "Corretores e captadores assinam o contrato em segundos.",
              },
              {
                step: "4",
                title: "Compartilhamento",
                description: "O imóvel recebe um link exclusivo para envio.",
              },
              {
                step: "5",
                title: "Acompanhamento",
                description: "O administrador visualiza todo o processo completo.",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Atria */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Segurança, clareza e eficiência em cada etapa da negociação
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <CheckCircle className="h-6 w-6" />,
                title: "Especialização",
                description: "Desenvolvido exclusivamente para o mercado imobiliário.",
              },
              {
                icon: <Shield className="h-6 w-6" />,
                title: "Transparência",
                description: "Regras claras e registros digitais que eliminam conflitos.",
              },
              {
                icon: <TrendingUp className="h-6 w-6" />,
                title: "Eficiência",
                description: "Redução de tempo em negociações e aumento no índice de fechamento.",
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "Confiabilidade",
                description: "Comissões garantidas e contratos auditáveis.",
              },
              {
                icon: <BarChart3 className="h-6 w-6" />,
                title: "Visibilidade",
                description: "Dashboards completos para gestores e parceiros.",
              },
              {
                icon: <Globe className="h-6 w-6" />,
                title: "Acessibilidade",
                description: "Acesse de qualquer lugar, a qualquer momento.",
              },
            ].map((item, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-lg flex-shrink-0">{item.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Impacto comprovado</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2">30%</div>
              <p className="text-blue-100">menos tempo em negociações</p>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2">+100</div>
              <p className="text-blue-100">imóveis cadastrados e compartilhados</p>
            </div>
            <div>
              <div className="text-4xl lg:text-5xl font-bold text-white mb-2">0</div>
              <p className="text-blue-100">disputas de comissão</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Profissionais que já utilizam a ATRIA
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 italic">
                  "A ATRIA trouxe mais profissionalismo para minha rotina. Hoje administro meus leads e parcerias com
                  muito mais clareza."
                </p>
                <div className="flex items-center">
                  <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <span className="text-blue-600 font-semibold">M</span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Mariana</div>
                    <div className="text-slate-600 text-sm">Corretora</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 italic">
                  "A divisão automática de comissões resolveu um dos maiores problemas da profissão. Agora tenho
                  tranquilidade em cada parceria."
                </p>
                <div className="flex items-center">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                    <span className="text-green-600 font-semibold">C</span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">Carlos</div>
                    <div className="text-slate-600 text-sm">Captador</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
            ATRIA: a tecnologia que eleva sua performance no mercado imobiliário
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Junte-se aos profissionais que já transformaram sua forma de trabalhar
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4">
              Solicitar Demonstração
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button onClick={handleAccessSystem} size="lg" variant="outline" className="px-8 py-4 bg-transparent">
              Começar Agora
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-jZJokxvWuhL2lwAy1kbMXmC9jNj4Ay.png"
              alt="Atria Logo"
              className="h-8 w-auto mx-auto mb-4 brightness-0 invert"
            />
            <p className="text-slate-400">© 2024 ATRIA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
