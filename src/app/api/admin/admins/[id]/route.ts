import bcrypt from "bcryptjs"
import { z } from "zod"

import { badRequest, handle } from "@/lib/api"
import { assertAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"

type Ctx = RouteContext<"/api/admin/admins/[id]">

const select = { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true }

const body = z.object({
  name: z.string().trim().min(2).optional(),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8, "must be at least 8 characters").optional(),
})

export const PUT = handle(async (req: Request, ctx: Ctx) => {
  const me = await assertAdmin("SUPER_ADMIN")
  const id = Number((await ctx.params).id)
  const { password, ...rest } = body.parse(await req.json())
  if (id === me.adminId && (rest.isActive === false || rest.role === "EDITOR")) {
    badRequest("You can't disable or demote your own account")
  }
  const admin = await prisma.admin.update({
    where: { id },
    data: { ...rest, ...(password ? { passwordHash: await bcrypt.hash(password, 12) } : {}) },
    select,
  })
  return Response.json(admin)
})

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const me = await assertAdmin("SUPER_ADMIN")
  const id = Number((await ctx.params).id)
  if (id === me.adminId) badRequest("You can't delete your own account")
  await prisma.admin.delete({ where: { id } })
  return Response.json({ ok: true })
})
