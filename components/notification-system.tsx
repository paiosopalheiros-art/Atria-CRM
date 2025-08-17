"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, X, AlertTriangle, Clock, CheckCircle } from "lucide-react"
import { storage } from "@/lib/storage-service"
import { safeGetProperty } from "@/lib/type-guards"
import type { Client } from "@/lib/mock-data"

interface Notification {
  id: string
  type: "overdue" | "today" | "hot_client" | "new_client"
  title: string
  message: string
  clientId?: string
  timestamp: string
  read: boolean
}

interface NotificationSystemProps {
  clients: Client[]
}

export function NotificationSystem({ clients }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    generateNotifications()
  }, [clients])

  const generateNotifications = () => {
    const newNotifications: Notification[] = []
    const today = new Date().toISOString().split("T")[0]

    clients.forEach((client) => {
      const clientName = safeGetProperty(client, "name", "Cliente sem nome")
      const nextFollowUp = safeGetProperty(client, "nextFollowUp", null)
      const status = safeGetProperty(client, "status", "cold")
      const lastContact = safeGetProperty(client, "lastContact", null)
      const createdAt = safeGetProperty(client, "createdAt", null)

      // Check for overdue follow-ups
      if (nextFollowUp && new Date(nextFollowUp) < new Date(today)) {
        newNotifications.push({
          id: `overdue-${client.id}`,
          type: "overdue",
          title: "Follow-up Atrasado",
          message: `${clientName} tem follow-up atrasado desde ${new Date(nextFollowUp).toLocaleDateString("pt-BR")}`,
          clientId: client.id,
          timestamp: new Date().toISOString(),
          read: false,
        })
      }

      // Check for today's follow-ups
      if (nextFollowUp === today) {
        newNotifications.push({
          id: `today-${client.id}`,
          type: "today",
          title: "Follow-up Hoje",
          message: `Lembre-se de entrar em contato com ${clientName} hoje`,
          clientId: client.id,
          timestamp: new Date().toISOString(),
          read: false,
        })
      }

      // Check for hot clients without recent contact
      if (status === "hot" && lastContact) {
        const lastContactDate = new Date(lastContact)
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

        if (lastContactDate < threeDaysAgo) {
          const daysSinceContact = Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24))
          newNotifications.push({
            id: `hot-${client.id}`,
            type: "hot_client",
            title: "Cliente Quente Sem Contato",
            message: `${clientName} está quente mas não tem contato há ${daysSinceContact} dias`,
            clientId: client.id,
            timestamp: new Date().toISOString(),
            read: false,
          })
        }
      }

      // Check for new clients
      if (createdAt === today) {
        newNotifications.push({
          id: `new-${client.id}`,
          type: "new_client",
          title: "Novo Cliente",
          message: `${clientName} foi adicionado ao sistema hoje`,
          clientId: client.id,
          timestamp: new Date().toISOString(),
          read: false,
        })
      }
    })

    const existingNotifications = storage.getItem<Notification[]>("notifications", [])

    // Merge with new notifications, avoiding duplicates
    const allNotifications = [...existingNotifications]
    newNotifications.forEach((newNotif) => {
      if (!existingNotifications.find((existing) => existing.id === newNotif.id)) {
        allNotifications.push(newNotif)
      }
    })

    // Keep only last 50 notifications
    const recentNotifications = allNotifications
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50)

    setNotifications(recentNotifications)
    storage.setItem("notifications", recentNotifications)
  }

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map((notif) =>
      notif.id === notificationId ? { ...notif, read: true } : notif,
    )
    setNotifications(updatedNotifications)
    storage.setItem("notifications", updatedNotifications)
  }

  const dismissNotification = (notificationId: string) => {
    const updatedNotifications = notifications.filter((notif) => notif.id !== notificationId)
    setNotifications(updatedNotifications)
    storage.setItem("notifications", updatedNotifications)
  }

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map((notif) => ({ ...notif, read: true }))
    setNotifications(updatedNotifications)
    storage.setItem("notifications", updatedNotifications)
  }

  const unreadCount = notifications.filter((notif) => !notif.read).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "today":
        return <Clock className="h-4 w-4 text-orange-500" />
      case "hot_client":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "new_client":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "overdue":
        return "border-red-200 bg-red-50"
      case "today":
        return "border-orange-200 bg-orange-50"
      case "hot_client":
        return "border-red-200 bg-red-50"
      case "new_client":
        return "border-green-200 bg-green-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setShowNotifications(!showNotifications)} className="relative">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto bg-background border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notificações</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Marcar todas como lidas
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">Nenhuma notificação</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b hover:bg-muted/50 ${!notification.read ? "bg-muted/30" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">{notification.title}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissNotification(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.timestamp).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="mt-2">
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                        Marcar como lida
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
