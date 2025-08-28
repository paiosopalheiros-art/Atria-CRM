"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Phone, Mail, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

interface Client {
  id: string
  full_name: string
  email: string
  phone: string
  status: "lead" | "interested" | "negotiating" | "closed" | "lost"
  created_at: string
  user_id: string
}

interface FollowUpTask {
  id: string
  client_id: string
  client_name: string
  task_type: "call" | "email" | "meeting" | "whatsapp"
  due_date: string
  priority: "low" | "medium" | "high"
  notes: string
  completed: boolean
  user_id: string
  created_at: string
}

interface FollowUpAlertsProps {
  userId: string
}

export function FollowUpAlerts({ userId }: FollowUpAlertsProps) {
  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedTask, setSelectedTask] = useState<FollowUpTask | null>(null)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [newTask, setNewTask] = useState({
    task_type: "call" as FollowUpTask["task_type"],
    due_date: "",
    priority: "medium" as FollowUpTask["priority"],
    notes: "",
  })

  useEffect(() => {
    loadFollowUpTasks()
    loadClients()
  }, [userId])

  const loadFollowUpTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("follow_up_tasks")
        .select("*")
        .eq("user_id", userId)
        .order("due_date", { ascending: true })

      if (error) throw error
      setFollowUpTasks(data || [])
    } catch (error) {
      console.error("[v0] Error loading follow-up tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, full_name, email, phone, status, created_at, user_id")
        .eq("user_id", userId)

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error("[v0] Error loading clients:", error)
    }
  }

  const addFollowUpTask = async () => {
    if (!selectedClient || !newTask.due_date) return

    try {
      const { data, error } = await supabase
        .from("follow_up_tasks")
        .insert([
          {
            client_id: selectedClient.id,
            client_name: selectedClient.full_name,
            task_type: newTask.task_type,
            due_date: newTask.due_date,
            priority: newTask.priority,
            notes: newTask.notes,
            completed: false,
            user_id: userId,
          },
        ])
        .select()
        .single()

      if (error) throw error
      setFollowUpTasks((prev) => [...prev, data])

      // Reset form
      setNewTask({
        task_type: "call",
        due_date: "",
        priority: "medium",
        notes: "",
      })
      setSelectedClient(null)
      setIsScheduleDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error adding follow-up task:", error)
    }
  }

  const completeTask = async (taskId: string, interactionNotes?: string) => {
    try {
      const { error } = await supabase.from("follow_up_tasks").update({ completed: true }).eq("id", taskId)

      if (error) throw error

      setFollowUpTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, completed: true } : task)))

      // Add interaction record if notes provided
      if (interactionNotes) {
        const task = followUpTasks.find((t) => t.id === taskId)
        if (task) {
          await supabase.from("client_interactions").insert([
            {
              client_id: task.client_id,
              interaction_type: task.task_type,
              notes: interactionNotes,
              user_id: userId,
            },
          ])
        }
      }
    } catch (error) {
      console.error("[v0] Error completing task:", error)
    }
  }

  const getOverdueTasks = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return followUpTasks.filter((task) => !task.completed && new Date(task.due_date) < today)
  }

  const getTodayTasks = () => {
    const today = new Date().toISOString().split("T")[0]
    return followUpTasks.filter((task) => !task.completed && task.due_date === today)
  }

  const getUpcomingTasks = () => {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return followUpTasks.filter(
      (task) => !task.completed && new Date(task.due_date) > today && new Date(task.due_date) <= nextWeek,
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "meeting":
        return <Calendar className="h-4 w-4" />
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Carregando follow-ups...</div>
  }

  const overdueTasks = getOverdueTasks()
  const todayTasks = getTodayTasks()
  const upcomingTasks = getUpcomingTasks()

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{todayTasks.length}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingTasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule New Follow-up */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agendar Follow-up</CardTitle>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button>Novo Follow-up</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agendar Follow-up</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select
                      value={selectedClient?.id || ""}
                      onValueChange={(value) => {
                        const client = clients.find((c) => c.id === value)
                        setSelectedClient(client || null)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={newTask.task_type}
                        onValueChange={(value: FollowUpTask["task_type"]) =>
                          setNewTask({ ...newTask, task_type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="call">Ligação</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="meeting">Reunião</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select
                        value={newTask.priority}
                        onValueChange={(value: FollowUpTask["priority"]) => setNewTask({ ...newTask, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={newTask.notes}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      placeholder="Detalhes do follow-up..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addFollowUpTask}>Agendar</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Task Lists */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Follow-ups Atrasados ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueTasks.map((task) => (
              <TaskCard key={task.id} task={task} onComplete={completeTask} isOverdue />
            ))}
          </CardContent>
        </Card>
      )}

      {todayTasks.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Follow-ups de Hoje ({todayTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} onComplete={completeTask} />
            ))}
          </CardContent>
        </Card>
      )}

      {upcomingTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Follow-ups ({upcomingTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTasks.map((task) => (
              <TaskCard key={task.id} task={task} onComplete={completeTask} />
            ))}
          </CardContent>
        </Card>
      )}

      {overdueTasks.length === 0 && todayTasks.length === 0 && upcomingTasks.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum follow-up pendente!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface TaskCardProps {
  task: FollowUpTask
  onComplete: (taskId: string, notes?: string) => void
  isOverdue?: boolean
}

function TaskCard({ task, onComplete, isOverdue }: TaskCardProps) {
  const [isCompleting, setIsCompleting] = useState(false)
  const [completionNotes, setCompletionNotes] = useState("")

  const handleComplete = () => {
    onComplete(task.id, completionNotes)
    setIsCompleting(false)
    setCompletionNotes("")
  }

  const getTaskIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />
      case "email":
        return <Mail className="h-4 w-4" />
      case "meeting":
        return <Calendar className="h-4 w-4" />
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className={`p-4 rounded-lg border ${isOverdue ? "bg-red-50 border-red-200" : "bg-card"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getTaskIcon(task.task_type)}
            <span className="font-medium">{task.client_name}</span>
          </div>
          <Badge className={getPriorityColor(task.priority)}>
            {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
          </Badge>
          <span className="text-sm text-muted-foreground">{new Date(task.due_date).toLocaleDateString("pt-BR")}</span>
        </div>
        <Button size="sm" onClick={() => setIsCompleting(true)}>
          Concluir
        </Button>
      </div>

      {task.notes && <p className="text-sm text-muted-foreground mt-2">{task.notes}</p>}

      {isCompleting && (
        <div className="mt-4 space-y-3 border-t pt-3">
          <Textarea
            placeholder="Adicione observações sobre este follow-up..."
            value={completionNotes}
            onChange={(e) => setCompletionNotes(e.target.value)}
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCompleting(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleComplete}>
              Confirmar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
