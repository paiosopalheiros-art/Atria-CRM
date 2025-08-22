export const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY ||
  "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"

export const openaiConfig = {
  apiKey: OPENAI_API_KEY,
  model: "gpt-4o-mini",
  maxTokens: 500,
  temperature: 0.7,
}
