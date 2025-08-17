import { supabase } from "./supabase/client"

export interface PaginationParams {
  page?: number
  limit?: number
  cursor?: string
  sort?: string
  order?: "ASC" | "DESC"
  filters?: Record<string, any>
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    currentPage: number
    totalPages: number
    totalItems: number
    hasNextPage: boolean
    hasPreviousPage: boolean
    nextCursor?: string
    previousCursor?: string
    limit: number
  }
}

export class PaginationService {
  // Offset-based pagination (traditional)
  static async offsetPagination<T>(
    tableName: string,
    selectColumns: string,
    filters: Record<string, any> = {},
    options: PaginationParams,
  ): Promise<PaginationResult<T>> {
    const { page = 1, limit = 10 } = options
    const offset = (page - 1) * limit

    try {
      // Build base query with filters
      let query = supabase.from(tableName).select(selectColumns, { count: "exact" })
      let countQuery = supabase.from(tableName).select("*", { count: "exact", head: true })

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
          countQuery = countQuery.eq(key, value)
        }
      })

      // Get total count
      const { count: totalItems, error: countError } = await countQuery
      if (countError) throw countError

      const totalPages = Math.ceil((totalItems || 0) / limit)

      // Get paginated data
      const { data, error } = await query
        .range(offset, offset + limit - 1)
        .order(options.sort || "created_at", { ascending: options.order === "ASC" })

      if (error) throw error

      return {
        data: data as T[],
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalItems || 0,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          limit,
        },
      }
    } catch (error) {
      console.error("[v0] Pagination error:", error)
      return {
        data: [],
        pagination: {
          currentPage: page,
          totalPages: 0,
          totalItems: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          limit,
        },
      }
    }
  }

  // Cursor-based pagination (more efficient for large datasets)
  static async cursorPagination<T>(
    tableName: string,
    selectColumns: string,
    cursorColumn: string,
    filters: Record<string, any> = {},
    options: PaginationParams,
  ): Promise<PaginationResult<T>> {
    const { cursor, limit = 10, order = "DESC" } = options

    try {
      let query = supabase.from(tableName).select(selectColumns)

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value)
        }
      })

      // Apply cursor filter
      if (cursor) {
        if (order === "DESC") {
          query = query.lt(cursorColumn, cursor)
        } else {
          query = query.gt(cursorColumn, cursor)
        }
      }

      // Get one extra to check if there's a next page
      const { data, error } = await query.order(cursorColumn, { ascending: order === "ASC" }).limit(limit + 1)

      if (error) throw error

      const hasNextPage = (data?.length || 0) > limit
      const resultData = hasNextPage ? data?.slice(0, -1) : data
      const nextCursor =
        hasNextPage && resultData && resultData.length > 0 ? resultData[resultData.length - 1][cursorColumn] : undefined

      return {
        data: (resultData as T[]) || [],
        pagination: {
          currentPage: 1, // Not applicable for cursor pagination
          totalPages: 1, // Not applicable for cursor pagination
          totalItems: -1, // Not calculated for performance
          hasNextPage,
          hasPreviousPage: !!cursor,
          nextCursor,
          limit,
        },
      }
    } catch (error) {
      console.error("[v0] Cursor pagination error:", error)
      return {
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: -1,
          hasNextPage: false,
          hasPreviousPage: !!cursor,
          limit,
        },
      }
    }
  }

  // Advanced filtering and sorting for Supabase
  static buildSupabaseQuery(tableName: string, selectColumns: string, filters: Record<string, any>) {
    let query = supabase.from(tableName).select(selectColumns)

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return

      switch (key) {
        case "search":
          query = query.or(`title.ilike.%${value}%,description.ilike.%${value}%`)
          break
        case "dateFrom":
          query = query.gte("created_at", value)
          break
        case "dateTo":
          query = query.lte("created_at", value)
          break
        case "priceMin":
          query = query.gte("price", value)
          break
        case "priceMax":
          query = query.lte("price", value)
          break
        default:
          query = query.eq(key, value)
      }
    })

    return query
  }
}

export default PaginationService
