import { z } from "zod"

import { handle } from "@/lib/api"
import { assertAppKey, PHONE_RE, phoneSchemaMessage, userForPhone } from "@/lib/app-api"
import { prisma } from "@/lib/db"

const body = z.object({
  phone: z.string().regex(PHONE_RE, phoneSchemaMessage),
  type: z.enum(["CALLBACK", "WHATSAPP", "CONSULTATION", "LIVE_CLASS", "HEALTH_TEST"]),
  subject: z.string().max(200).default(""),
})

/** Call-back / WhatsApp / consultation / live class / health test requests from the app. */
export const POST = handle(async (req: Request) => {
  assertAppKey(req)
  const { phone, type, subject } = body.parse(await req.json())
  const user = await userForPhone(phone)
  const r = await prisma.request.create({ data: { userId: user.id, phone, name: user.name, type, subject } })
  return Response.json({ id: r.id }, { status: 201 })
})
