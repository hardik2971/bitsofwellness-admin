import bcrypt from "bcryptjs"
import { z } from "zod"

import { handle } from "@/lib/api"
import { assertAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"

const adminSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
} as const

export const GET = handle(async () => {
  await assertAdmin("SUPER_ADMIN")
  return Response.json(await prisma.admin.findMany({ select: adminSelect, orderBy: { id: "asc" } }))
})

const body = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8, "must be at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "EDITOR"]),
})

export const POST = handle(async (req: Request) => {
  await assertAdmin("SUPER_ADMIN")
  const { name, email, password, role } = body.parse(await req.json())
  const admin = await prisma.admin.create({
    data: { name, email: email.toLowerCase(), role, passwordHash: await bcrypt.hash(password, 12) },
    select: adminSelect,
  })
  return Response.json(admin, { status: 201 })
})
