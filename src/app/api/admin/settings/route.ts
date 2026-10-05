import { z } from "zod"

import { handle } from "@/lib/api"
import { assertAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const GET = handle(async () => {
  await assertAdmin()
  const settings = await prisma.setting.findMany({ orderBy: { id: "asc" } })
  return Response.json(settings)
})

const body = z.object({ values: z.record(z.string(), z.string().max(5000)) })

export const PUT = handle(async (req: Request) => {
  await assertAdmin()
  const { values } = body.parse(await req.json())
  const existing = new Set((await prisma.setting.findMany({ select: { key: true } })).map((s) => s.key))
  await prisma.$transaction(
    Object.entries(values)
      .filter(([key]) => existing.has(key))
      .map(([key, value]) => prisma.setting.update({ where: { key }, data: { value: value.trim() } })),
  )
  return Response.json({ ok: true })
})
