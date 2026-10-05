import "server-only"

import { Prisma } from "@prisma/client"
import crypto from "node:crypto"

import { HttpError } from "./auth"
import { prisma } from "./db"

/** Mobile API calls must carry the shared app key. */
export function assertAppKey(req: Request) {
  const expected = process.env.APP_API_KEY ?? ""
  const given = req.headers.get("x-app-key") ?? ""
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  if (!expected || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new HttpError(401, "Invalid app key")
  }
}

/** Base URL the phone used to reach us: PUBLIC_BASE_URL, else the request's (forwarded) host. */
function requestBase(req: Request) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "")
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host")
  if (!host) return new URL(req.url).origin
  const proto = req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ?? new URL(req.url).protocol.replace(":", "")
  return `${proto}://${host}`
}

/** Turns stored /uploads/... paths into absolute URLs the phone can download. */
export function absoluteUrl(req: Request, value: string) {
  if (!value || /^https?:\/\//.test(value)) return value
  return `${requestBase(req)}${value.startsWith("/") ? "" : "/"}${value}`
}

/**
 * Upsert keyed by phone that survives concurrent requests: the app sends profile and
 * weight calls at the same moment, and two simultaneous creates collide on the unique
 * phone (P2002). On that collision the row now exists, so retrying updates it.
 */
export async function upsertUserByPhone(
  phone: string,
  update: Prisma.AppUserUpdateInput,
  create: Omit<Prisma.AppUserCreateInput, "phone">,
) {
  const run = () => prisma.appUser.upsert({ where: { phone }, update, create: { phone, ...create } })
  try {
    return await run()
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return run()
    throw e
  }
}

/** Finds the user for a phone number, creating a bare record if the app hasn't synced it yet. */
export async function userForPhone(phone: string, countryCode = "+91") {
  return upsertUserByPhone(phone, {}, { countryCode })
}

export const phoneSchemaMessage = "phone must be 6-15 digits"
export const PHONE_RE = /^\d{6,15}$/
