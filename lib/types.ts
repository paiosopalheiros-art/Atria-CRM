export interface Contract {
  id: string
  propertyId: string
  propertyTitle: string
  captatorId: string
  captatorName: string
  partnerId?: string
  partnerName?: string
  commissionSplit: {
    captator: number
    partner: number
  }
  terms: string
  status: "pending" | "signed" | "rejected" | "expired"
  createdAt: string
  signedAt?: string
  expiresAt: string
}

export interface ContractNotification {
  id: string
  contractId: string
  userId: string
  type: "contract_created" | "contract_signed" | "contract_rejected"
  message: string
  read: boolean
  createdAt: string
}

export interface Client {
  id: string
  full_name: string
  email: string
  phone: string
  cpf?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  budget?: string
  property_type?: string
  preferred_location?: string
  notes?: string
  status: "lead" | "interested" | "negotiating" | "closed" | "lost"
  source?: string
  created_at: string
  user_id: string
  last_contact?: string
}

export interface Visit {
  id: string
  client_id: string
  property_id?: string
  visit_date: string
  visit_time: string
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  notes?: string
  rating?: number
  feedback?: string
  created_at: string
  user_id: string
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
