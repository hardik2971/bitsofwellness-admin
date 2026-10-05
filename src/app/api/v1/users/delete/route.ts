import { z } from "zod"

import { handle } from "@/lib/api"
import { assertAppKey, PHONE_RE, phoneSchemaMessage } from "@/lib/app-api"
import { prisma } from "@/lib/db"

const body = z.object({ phone: z.string().regex(PHONE_RE, phoneSchemaMessage) })

/** In-app "Account Delete": removes the user and their weight history (Play Store requirement).
 *  Orders, subscriptions and requests are kept for accounting but unlinked from the user. */
export const POST = handle(async (req: Request) => {
  assertAppKey(req)
  const { phone } = body.parse(await req.json())
  await prisma.appUser.deleteMany({ where: { phone } })
  return Response.json({ ok: true })
})
