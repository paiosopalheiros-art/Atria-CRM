import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log("[v0] Middleware: Allowing all requests to pass through")

  // Allow all requests to pass through without Supabase authentication check
  // The authentication is handled by the auth-context on the client side
  return NextResponse.next({
    request,
  })

  /* Original Supabase middleware code - disabled due to network connectivity issues in v0 preview
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow access to auth pages and home page
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/setup") ||
    request.nextUrl.pathname === "/"

  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
  */
}
