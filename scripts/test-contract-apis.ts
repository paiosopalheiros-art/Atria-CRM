// Test script for Contract Management APIs
interface TestResult {
  test: string
  passed: boolean
  error?: string
}

class ContractTester {
  private results: TestResult[] = []
  private authToken = ""
  private adminToken = ""
  private partnerToken = ""
  private testPropertyId = ""
  private testContractId = ""
  private testRequestId = ""

  private addResult(test: string, passed: boolean, error?: string) {
    this.results.push({ test, passed, error })
    console.log(`${passed ? "✅" : "❌"} ${test}${error ? `: ${error}` : ""}`)
  }

  async setupAuth() {
    try {
      // Login as captador for basic tests
      const captadorLogin = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "captador@test.com",
          password: "password123",
        }),
      })

      if (captadorLogin.ok) {
        const captadorData = await captadorLogin.json()
        this.authToken = captadorData.data.token
        this.addResult("Captador Authentication Setup", true)
      } else {
        this.addResult("Captador Authentication Setup", false, "Failed to login as captador")
      }

      // Login as partner
      const partnerLogin = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "partner@test.com",
          password: "password123",
        }),
      })

      if (partnerLogin.ok) {
        const partnerData = await partnerLogin.json()
        this.partnerToken = partnerData.data.token
        this.addResult("Partner Authentication Setup", true)
      } else {
        this.addResult("Partner Authentication Setup", false, "Failed to login as partner")
      }

      // Login as admin
      const adminLogin = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "admin@test.com",
          password: "password123",
        }),
      })

      if (adminLogin.ok) {
        const adminData = await adminLogin.json()
        this.adminToken = adminData.data.token
        this.addResult("Admin Authentication Setup", true)
      } else {
        this.addResult("Admin Authentication Setup", false, "Failed to login as admin")
      }
    } catch (error) {
      this.addResult("Authentication Setup", false, error.message)
    }
  }

  async setupTestProperty() {
    try {
      // Create a test property for contract tests
      const propertyData = {
        title: "Contract Test Property",
        description: "Property for contract testing",
        price: 500000,
        propertyType: "house",
        bedrooms: 3,
        bathrooms: 2,
        area: 150,
        address: "123 Contract Street",
        city: "Contract City",
        state: "CC",
        zipCode: "12345",
      }

      const response = await fetch("/api/properties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(propertyData),
      })

      if (response.ok) {
        const data = await response.json()
        this.testPropertyId = data.data.id
        this.addResult("Test Property Setup", true)
      } else {
        this.addResult("Test Property Setup", false, `Status: ${response.status}`)
      }
    } catch (error) {
      this.addResult("Test Property Setup", false, error.message)
    }
  }

  async testCreateContract() {
    try {
      if (!this.testPropertyId) {
        this.addResult("Create Contract", false, "No test property available")
        return
      }

      const contractData = {
        propertyId: this.testPropertyId,
        contractType: "external", // External captador type
        terms: "Test contract terms and conditions",
      }

      // Test without authentication
      const response1 = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contractData),
      })

      this.addResult("Create Contract - No Auth", response1.status === 401)

      // Test with authentication
      const response2 = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(contractData),
      })

      if (response2.ok) {
        const data = await response2.json()
        this.testContractId = data.data.id

        // Verify commission calculation for external captador
        const contract = data.data
        const correctCommission =
          contract.captador_percentage === 30 &&
          contract.partner_percentage === 50 &&
          contract.platform_percentage === 20

        this.addResult("Create Contract - External Captador", correctCommission)
      } else {
        this.addResult("Create Contract - External Captador", false, `Status: ${response2.status}`)
      }

      // Test platform contract type
      const platformContractData = {
        propertyId: this.testPropertyId,
        contractType: "platform",
        terms: "Platform contract terms",
      }

      const response3 = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(platformContractData),
      })

      if (response3.ok) {
        const data = await response3.json()
        const contract = data.data

        // Verify commission calculation for platform
        const correctCommission =
          contract.captador_percentage === 0 &&
          contract.partner_percentage === 50 &&
          contract.platform_percentage === 50

        this.addResult("Create Contract - Platform Type", correctCommission)
      } else {
        this.addResult("Create Contract - Platform Type", false, `Status: ${response3.status}`)
      }

      // Test missing required fields
      const response4 = await fetch("/api/contracts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({ terms: "Missing required fields" }),
      })

      this.addResult("Create Contract - Missing Fields", response4.status === 400)
    } catch (error) {
      this.addResult("Create Contract Tests", false, error.message)
    }
  }

  async testGetContracts() {
    try {
      // Test without authentication
      const response1 = await fetch("/api/contracts")
      this.addResult("Get Contracts - No Auth", response1.status === 401)

      // Test with authentication
      const response2 = await fetch("/api/contracts", {
        headers: { Authorization: `Bearer ${this.authToken}` },
      })

      if (response2.ok) {
        const data = await response2.json()
        const hasContracts = Array.isArray(data.data.contracts)
        const hasPagination = data.data.pagination && typeof data.data.pagination.total === "number"
        this.addResult("Get Contracts - With Auth", hasContracts && hasPagination)
      } else {
        this.addResult("Get Contracts - With Auth", false, `Status: ${response2.status}`)
      }

      // Test with filters
      const response3 = await fetch("/api/contracts?status=pending", {
        headers: { Authorization: `Bearer ${this.authToken}` },
      })

      this.addResult("Get Contracts - With Filters", response3.ok)

      // Test admin access (should see all contracts)
      const response4 = await fetch("/api/contracts", {
        headers: { Authorization: `Bearer ${this.adminToken}` },
      })

      this.addResult("Get Contracts - Admin Access", response4.ok)
    } catch (error) {
      this.addResult("Get Contracts Tests", false, error.message)
    }
  }

  async testContractRequests() {
    try {
      if (!this.testPropertyId) {
        this.addResult("Contract Requests", false, "No test property available")
        return
      }

      const requestData = {
        propertyId: this.testPropertyId,
        message: "I would like to partner on this property",
        experience: "5 years in real estate",
        references: "Previous successful sales",
      }

      // Test create contract request
      const response1 = await fetch("/api/contracts/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.partnerToken}`,
        },
        body: JSON.stringify(requestData),
      })

      if (response1.ok) {
        const data = await response1.json()
        this.testRequestId = data.data.id
        this.addResult("Create Contract Request", true)
      } else {
        this.addResult("Create Contract Request", false, `Status: ${response1.status}`)
      }

      // Test duplicate request (should fail)
      const response2 = await fetch("/api/contracts/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.partnerToken}`,
        },
        body: JSON.stringify(requestData),
      })

      this.addResult("Duplicate Contract Request", response2.status === 400)

      // Test get contract requests
      const response3 = await fetch("/api/contracts/requests", {
        headers: { Authorization: `Bearer ${this.authToken}` },
      })

      this.addResult("Get Contract Requests", response3.ok)

      // Test missing required fields
      const response4 = await fetch("/api/contracts/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.partnerToken}`,
        },
        body: JSON.stringify({ propertyId: this.testPropertyId }),
      })

      this.addResult("Contract Request - Missing Fields", response4.status === 400)
    } catch (error) {
      this.addResult("Contract Request Tests", false, error.message)
    }
  }

  async testContractApproval() {
    try {
      if (!this.testRequestId) {
        this.addResult("Contract Approval", false, "No test request available")
        return
      }

      // Test approve contract request
      const response1 = await fetch(`/api/contracts/requests/${this.testRequestId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.authToken}`, // Property owner
        },
        body: JSON.stringify({ approved: true }),
      })

      this.addResult("Approve Contract Request", response1.ok)

      // Test unauthorized approval
      const response2 = await fetch(`/api/contracts/requests/${this.testRequestId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.partnerToken}`, // Not the owner
        },
        body: JSON.stringify({ approved: true }),
      })

      this.addResult("Unauthorized Contract Approval", response2.status === 403)
    } catch (error) {
      this.addResult("Contract Approval Tests", false, error.message)
    }
  }

  async testContractRepayments() {
    try {
      // Test get repayments
      const response1 = await fetch("/api/contracts/repayments", {
        headers: { Authorization: `Bearer ${this.authToken}` },
      })

      this.addResult("Get Contract Repayments", response1.ok)

      // Test create repayment
      if (this.testContractId) {
        const repaymentData = {
          contractId: this.testContractId,
          amount: 25000, // 5% of 500000
          type: "platform_commission",
        }

        const response2 = await fetch("/api/contracts/repayments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.authToken}`,
          },
          body: JSON.stringify(repaymentData),
        })

        this.addResult("Create Contract Repayment", response2.ok)
      }
    } catch (error) {
      this.addResult("Contract Repayment Tests", false, error.message)
    }
  }

  async testContractStats() {
    try {
      // Test contract statistics
      const response1 = await fetch("/api/contracts/stats", {
        headers: { Authorization: `Bearer ${this.authToken}` },
      })

      if (response1.ok) {
        const data = await response1.json()
        const hasStats = data.data && typeof data.data.totalContracts === "number"
        this.addResult("Contract Statistics", hasStats)
      } else {
        this.addResult("Contract Statistics", false, `Status: ${response1.status}`)
      }

      // Test admin stats (should have more detailed info)
      const response2 = await fetch("/api/contracts/stats", {
        headers: { Authorization: `Bearer ${this.adminToken}` },
      })

      this.addResult("Contract Statistics - Admin", response2.ok)
    } catch (error) {
      this.addResult("Contract Statistics Tests", false, error.message)
    }
  }

  async runAllTests() {
    console.log("🧪 Starting Contract Management API Tests...\n")

    await this.setupAuth()
    await this.setupTestProperty()
    await this.testCreateContract()
    await this.testGetContracts()
    await this.testContractRequests()
    await this.testContractApproval()
    await this.testContractRepayments()
    await this.testContractStats()

    console.log("\n📊 Test Results Summary:")
    const passed = this.results.filter((r) => r.passed).length
    const total = this.results.length

    console.log(`Passed: ${passed}/${total}`)

    if (passed < total) {
      console.log("\n❌ Failed Tests:")
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.log(`- ${r.test}: ${r.error || "Unknown error"}`)
        })
    }

    return { passed, total, results: this.results }
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new ContractTester()
  tester.runAllTests().then((results) => {
    process.exit(results.passed === results.total ? 0 : 1)
  })
}

export default ContractTester
