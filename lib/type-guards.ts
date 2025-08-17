import type { User, Property, Client } from "./mock-data"

export function isValidUser(user: any): user is User {
  return (
    user &&
    typeof user.id === "string" &&
    typeof user.fullName === "string" &&
    typeof user.userType === "string" &&
    ["admin", "partner", "captador"].includes(user.userType)
  )
}

export function isValidProperty(property: any): property is Property {
  return (
    property &&
    typeof property.id === "string" &&
    typeof property.title === "string" &&
    typeof property.price === "number" &&
    property.price > 0
  )
}

export function isValidClient(client: any): client is Client {
  return client && typeof client.id === "string" && typeof client.name === "string" && typeof client.email === "string"
}

export function safeGetProperty<T, K extends keyof T>(obj: T | null | undefined, key: K, defaultValue: T[K]): T[K] {
  return obj && obj[key] !== undefined ? obj[key] : defaultValue
}

export function safeGetNestedProperty<T>(obj: any, path: string, defaultValue: T): T {
  try {
    const keys = path.split(".")
    let current = obj

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue
      }
      current = current[key]
    }

    return current !== undefined ? current : defaultValue
  } catch {
    return defaultValue
  }
}
