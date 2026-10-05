import { NextResponse, type NextRequest } from "next/server"

import { SESSION_COOKIE, verifySession } from "@/lib/session"

// Guards the admin UI. Admin API routes re-check the session themselves (and the DB),
// so this is a fast first line that mainly redirects signed-out visitors to /login.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value)

  if (pathname === "/login") {
    return session ? NextResponse.redirect(new URL("/dashboard", request.url)) : NextResponse.next()
  }
  if (!session) {
    if (pathname.startsWith("/api/")) return Response.json({ error: "Not signed in" }, { status: 401 })
    const url = new URL("/login", request.url)
    if (pathname !== "/") url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }
  if (pathname === "/") return NextResponse.redirect(new URL("/dashboard", request.url))
  return NextResponse.next()
}

export const config = {
  // Everything except: the public mobile API, uploaded images, auth endpoints and static assets.
  matcher: ["/((?!api/v1|api/auth|uploads|_next/static|_next/image|favicon.ico|logo_.*\\.png).*)"],
}
