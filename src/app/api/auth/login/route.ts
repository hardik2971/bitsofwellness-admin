import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { z } from "zod"

import { handle } from "@/lib/api"
import { HttpError } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/session"

const body = z.object({ email: z.string().email(), password: z.string().min(1) })

// Simple in-memory throttle: 5 failed attempts per email per 15 minutes.
const failures = new Map<string, { count: number; until: number }>()
const WINDOW_MS = 15 * 60 * 1000

export const POST = handle(async (req: Request) => {
  const { email, password } = body.parse(await req.json())
  const key = email.toLowerCase()
  const f = failures.get(key)
  if (f && f.count >= 5 && f.until > Date.now()) {
    throw new HttpError(429, "Too many attempts. Try again in a few minutes.")
  }

  const admin = await prisma.admin.findUnique({ where: { email: key } })
  const ok = admin && admin.isActive && (await bcrypt.compare(password, admin.passwordHash))
  if (!ok) {
    const prev = f && f.until > Date.now() ? f.count : 0
    failures.set(key, { count: prev + 1, until: Date.now() + WINDOW_MS })
    throw new HttpError(401, "Wrong email or password")
  }
  failures.delete(key)

  await prisma.admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } })
  const token = await signSession({ adminId: admin.id, email: admin.email, name: admin.name, role: admin.role })
  ;(await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.PUBLIC_BASE_URL?.startsWith("http://"),
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
  return Response.json({ ok: true })
})
