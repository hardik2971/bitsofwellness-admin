import type { NextRequest } from "next/server"

import { handle } from "@/lib/api"
import { assertAdmin, HttpError } from "@/lib/auth"
import { buildWhere, delegateFor, parseInput } from "@/lib/resource-data"
import { getResource } from "@/lib/resources"

function resourceOr404(key: string) {
  const r = getResource(key)
  if (!r) throw new HttpError(404, "Unknown module")
  return r
}

export const GET = handle(async (req: NextRequest, ctx: RouteContext<"/api/admin/resources/[resource]">) => {
  await assertAdmin()
  const resource = resourceOr404((await ctx.params).resource)
  const sp = req.nextUrl.searchParams
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1)
  const pageSize = Math.min(100, Math.max(5, Number(sp.get("pageSize") ?? 20) || 20))
  const where = buildWhere(resource, sp)
  const db = delegateFor(resource)
  const [rows, total] = await Promise.all([
    db.findMany({ where, orderBy: resource.orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    db.count({ where }),
  ])
  return Response.json({ rows, total, page, pageSize })
})

export const POST = handle(async (req: NextRequest, ctx: RouteContext<"/api/admin/resources/[resource]">) => {
  await assertAdmin()
  const resource = resourceOr404((await ctx.params).resource)
  if (resource.canCreate === false) throw new HttpError(405, `${resource.title} are created by the app`)
  const body = (await req.json()) as Record<string, unknown>
  const row = await delegateFor(resource).create({ data: parseInput(resource, body, "create") })
  return Response.json(row, { status: 201 })
})
