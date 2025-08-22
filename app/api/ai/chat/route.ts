import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

interface Message {
  content: string
  role: "user" | "assistant"
}

interface ChatRequest {
  message: string
  userType: "admin" | "partner" | "client"
  context?: Message[]
}

export async function POST(request: NextRequest) {
  try {
    const { message, userType, context = [] }: ChatRequest = await request.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const systemPrompt = `Você é um assistente de IA especializado EXCLUSIVAMENTE no CRM Atria, uma plataforma de gestão imobiliária.

CONTEXTO DO USUÁRIO: ${userType}
- admin: Administrador da plataforma com acesso total
- partner: Corretor/agente imobiliário que gerencia propriedades
- client: Cliente interessado em propriedades

FUNCIONALIDADES PERMITIDAS DO CRM ATRIA:
- Análise de dados internos da plataforma
- Cruzamento de informações de clientes e propriedades
- Suporte em funcionalidades do sistema (cadastros, relatórios, métricas)
- Orientações sobre uso da plataforma
- Análise de performance de propriedades
- Insights sobre leads e propostas
- Suporte técnico do sistema

RESTRIÇÕES IMPORTANTES - VOCÊ NÃO PODE:
❌ Fazer pesquisas na internet ou buscar informações externas
❌ Marcar encontros ou reuniões com clientes
❌ Entrar em contato direto com clientes
❌ Enviar emails ou mensagens para terceiros
❌ Acessar sistemas externos ao CRM Atria
❌ Fornecer informações que não sejam relacionadas ao CRM
❌ Realizar ações que envolvam contato externo

INSTRUÇÕES:
- Responda APENAS sobre funcionalidades internas do CRM Atria
- Auxilie com análise de dados e cruzamento de informações
- Se perguntado sobre algo fora do seu escopo, explique suas limitações
- Seja útil para atividades internas da plataforma
- Responda em português brasileiro
- Mantenha respostas concisas e focadas no CRM

Se o usuário solicitar algo fora do seu escopo, responda: "Desculpe, posso auxiliar apenas com funcionalidades internas do CRM Atria. Não tenho autorização para [ação solicitada]. Como posso ajudar com análise de dados ou funcionalidades da plataforma?"`

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...context.map((msg) => ({ role: msg.role as const, content: msg.content })),
      { role: "user" as const, content: message },
    ]

    const apiKey = process.env.OPENAI_API_KEY // Assuming the API key is stored in an environment variable
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      messages,
      maxTokens: 500,
      temperature: 0.7,
      apiKey: apiKey, // Updated to use the provided OpenAI API key
    })

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error("AI Chat error:", error)
    return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 })
  }
}
