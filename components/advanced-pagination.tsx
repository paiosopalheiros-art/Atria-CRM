"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  limit: number
}

interface AdvancedPaginationProps {
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
  onGoToPage?: (page: number) => void
  showPageSizeSelector?: boolean
  showGoToPage?: boolean
  showInfo?: boolean
}

export function AdvancedPagination({
  pagination,
  onPageChange,
  onLimitChange,
  onGoToPage,
  showPageSizeSelector = true,
  showGoToPage = true,
  showInfo = true,
}: AdvancedPaginationProps) {
  const { currentPage, totalPages, totalItems, hasNextPage, hasPreviousPage, limit } = pagination

  const handleGoToPage = (page: string) => {
    const pageNum = Number.parseInt(page)
    if (pageNum >= 1 && pageNum <= totalPages && onGoToPage) {
      onGoToPage(pageNum)
    }
  }

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...")
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
      {showInfo && (
        <div className="text-sm text-muted-foreground">
          Mostrando {(currentPage - 1) * limit + 1} a {Math.min(currentPage * limit, totalItems)} de {totalItems}{" "}
          resultados
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* First and Previous buttons */}
        <Button variant="outline" size="sm" onClick={() => onPageChange(1)} disabled={!hasPreviousPage}>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={!hasPreviousPage}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === "number" && onPageChange(page)}
              disabled={page === "..."}
              className="min-w-[40px]"
            >
              {page}
            </Button>
          ))}
        </div>

        {/* Next and Last buttons */}
        <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={!hasNextPage}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange(totalPages)} disabled={!hasNextPage}>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-4">
        {/* Page size selector */}
        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Itens por página:</span>
            <Select value={limit.toString()} onValueChange={(value) => onLimitChange(Number.parseInt(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Go to page */}
        {showGoToPage && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ir para:</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              className="w-16"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleGoToPage((e.target as HTMLInputElement).value)
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
