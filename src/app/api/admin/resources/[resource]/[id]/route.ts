import type { NextRequest } from "next/server"

import { badRequest, handle } from "@/lib/api"
import { assertAdmin, HttpError } from "@/lib/auth"
import { delegateFor, parseInput } from "@/lib/resource-data"
import { getResource } from "@/lib/resources"

type Ctx = RouteContext<"/api/admin/resources/[resource]/[id]">

async function target(ctx: Ctx) {
  const { resource: key, id } = await ctx.params
  const resource = getResource(key)
  if (!resource) throw new HttpError(404, "Unknown module")
  const numericId = Number(id)
  if (!Number.isInteger(numericId)) badRequest("Invalid id")
  return { resource, id: numericId }
}

export const GET = handle(async (_req: NextRequest, ctx: Ctx) => {
  await assertAdmin()
  const { resource, id } = await target(ctx)
  const row = await delegateFor(resource).findUnique({ where: { id } })
  if (!row) throw new HttpError(404, "Record not found")
  return Response.json(row)
})

export const PUT = handle(async (req: NextRequest, ctx: Ctx) => {
  await assertAdmin()
  const { resource, id } = await target(ctx)
  const body = (await req.json()) as Record<string, unknown>
  const row = await delegateFor(resource).update({ where: { id }, data: parseInput(resource, body, "update") })
  return Response.json(row)
})

export const DELETE = handle(async (_req: NextRequest, ctx: Ctx) => {
  await assertAdmin()
  const { resource, id } = await target(ctx)
  if (resource.canDelete === false) throw new HttpError(405, "This record can't be deleted")
  await delegateFor(resource).delete({ where: { id } })
  return Response.json({ ok: true })
})
