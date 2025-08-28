export class StorageService {
  private static instance: StorageService
  private readonly prefix = "atria-"

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService()
    }
    return StorageService.instance
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  setItem<T>(key: string, value: T): boolean {
    try {
      const serializedValue = JSON.stringify(value)
      localStorage.setItem(this.getKey(key), serializedValue)
      return true
    } catch (error) {
      console.error(`[StorageService] Error saving ${key}:`, error)
      return false
    }
  }

  getItem<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(this.getKey(key))
      if (item === null) {
        return defaultValue
      }
      return JSON.parse(item) as T
    } catch (error) {
      console.error(`[StorageService] Error reading ${key}:`, error)
      return defaultValue
    }
  }

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(this.getKey(key))
      return true
    } catch (error) {
      console.error(`[StorageService] Error removing ${key}:`, error)
      return false
    }
  }

  clear(): boolean {
    try {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith(this.prefix))
      keys.forEach((key) => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.error("[StorageService] Error clearing storage:", error)
      return false
    }
  }
}

export const storage = StorageService.getInstance()
