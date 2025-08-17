// Sistema de teste de bugs para o CRM Atria
// Testa todas as funcionalidades principais e identifica problemas

import { supabase } from "@/lib/supabase/client"

async function testSystemAPIs() {
  console.log("[v0] Starting comprehensive bug test...")

  const results = {
    database: false,
    auth: false,
    properties: false,
    contracts: false,
    proposals: false,
    notifications: false,
    inviteCodes: false,
    errors: [] as string[],
  }

  try {
    // Test 1: Database connectivity
    console.log("[v0] Testing database connectivity...")
    const { data: agencies, error: dbError } = await supabase.from("agencies").select("*").limit(1)

    if (dbError) {
      results.errors.push(`Database error: ${dbError.message}`)
    } else {
      results.database = true
      console.log("[v0] Database connectivity: ✅")
    }

    // Test 2: Properties API
    console.log("[v0] Testing properties API...")
    const propertiesResponse = await fetch("/api/properties", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!propertiesResponse.ok) {
      results.errors.push(`Properties API error: ${propertiesResponse.status}`)
    } else {
      results.properties = true
      console.log("[v0] Properties API: ✅")
    }

    // Test 3: Contracts API
    console.log("[v0] Testing contracts API...")
    const contractsResponse = await fetch("/api/contracts", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!contractsResponse.ok) {
      results.errors.push(`Contracts API error: ${contractsResponse.status}`)
    } else {
      results.contracts = true
      console.log("[v0] Contracts API: ✅")
    }

    // Test 4: Proposals API
    console.log("[v0] Testing proposals API...")
    const proposalsResponse = await fetch("/api/proposals", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!proposalsResponse.ok) {
      results.errors.push(`Proposals API error: ${proposalsResponse.status}`)
    } else {
      results.proposals = true
      console.log("[v0] Proposals API: ✅")
    }

    // Test 5: Notifications API
    console.log("[v0] Testing notifications API...")
    const notificationsResponse = await fetch("/api/notifications", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!notificationsResponse.ok) {
      results.errors.push(`Notifications API error: ${notificationsResponse.status}`)
    } else {
      results.notifications = true
      console.log("[v0] Notifications API: ✅")
    }

    // Test 6: Health Check
    console.log("[v0] Testing health check...")
    const healthResponse = await fetch("/api/health", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!healthResponse.ok) {
      results.errors.push(`Health check error: ${healthResponse.status}`)
    } else {
      const healthData = await healthResponse.json()
      console.log("[v0] Health check:", healthData)
    }

    // Test 7: Environment validation
    console.log("[v0] Testing environment validation...")
    const requiredEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        results.errors.push(`Missing environment variable: ${envVar}`)
      }
    }
  } catch (error) {
    results.errors.push(`Unexpected error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }

  // Summary
  console.log("[v0] Bug test results:")
  console.log("[v0] Database:", results.database ? "✅" : "❌")
  console.log("[v0] Properties API:", results.properties ? "✅" : "❌")
  console.log("[v0] Contracts API:", results.contracts ? "✅" : "❌")
  console.log("[v0] Proposals API:", results.proposals ? "✅" : "❌")
  console.log("[v0] Notifications API:", results.notifications ? "✅" : "❌")

  if (results.errors.length > 0) {
    console.log("[v0] Errors found:")
    results.errors.forEach((error) => console.log(`[v0] ❌ ${error}`))
  } else {
    console.log("[v0] No bugs found! System is healthy ✅")
  }

  return results
}

// Execute the test
testSystemAPIs()
  .then((results) => {
    console.log("[v0] Bug test completed")
  })
  .catch((error) => {
    console.error("[v0] Bug test failed:", error)
  })
