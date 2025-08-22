import PropertyFeed from "@/components/property-feed"

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral dos imóveis e atividades da plataforma</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">Total de Imóveis</h3>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">Átria Imóveis</h3>
          <p className="text-2xl font-bold">--</p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">CRECI</h3>
          <p className="text-2xl font-bold">--</p>
        </div>
      </div>

      <PropertyFeed />
    </div>
  )
}
