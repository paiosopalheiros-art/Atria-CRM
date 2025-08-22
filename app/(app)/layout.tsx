import type React from "react"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={inter.className}>
      <div className="min-h-screen bg-background">
        {/* App Navigation */}
        <nav className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <h1 className="text-xl font-bold">Átria CRM</h1>
                <div className="hidden md:flex space-x-4">
                  <a href="/dashboard" className="text-sm hover:text-primary">
                    Dashboard
                  </a>
                  <a href="/admin/feeds" className="text-sm hover:text-primary">
                    Feeds
                  </a>
                  <a href="/admin/properties" className="text-sm hover:text-primary">
                    Imóveis
                  </a>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main>{children}</main>
      </div>
    </div>
  )
}
