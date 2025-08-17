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

    // Build context for the AI
    const systemPrompt = `Você é um assistente de IA especializado no CRM Atria, uma plataforma de gestão imobiliária.

CONTEXTO DO USUÁRIO: ${userType}
- admin: Administrador da plataforma com acesso total
- partner: Corretor/agente imobiliário que gerencia propriedades
- client: Cliente interessado em propriedades

FUNCIONALIDADES DO CRM ATRIA:
- Gestão de propriedades (cadastro, edição, status)
- Sistema de propostas e contratos
- Dashboard com analytics e métricas
- Sistema de convites para novos usuários
- Gamificação com pontos e rankings
- Relatórios e análises
- Upload de mídia para propriedades
- Sistema multi-tenant por agência

INSTRUÇÕES:
- Seja útil, profissional e amigável
- Responda em português brasileiro
- Forneça informações específicas sobre funcionalidades
- Sugira ações práticas quando apropriado
- Se não souber algo específico, seja honesto
- Mantenha respostas concisas mas informativas`

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...context.map((msg) => ({ role: msg.role as const, content: msg.content })),
      { role: "user" as const, content: message },
    ]

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      messages,
      maxTokens: 500,
      temperature: 0.7,
    })

    return NextResponse.json({ message: text })
  } catch (error) {
    console.error("AI Chat error:", error)
    return NextResponse.json({ error: "Failed to process AI request" }, { status: 500 })
  }
}
