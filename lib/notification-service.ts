import { supabase } from "@/lib/supabase/client"

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: "proposal" | "property" | "contract" | "system" | "visit" | "sale"
  data?: any
}

export class NotificationService {
  static async createNotification(notification: NotificationData): Promise<void> {
    try {
      await supabase.from("notifications").insert({
        user_id: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data ? JSON.stringify(notification.data) : null,
      })
    } catch (error) {
      console.error("Error creating notification:", error)
    }
  }

  static async createBulkNotifications(notifications: NotificationData[]): Promise<void> {
    try {
      const notificationRecords = notifications.map((n) => ({
        user_id: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        data: n.data ? JSON.stringify(n.data) : null,
      }))

      await supabase.from("notifications").insert(notificationRecords)
    } catch (error) {
      console.error("Error creating bulk notifications:", error)
    }
  }

  // Property-related notifications
  static async notifyPropertyApproved(propertyId: string, ownerId: string, propertyTitle: string): Promise<void> {
    await this.createNotification({
      userId: ownerId,
      title: "Propriedade Aprovada",
      message: `Sua propriedade "${propertyTitle}" foi aprovada e está agora visível no feed.`,
      type: "property",
      data: { propertyId, action: "approved" },
    })
  }

  static async notifyPropertyRejected(propertyId: string, ownerId: string, propertyTitle: string): Promise<void> {
    await this.createNotification({
      userId: ownerId,
      title: "Propriedade Rejeitada",
      message: `Sua propriedade "${propertyTitle}" foi rejeitada. Entre em contato com o suporte para mais informações.`,
      type: "property",
      data: { propertyId, action: "rejected" },
    })
  }

  // Contract-related notifications
  static async notifyContractCreated(contractId: string, partnerId: string, propertyTitle: string): Promise<void> {
    await this.createNotification({
      userId: partnerId,
      title: "Novo Contrato de Comissão",
      message: `Um novo contrato foi criado para a propriedade "${propertyTitle}".`,
      type: "contract",
      data: { contractId, action: "created" },
    })
  }

  static async notifyContractSigned(contractId: string, userId: string, propertyTitle: string): Promise<void> {
    await this.createNotification({
      userId: userId,
      title: "Contrato Assinado",
      message: `O contrato para a propriedade "${propertyTitle}" foi assinado com sucesso.`,
      type: "contract",
      data: { contractId, action: "signed" },
    })
  }

  // Proposal-related notifications
  static async notifyNewProposal(
    propertyId: string,
    ownerId: string,
    propertyTitle: string,
    clientName: string,
  ): Promise<void> {
    await this.createNotification({
      userId: ownerId,
      title: "Nova Proposta Recebida",
      message: `${clientName} enviou uma proposta para "${propertyTitle}".`,
      type: "proposal",
      data: { propertyId, clientName, action: "new" },
    })
  }

  static async notifyProposalAccepted(proposalId: string, clientId: string, propertyTitle: string): Promise<void> {
    await this.createNotification({
      userId: clientId,
      title: "Proposta Aceita",
      message: `Sua proposta para "${propertyTitle}" foi aceita!`,
      type: "proposal",
      data: { proposalId, action: "accepted" },
    })
  }

  // System notifications
  static async notifySystemMaintenance(userIds: string[]): Promise<void> {
    const notifications = userIds.map((userId) => ({
      userId,
      title: "Manutenção Programada",
      message: "O sistema passará por manutenção programada amanhã das 2h às 4h.",
      type: "system" as const,
      data: { maintenanceWindow: "2024-01-20T02:00:00Z" },
    }))

    await this.createBulkNotifications(notifications)
  }

  static async notifyNewFeature(userIds: string[], featureName: string): Promise<void> {
    const notifications = userIds.map((userId) => ({
      userId,
      title: "Nova Funcionalidade",
      message: `Confira a nova funcionalidade: ${featureName}!`,
      type: "system" as const,
      data: { feature: featureName },
    }))

    await this.createBulkNotifications(notifications)
  }
}
