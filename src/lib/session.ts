import { SignJWT, jwtVerify } from "jose"

// Edge/Node-safe session helpers (no Prisma or Node APIs), shared by proxy.ts and the app.

export const SESSION_COOKIE = "bow_admin_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export type SessionPayload = {
  adminId: number
  email: string
  name: string
  role: "SUPER_ADMIN" | "EDITOR"
}

function secret() {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters")
  return new TextEncoder().encode(s)
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret())
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}
