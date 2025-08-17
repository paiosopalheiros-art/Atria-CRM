"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Filter, RotateCcw } from "lucide-react"

interface FilterOption {
  key: string
  label: string
  type: "text" | "select" | "number" | "date" | "daterange"
  options?: { value: string; label: string }[]
  placeholder?: string
}

interface AdvancedFiltersProps {
  filters: Record<string, any>
  onFiltersChange: (filters: Record<string, any>) => void
  filterOptions: FilterOption[]
  onClearFilters: () => void
}

export function AdvancedFilters({ filters, onFiltersChange, filterOptions, onClearFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)

  const activeFiltersCount = Object.values(filters).filter(
    (value) => value !== undefined && value !== null && value !== "",
  ).length

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
  }

  const applyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const clearFilters = () => {
    setLocalFilters({})
    onClearFilters()
    setIsOpen(false)
  }

  const removeFilter = (key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    onFiltersChange(newFilters)
  }

  const renderFilterInput = (option: FilterOption) => {
    const value = localFilters[option.key] || ""

    switch (option.type) {
      case "select":
        return (
          <Select value={value} onValueChange={(val) => handleFilterChange(option.key, val)}>
            <SelectTrigger>
              <SelectValue placeholder={option.placeholder || `Selecionar ${option.label}`} />
            </SelectTrigger>
            <SelectContent>
              {option.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      case "number":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleFilterChange(option.key, e.target.value)}
            placeholder={option.placeholder}
          />
        )
      case "date":
        return <Input type="date" value={value} onChange={(e) => handleFilterChange(option.key, e.target.value)} />
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleFilterChange(option.key, e.target.value)}
            placeholder={option.placeholder}
          />
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter toggle and active filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        {/* Active filters display */}
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(filters).map(([key, value]) => {
            if (!value) return null
            const option = filterOptions.find((opt) => opt.key === key)
            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {option?.label}: {value}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeFilter(key)}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Filter panel */}
      {isOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtros Avançados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterOptions.map((option) => (
                <div key={option.key} className="space-y-2">
                  <label className="text-sm font-medium">{option.label}</label>
                  {renderFilterInput(option)}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={applyFilters}>Aplicar Filtros</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
