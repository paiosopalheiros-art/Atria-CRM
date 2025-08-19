export interface Client {
  id: string
  name: string
  email: string
  phone: string
  status: "lead" | "interested" | "negotiating" | "closed" | "lost"
  nextFollowUp?: string
  lastContact?: string
  createdAt: string
  budget?: string
  propertyType?: string
  preferredLocation?: string
  notes?: string
  source?: string
}

export interface User {
  id: string
  email: string
  name: string
  userType: "admin" | "partner" | "captador" | "vendedor"
  isActive: boolean
  agencyId?: string
  createdAt: string
}

export interface Interaction {
  id: string
  clientId: string
  userId: string
  type: "call" | "email" | "meeting" | "whatsapp" | "visit"
  description: string
  date: string
  outcome?: string
  nextAction?: string
}

export interface Property {
  id: string
  title: string
  description: string
  price: number
  location: string
  type: "casa" | "apartamento" | "cobertura" | "terreno" | "comercial"
  bedrooms?: number
  bathrooms?: number
  area: number
  images: string[]
  status: "available" | "sold" | "rented" | "reserved"
  ownerId: string
  agencyId: string
  createdAt: string
  updatedAt: string
}
