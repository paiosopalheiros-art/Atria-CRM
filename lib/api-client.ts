class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ data: T; success: boolean; message?: string }> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error(`API Error (${endpoint}): Server returned non-JSON response:`, text)
        throw new Error(`Servidor retornou erro interno. Status: ${response.status}`)
      }

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || "API request failed")
      }

      return result
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      throw error
    }
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: any) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" })
  }

  // Users
  async getUsers(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`/users${query}`)
  }

  async getUser(id: string) {
    return this.request(`/users/${id}`)
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getUserProfile() {
    return this.request("/users/profile")
  }

  async updateUserProfile(data: any) {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request("/users/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  // Properties
  async getProperties(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`/properties${query}`)
  }

  async getProperty(id: string) {
    return this.request(`/properties/${id}`)
  }

  async createProperty(data: any) {
    return this.request("/properties", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateProperty(id: string, data: any) {
    return this.request(`/properties/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteProperty(id: string) {
    return this.request(`/properties/${id}`, { method: "DELETE" })
  }

  async approveProperty(id: string) {
    return this.request(`/properties/${id}/approve`, { method: "POST" })
  }

  async rejectProperty(id: string, reason?: string) {
    return this.request(`/properties/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    })
  }

  // Contracts
  async getContracts(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`/contracts${query}`)
  }

  async getContract(id: string) {
    return this.request(`/contracts/${id}`)
  }

  async createContract(data: any) {
    return this.request("/contracts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateContract(id: string, data: any) {
    return this.request(`/contracts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Contract Requests
  async getContractRequests(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`/contracts/requests${query}`)
  }

  async createContractRequest(data: any) {
    return this.request("/contracts/requests", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async approveContractRequest(id: string, action: "approve" | "reject", reason?: string) {
    return this.request(`/contracts/requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    })
  }

  // Notifications
  async getNotifications(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`/notifications${query}`)
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}`, {
      method: "PUT",
      body: JSON.stringify({ read: true }),
    })
  }

  async markAllNotificationsAsRead() {
    return this.request("/notifications/mark-all-read", { method: "POST" })
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, { method: "DELETE" })
  }

  async getNotificationPreferences() {
    return this.request("/notifications/preferences")
  }

  async updateNotificationPreferences(preferences: any) {
    return this.request("/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(preferences),
    })
  }

  // Invite Codes
  async getInviteCodes() {
    return this.request("/users/invite-codes")
  }

  async createInviteCode(data: any) {
    return this.request("/users/invite-codes", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateInviteCode(id: string, data: any) {
    return this.request(`/users/invite-codes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Statistics
  async getPropertyStats() {
    return this.request("/properties/stats")
  }

  async getContractStats() {
    return this.request("/contracts/stats")
  }

  async getUserStats() {
    return this.request("/users/stats")
  }

  async getNotificationStats() {
    return this.request("/notifications/stats")
  }
}

export const apiClient = new ApiClient()
