import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

/** Uptime check: confirms the server and database are reachable. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ ok: true, db: "up" })
  } catch {
    return Response.json({ ok: false, db: "down" }, { status: 503 })
  }
}
