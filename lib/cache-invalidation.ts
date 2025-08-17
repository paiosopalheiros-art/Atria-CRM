import { cache } from "./cache"

export class CacheInvalidation {
  // Invalidate user-related caches
  static async invalidateUser(userId: string) {
    await Promise.all([
      cache.del(cache.keys.user(userId)),
      cache.invalidatePattern(`user:${userId}:*`),
      cache.invalidatePattern(`notifications:${userId}:*`),
      cache.invalidatePattern(`contracts:${userId}:*`),
    ])
  }

  // Invalidate property-related caches
  static async invalidateProperties(userId?: string) {
    await Promise.all([
      cache.invalidatePattern("properties:*"),
      cache.invalidatePattern("stats:properties*"),
      userId ? cache.del(cache.keys.userProperties(userId)) : Promise.resolve(),
    ])
  }

  // Invalidate contract-related caches
  static async invalidateContracts(userId?: string) {
    await Promise.all([
      cache.invalidatePattern("contracts:*"),
      cache.invalidatePattern("stats:contracts*"),
      userId ? cache.invalidatePattern(`contracts:${userId}:*`) : Promise.resolve(),
    ])
  }

  // Invalidate notification caches
  static async invalidateNotifications(userId: string) {
    await cache.invalidatePattern(`notifications:${userId}:*`)
  }

  // Invalidate all stats
  static async invalidateStats() {
    await cache.invalidatePattern("stats:*")
  }
}
