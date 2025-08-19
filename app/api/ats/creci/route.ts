import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import * as cheerio from "cheerio"

// Endpoint ATS para ingest de CRECI
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const seed = searchParams.get("seed")
    const pages = Number.parseInt(searchParams.get("pages") || "1")
    const token =
      searchParams.get("token") ||
      request.headers.get("x-ats-token") ||
      request.headers.get("authorization")?.replace("Bearer ", "")

    // Validar token ATS
    if (!token || token !== process.env.ATS_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!seed) {
      return NextResponse.json({ error: "Missing seed URL" }, { status: 400 })
    }

    let totalFound = 0
    let totalUpserted = 0

    // Processar páginas
    for (let page = 1; page <= Math.min(pages, 5); page++) {
      try {
        const pageUrl = `${seed}${seed.includes("?") ? "&" : "?"}page=${page}`
        console.log(`[ATS] Fetching page ${page}: ${pageUrl}`)

        const response = await fetch(pageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; Atria-ATS/1.0)",
          },
        })

        if (!response.ok) {
          console.error(`[ATS] Failed to fetch page ${page}: ${response.status}`)
          continue
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Seletores genéricos para imóveis (ajustar conforme site)
        const properties = $(".imovel, .property, .listing, [data-property]").toArray()

        for (const element of properties) {
          try {
            const $el = $(element)

            // Extrair dados básicos
            const title =
              $el.find("h2, h3, .title, .nome").first().text().trim() ||
              $el.find("a").first().attr("title") ||
              "Imóvel sem título"

            const priceText = $el.find(".price, .valor, .preco").first().text().trim()
            const price = Number.parseFloat(priceText.replace(/[^\d,]/g, "").replace(",", ".")) || 0

            const link = $el.find("a").first().attr("href")
            const sourceUrl = link ? (link.startsWith("http") ? link : `${new URL(seed).origin}${link}`) : pageUrl

            const imageUrl = $el.find("img").first().attr("src")
            const imageUrls = imageUrl
              ? [imageUrl.startsWith("http") ? imageUrl : `${new URL(seed).origin}${imageUrl}`]
              : []

            // Extrair localização
            const locationText = $el.find(".location, .endereco, .cidade").first().text().trim()
            const [city, state] = locationText.split(",").map((s) => s.trim())

            if (title && price > 0) {
              // Upsert na tabela publications
              const { error } = await supabaseAdmin.from("publications").upsert(
                {
                  source: "creci",
                  source_url: sourceUrl,
                  title,
                  price,
                  city: city || "Não informado",
                  state: state || "Não informado",
                  image_urls: imageUrls,
                  status: "approved", // Auto-approve ATS properties - no admin approval needed
                  listing_type: "sale", // Only sale properties from ATS
                  credits_cost: 3, // ATS gasta 3 créditos
                },
                {
                  onConflict: "source_url",
                  ignoreDuplicates: false,
                },
              )

              if (error) {
                console.error("[ATS] Error upserting property:", error)
              } else {
                totalUpserted++
              }
            }

            totalFound++
          } catch (itemError) {
            console.error("[ATS] Error processing item:", itemError)
          }
        }
      } catch (pageError) {
        console.error(`[ATS] Error processing page ${page}:`, pageError)
      }
    }

    return NextResponse.json({
      ok: true,
      pages,
      found: totalFound,
      upserted: totalUpserted,
      message: `Processed ${pages} pages, found ${totalFound} items, upserted ${totalUpserted}`,
    })
  } catch (error) {
    console.error("[ATS] Error in CRECI ingest:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
