import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "./db"
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./session"

/** Current admin session, re-checked against the database so disabled admins lose access. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const session = await verifySession(store.get(SESSION_COOKIE)?.value)
  if (!session) return null
  const admin = await prisma.admin.findUnique({ where: { id: session.adminId } })
  if (!admin || !admin.isActive) return null
  return { adminId: admin.id, email: admin.email, name: admin.name, role: admin.role }
}

/** For server components/pages: redirects to /login when signed out. */
export async function requireAdmin() {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

/** For admin API routes: throws 401/403 instead of redirecting. */
export async function assertAdmin(role?: "SUPER_ADMIN") {
  const session = await getSession()
  if (!session) throw new HttpError(401, "Not signed in")
  if (role && session.role !== role) throw new HttpError(403, "Only super admins can do this")
  return session
}
