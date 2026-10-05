import bcrypt from "bcryptjs"
import { z } from "zod"

import { handle } from "@/lib/api"
import { assertAdmin, HttpError } from "@/lib/auth"
import { prisma } from "@/lib/db"

const body = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "must be at least 8 characters"),
})

/** Change your own password. */
export const PUT = handle(async (req: Request) => {
  const me = await assertAdmin()
  const { currentPassword, newPassword } = body.parse(await req.json())
  const admin = await prisma.admin.findUniqueOrThrow({ where: { id: me.adminId } })
  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    throw new HttpError(400, "Current password is wrong")
  }
  await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } })
  return Response.json({ ok: true })
})
