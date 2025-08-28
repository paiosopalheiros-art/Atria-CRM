"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Target,
  Star,
  TrendingUp,
  DollarSign,
  BarChart3,
  PieChartIcon as PieIcon,
  Download,
  Filter,
  Clock,
  Award,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Line,
  Area,
  AreaChart,
  Pie, // Import the Pie component
} from "recharts"
import type { Client } from "@/app/page"

interface ClientStatsProps {
  clients: Client[]
}

export function ClientStats({ clients }: ClientStatsProps) {
  const [timeRange, setTimeRange] = useState("30")
  const [selectedMetric, setSelectedMetric] = useState("conversions")

  // Calculate date ranges
  const getDateRange = (days: number) => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    return { startDate, endDate }
  }

  // Filter clients by time range
  const filteredClients = useMemo(() => {
    const { startDate } = getDateRange(Number.parseInt(timeRange))
    return clients.filter((client) => new Date(client.createdAt) >= startDate)
  }, [clients, timeRange])

  // Basic statistics
  const stats = useMemo(() => {
    const totalClients = clients.length
    const hotClients = clients.filter((c) => c.status === "hot").length
    const warmClients = clients.filter((c) => c.status === "warm").length
    const coldClients = clients.filter((c) => c.status === "cold").length
    const closedClients = clients.filter((c) => c.status === "closed").length

    const conversionRate = totalClients > 0 ? (closedClients / totalClients) * 100 : 0
    const hotConversionRate = hotClients > 0 ? (closedClients / (hotClients + closedClients)) * 100 : 0

    // Budget analysis
    const totalBudget = clients.reduce((sum, client) => sum + client.budget, 0)
    const averageBudget = totalClients > 0 ? totalBudget / totalClients : 0
    const hotClientsBudget = clients.filter((c) => c.status === "hot").reduce((sum, client) => sum + client.budget, 0)
    const closedClientsBudget = clients
      .filter((c) => c.status === "closed")
      .reduce((sum, client) => sum + client.budget, 0)

    // Recent activity
    const recentClients = filteredClients.length
    const needsFollowUp = clients.filter((c) => {
      if (!c.nextFollowUp) return false
      return new Date(c.nextFollowUp) <= new Date()
    }).length

    return {
      totalClients,
      hotClients,
      warmClients,
      coldClients,
      closedClients,
      conversionRate,
      hotConversionRate,
      totalBudget,
      averageBudget,
      hotClientsBudget,
      closedClientsBudget,
      recentClients,
      needsFollowUp,
    }
  }, [clients, filteredClients])

  // Time series data for trends
  const timeSeriesData = useMemo(() => {
    const days = Number.parseInt(timeRange)
    const data = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      const dayClients = clients.filter((c) => c.createdAt === dateStr)
      const dayConversions = dayClients.filter((c) => c.status === "closed")
      const dayHotClients = dayClients.filter((c) => c.status === "hot")

      data.push({
        date: date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" }),
        fullDate: dateStr,
        newClients: dayClients.length,
        conversions: dayConversions.length,
        hotClients: dayHotClients.length,
        revenue: dayConversions.reduce((sum, c) => sum + c.budget, 0),
      })
    }

    return data
  }, [clients, timeRange])

  // Source analysis
  const sourceData = useMemo(() => {
    const sourceStats = clients.reduce(
      (acc, client) => {
        const source = client.source || "Não informado"
        acc[source] = (acc[source] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(sourceStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [clients])

  // Status distribution for pie chart
  const statusData = [
    { name: "Quentes", value: stats.hotClients, color: "#ef4444" },
    { name: "Mornos", value: stats.warmClients, color: "#f97316" },
    { name: "Frios", value: stats.coldClients, color: "#3b82f6" },
    { name: "Fechados", value: stats.closedClients, color: "#22c55e" },
  ].filter((item) => item.value > 0)

  // Performance metrics
  const performanceData = useMemo(() => {
    const last30Days = clients.filter((c) => {
      const clientDate = new Date(c.createdAt)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return clientDate >= thirtyDaysAgo
    })

    const last60Days = clients.filter((c) => {
      const clientDate = new Date(c.createdAt)
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
      return clientDate >= sixtyDaysAgo
    })

    return [
      {
        period: "Últimos 30 dias",
        newClients: last30Days.length,
        conversions: last30Days.filter((c) => c.status === "closed").length,
        revenue: last30Days.filter((c) => c.status === "closed").reduce((sum, c) => sum + c.budget, 0),
        conversionRate:
          last30Days.length > 0
            ? (last30Days.filter((c) => c.status === "closed").length / last30Days.length) * 100
            : 0,
      },
      {
        period: "Últimos 60 dias",
        newClients: last60Days.length,
        conversions: last60Days.filter((c) => c.status === "closed").length,
        revenue: last60Days.filter((c) => c.status === "closed").reduce((sum, c) => sum + c.budget, 0),
        conversionRate:
          last60Days.length > 0
            ? (last60Days.filter((c) => c.status === "closed").length / last60Days.length) * 100
            : 0,
      },
    ]
  }, [clients])

  // Pipeline analysis
  const pipelineData = useMemo(() => {
    const pipeline = [
      {
        stage: "Leads Frios",
        count: stats.coldClients,
        value: clients.filter((c) => c.status === "cold").reduce((sum, c) => sum + c.budget, 0),
      },
      {
        stage: "Prospects Mornos",
        count: stats.warmClients,
        value: clients.filter((c) => c.status === "warm").reduce((sum, c) => sum + c.budget, 0),
      },
      { stage: "Clientes Quentes", count: stats.hotClients, value: stats.hotClientsBudget },
      { stage: "Negócios Fechados", count: stats.closedClients, value: stats.closedClientsBudget },
    ]
    return pipeline
  }, [stats, clients])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: `${timeRange} dias`,
      summary: stats,
      clients: clients.map((c) => ({
        name: c.name,
        status: c.status,
        budget: c.budget,
        source: c.source,
        createdAt: c.createdAt,
      })),
    }

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `crm-report-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={exportReport} variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.closedClients} de {stats.totalClients} clientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Fechada</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.closedClientsBudget)}</div>
            <p className="text-xs text-muted-foreground">{stats.closedClients} negócios fechados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Quente</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.hotClientsBudget)}</div>
            <p className="text-xs text-muted-foreground">{stats.hotClients} clientes quentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.needsFollowUp}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="sources">Origens</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendências Temporais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  newClients: {
                    label: "Novos Clientes",
                    color: "hsl(var(--chart-1))",
                  },
                  conversions: {
                    label: "Conversões",
                    color: "hsl(var(--chart-2))",
                  },
                  hotClients: {
                    label: "Clientes Quentes",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Area
                      type="monotone"
                      dataKey="newClients"
                      stackId="1"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.6}
                    />
                    <Area
                      type="monotone"
                      dataKey="conversions"
                      stackId="2"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.6}
                    />
                    <Line type="monotone" dataKey="hotClients" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieIcon className="h-5 w-5" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    value: {
                      label: "Clientes",
                    },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {statusData.map((status) => (
                  <div key={status.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                        <span>{status.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{status.value}</span>
                        <span className="text-sm text-muted-foreground">
                          ({stats.totalClients > 0 ? ((status.value / stats.totalClients) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={stats.totalClients > 0 ? (status.value / stats.totalClients) * 100 : 0}
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sources">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análise de Origens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Clientes",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[400px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourceData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Análise do Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {pipelineData.map((stage, index) => (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{stage.stage}</h4>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">{stage.count} clientes</Badge>
                        <span className="font-medium">{formatCurrency(stage.value)}</span>
                      </div>
                    </div>
                    <Progress
                      value={stats.totalClients > 0 ? (stage.count / stats.totalClients) * 100 : 0}
                      className="h-3"
                    />
                    <p className="text-xs text-muted-foreground">
                      {stats.totalClients > 0 ? ((stage.count / stats.totalClients) * 100).toFixed(1) : 0}% do total
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Comparativo de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {performanceData.map((period) => (
                    <div key={period.period} className="space-y-3">
                      <h4 className="font-medium">{period.period}</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Novos Clientes</p>
                          <p className="text-2xl font-bold">{period.newClients}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conversões</p>
                          <p className="text-2xl font-bold text-green-600">{period.conversions}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Receita</p>
                          <p className="text-lg font-bold">{formatCurrency(period.revenue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Taxa Conversão</p>
                          <p className="text-lg font-bold">{period.conversionRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ticket Médio</span>
                    <span className="font-medium">{formatCurrency(stats.averageBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Ticket Médio (Fechados)</span>
                    <span className="font-medium">
                      {formatCurrency(stats.closedClients > 0 ? stats.closedClientsBudget / stats.closedClients : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Taxa Conversão Quentes</span>
                    <span className="font-medium text-red-600">{stats.hotConversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Pipeline Total</span>
                    <span className="font-medium">{formatCurrency(stats.totalBudget)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Eficiência Follow-up</span>
                    <span className="font-medium">
                      {stats.totalClients > 0
                        ? (((stats.totalClients - stats.needsFollowUp) / stats.totalClients) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
