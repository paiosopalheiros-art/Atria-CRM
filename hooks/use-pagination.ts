"use client"

import { useState, useCallback, useMemo } from "react"

interface UsePaginationProps {
  initialPage?: number
  initialLimit?: number
  initialFilters?: Record<string, any>
  initialSort?: string
  initialOrder?: "ASC" | "DESC"
}

interface PaginationState {
  page: number
  limit: number
  filters: Record<string, any>
  sort: string
  order: "ASC" | "DESC"
}

export function usePagination({
  initialPage = 1,
  initialLimit = 10,
  initialFilters = {},
  initialSort = "created_at",
  initialOrder = "DESC",
}: UsePaginationProps = {}) {
  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    filters: initialFilters,
    sort: initialSort,
    order: initialOrder,
  })

  const setPage = useCallback((page: number) => {
    setState((prev) => ({ ...prev, page }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setState((prev) => ({ ...prev, limit, page: 1 })) // Reset to first page when changing limit
  }, [])

  const setFilters = useCallback((filters: Record<string, any>) => {
    setState((prev) => ({ ...prev, filters, page: 1 })) // Reset to first page when filtering
  }, [])

  const updateFilter = useCallback((key: string, value: any) => {
    setState((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
      page: 1,
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: {}, page: 1 }))
  }, [])

  const setSort = useCallback((sort: string, order: "ASC" | "DESC" = "DESC") => {
    setState((prev) => ({ ...prev, sort, order, page: 1 }))
  }, [])

  const reset = useCallback(() => {
    setState({
      page: initialPage,
      limit: initialLimit,
      filters: initialFilters,
      sort: initialSort,
      order: initialOrder,
    })
  }, [initialPage, initialLimit, initialFilters, initialSort, initialOrder])

  const queryParams = useMemo(
    () => ({
      page: state.page,
      limit: state.limit,
      sort: state.sort,
      order: state.order,
      ...state.filters,
    }),
    [state],
  )

  return {
    ...state,
    setPage,
    setLimit,
    setFilters,
    updateFilter,
    clearFilters,
    setSort,
    reset,
    queryParams,
  }
}
