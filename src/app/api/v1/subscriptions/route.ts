import { z } from "zod"

import { badRequest, handle } from "@/lib/api"
import { assertAppKey, PHONE_RE, phoneSchemaMessage, userForPhone } from "@/lib/app-api"
import { prisma } from "@/lib/db"

const body = z.object({
  phone: z.string().regex(PHONE_RE, phoneSchemaMessage),
  planId: z.number().int(),
  paymentMethod: z.string().max(40).default("UPI"),
})

const MONTHS = /(\d+)\s*MONTH/i

export const POST = handle(async (req: Request) => {
  assertAppKey(req)
  const { phone, planId, paymentMethod } = body.parse(await req.json())
  const plan = await prisma.plan.findFirst({ where: { id: planId, isActive: true } })
  if (!plan) badRequest("This plan is no longer available")
  const user = await userForPhone(phone)

  const start = new Date()
  const months = Number(plan.durationLabel.match(MONTHS)?.[1] ?? 0)
  const end = months ? new Date(new Date(start).setMonth(start.getMonth() + months)) : null

  const sub = await prisma.subscription.create({
    data: {
      userId: user.id,
      phone,
      planName: `${plan.durationLabel} ${plan.name}`,
      price: plan.price,
      paymentMethod,
      startDate: start,
      endDate: end,
    },
  })
  return Response.json({ id: sub.id, planName: sub.planName, startDate: sub.startDate, endDate: sub.endDate }, { status: 201 })
})
