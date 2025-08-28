import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import type { NextRequest } from "next/server"
import { supabase } from "./supabase/client"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const JWT_EXPIRES_IN = "7d"

export interface JWTPayload {
  userId: string
  email: string
  userType: string
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  static generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  }

  static verifyToken(token: string): JWTPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      return null
    }
  }

  static async getUserFromToken(request: NextRequest): Promise<any | null> {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return null
    }

    const payload = this.verifyToken(token)
    if (!payload) {
      return null
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, user_type, creci, cpf, rg, address, phone")
        .eq("email", payload.email)
        .is("deleted_at", null)
        .single()

      if (error || !data) {
        return null
      }

      return data
    } catch (error) {
      console.error("Error fetching user:", error)
      return null
    }
  }

  static async validateInviteCode(code: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("invite_codes")
        .select("id")
        .eq("code", code.toUpperCase())
        .eq("is_active", true)
        .or("expires_at.is.null,expires_at.gt.now()")
        .limit(1)

      return !error && data && data.length > 0
    } catch (error) {
      console.error("Error validating invite code:", error)
      return false
    }
  }

  static async createUser(userData: {
    email: string
    password: string
    fullName: string
    userType: string
    inviteCode: string
    cpf?: string
    rg?: string
    creci?: string
    phone?: string
    address?: string
  }) {
    try {
      console.log("[v0] Creating user with data:", { email: userData.email, userType: userData.userType })

      const isValidCode = await this.validateInviteCode(userData.inviteCode)
      if (!isValidCode) {
        console.log("[v0] Invalid invite code:", userData.inviteCode)
        throw new Error("Código de convite inválido")
      }

      console.log("[v0] Checking if user exists:", userData.email)
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", userData.email)
        .is("deleted_at", null)
        .limit(1)

      if (existingUser && existingUser.length > 0) {
        console.log("[v0] User already exists:", userData.email)
        throw new Error("Usuário já existe com este email")
      }

      console.log("[v0] Hashing password...")
      const hashedPassword = await this.hashPassword(userData.password)

      console.log("[v0] Creating user in database...")
      const { data: newUser, error } = await supabase
        .from("users")
        .insert({
          email: userData.email,
          password_hash: hashedPassword,
          full_name: userData.fullName,
          user_type: userData.userType,
          creci: userData.creci || null,
          cpf: userData.cpf || null,
          rg: userData.rg || null,
          address: userData.address || null,
          phone: userData.phone || null,
        })
        .select("id, email, full_name, user_type, creci, cpf, rg, address, phone, created_at")
        .single()

      if (error || !newUser) {
        throw new Error("Erro ao criar usuário no banco de dados")
      }

      console.log("[v0] User created successfully:", newUser.id)
      return newUser
    } catch (error) {
      console.error("[v0] Error creating user:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Erro ao criar usuário")
    }
  }

  static async authenticateUser(email: string, password: string) {
    try {
      console.log("[v0] Attempting to authenticate user:", email)

      const { data: user, error } = await supabase
        .from("users")
        .select("id, email, full_name, user_type, password_hash")
        .eq("email", email)
        .is("deleted_at", null)
        .single()

      if (error || !user) {
        console.log("[v0] User not found:", email)
        return null
      }

      const isValidPassword = await this.comparePassword(password, user.password_hash)
      if (!isValidPassword) {
        console.log("[v0] Invalid password for user:", email)
        return null
      }

      console.log("[v0] User authenticated successfully:", email)

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
      }
    } catch (error) {
      console.error("[v0] Error during authentication:", error)
      throw new Error("Erro durante autenticação")
    }
  }
}
