"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  FileText,
  TrendingUp,
  Shield,
  CheckCircle,
  Star,
  ArrowRight,
  BarChart3,
  Handshake,
  Globe,
} from "lucide-react"

interface HomePageProps {
  onShowLogin?: () => void
}

export default function HomePage({ onShowLogin }: HomePageProps) {
  const handleAccessSystem = () => {
    if (onShowLogin) {
      onShowLogin()
    }
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
                  Sistema que aplica regras pré-definidas sobre a comissão de 5%. Transparente e sem conflitos.
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

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-red-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <FileText className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Contratos Digitais</h3>
                <p className="text-slate-600">
                  Geração automática de contratos entre as partes, com acompanhamento em tempo real pelo administrador.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-8">
                <div className="bg-teal-100 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">Segurança Total</h3>
                <p className="text-slate-600">
                  Todos os dados são protegidos e auditáveis, garantindo transparência em cada transação.
                </p>
              </CardContent>
            </Card>
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
