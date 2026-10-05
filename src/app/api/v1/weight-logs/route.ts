import { z } from "zod"

import { handle } from "@/lib/api"
import { assertAppKey, PHONE_RE, phoneSchemaMessage, userForPhone } from "@/lib/app-api"
import { prisma } from "@/lib/db"

const body = z.object({
  phone: z.string().regex(PHONE_RE, phoneSchemaMessage),
  kg: z.number().min(20).max(400),
})

export const POST = handle(async (req: Request) => {
  assertAppKey(req)
  const { phone, kg } = body.parse(await req.json())
  const user = await userForPhone(phone)
  await prisma.$transaction([
    prisma.weightLog.create({ data: { userId: user.id, kg } }),
    prisma.appUser.update({ where: { id: user.id }, data: { weightKg: kg } }),
  ])
  return Response.json({ ok: true }, { status: 201 })
})
