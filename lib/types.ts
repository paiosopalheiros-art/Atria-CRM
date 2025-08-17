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
