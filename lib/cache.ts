import Redis from "ioredis"

class CacheService {
  private redis: Redis | null = null
  private isConnected = false

  constructor() {
    this.connect()
  }

  private async connect() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: Number.parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      })

      await this.redis.ping()
      this.isConnected = true
      console.log("[v0] Redis connected successfully")
    } catch (error) {
      console.warn("[v0] Redis connection failed, falling back to memory cache:", error)
      this.redis = null
      this.isConnected = false
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.redis || !this.isConnected) return null

      const value = await this.redis.get(key)
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error("[v0] Cache get error:", error)
      return null
    }
  }

  async set(key: string, value: any, ttl = 3600): Promise<boolean> {
    try {
      if (!this.redis || !this.isConnected) return false

      await this.redis.setex(key, ttl, JSON.stringify(value))
      return true
    } catch (error) {
      console.error("[v0] Cache set error:", error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.redis || !this.isConnected) return false

      await this.redis.del(key)
      return true
    } catch (error) {
      console.error("[v0] Cache delete error:", error)
      return false
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    try {
      if (!this.redis || !this.isConnected) return false

      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      console.error("[v0] Cache invalidate pattern error:", error)
      return false
    }
  }

  // Cache keys generators
  static keys = {
    user: (id: string) => `user:${id}`,
    userList: (page: number, limit: number) => `users:list:${page}:${limit}`,
    property: (id: string) => `property:${id}`,
    propertyList: (userId: string, page: number, limit: number) => `properties:${userId}:${page}:${limit}`,
    contract: (id: string) => `contract:${id}`,
    contractList: (userId: string, page: number, limit: number) => `contracts:${userId}:${page}:${limit}`,
    notifications: (userId: string, page: number, limit: number) => `notifications:${userId}:${page}:${limit}`,
    stats: (type: string, userId?: string) => (userId ? `stats:${type}:${userId}` : `stats:${type}:global`),
  }
}

export const cache = new CacheService()
export default cache
