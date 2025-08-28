import { z } from "zod"

const envSchema = z.object({
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  SUPABASE_JWT_SECRET: z.string().min(1, "SUPABASE_JWT_SECRET is required"),

  // Database Configuration
  POSTGRES_URL: z.string().url("POSTGRES_URL must be a valid URL").optional(),
  POSTGRES_PRISMA_URL: z.string().url("POSTGRES_PRISMA_URL must be a valid URL").optional(),
  POSTGRES_URL_NON_POOLING: z.string().url("POSTGRES_URL_NON_POOLING must be a valid URL").optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DATABASE: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),

  // Application Configuration
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").optional(),
  NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: z.string().url().optional(),

  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
})

function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join("\n")

      console.warn("⚠️ Environment validation failed, running in demo mode:")
      console.warn(missingVars)
      console.warn("\n📝 To use real Supabase, configure these variables in Project Settings.")
      console.warn(
        "🔗 Required variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_JWT_SECRET",
      )

      // Return default values for demo mode
      return {
        NODE_ENV: process.env.NODE_ENV || "development",
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-key",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "demo-service-key",
        SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET || "demo-jwt-secret",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://web-mobile-connect.preview.emergentagent.com",
        NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || "https://web-mobile-connect.preview.emergentagent.com"
      }
    }
    throw error
  }
}

export const env = validateEnv()

export function validateSupabaseConfig() {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing Supabase configuration: ${missing.join(", ")}`)
  }

  return requiredVars as Record<keyof typeof requiredVars, string>
}

export type Env = z.infer<typeof envSchema>
