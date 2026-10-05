import { z } from "zod"

import { badRequest, handle } from "@/lib/api"
import { assertAppKey, PHONE_RE, phoneSchemaMessage, userForPhone } from "@/lib/app-api"
import { prisma } from "@/lib/db"

const body = z.object({
  phone: z.string().regex(PHONE_RE, phoneSchemaMessage),
  items: z
    .array(z.object({ productId: z.number().int(), qty: z.number().int().min(1).max(50) }))
    .min(1)
    .max(50),
})

async function setting(key: string, fallback: number) {
  const s = await prisma.setting.findUnique({ where: { key } })
  const n = Number(s?.value)
  return Number.isFinite(n) ? n : fallback
}

/** Places a store order. Prices always come from the database, never from the app. */
export const POST = handle(async (req: Request) => {
  assertAppKey(req)
  const { phone, items } = body.parse(await req.json())
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, isActive: true },
  })
  const lines = items.map((i) => {
    const p = products.find((x) => x.id === i.productId)
    if (!p) badRequest(`Product ${i.productId} is no longer available`)
    return { productId: p.id, name: p.name, qty: i.qty, price: p.price }
  })
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
  const freeAbove = await setting("store.freeDeliveryAbove", 499)
  const delivery = subtotal >= freeAbove ? 0 : await setting("store.deliveryCharge", 49)

  const user = await userForPhone(phone)
  const order = await prisma.order.create({
    data: {
      orderNo: `BOW${Date.now().toString().slice(-9)}${Math.floor(Math.random() * 10)}`,
      userId: user.id,
      phone,
      customerName: user.name,
      items: lines,
      total: subtotal + delivery,
    },
  })
  return Response.json(
    { id: order.id, orderNo: order.orderNo, total: order.total, status: order.status, createdAt: order.createdAt },
    { status: 201 },
  )
})

/** Order history for the "Your Orders" screen. */
export const GET = handle(async (req: Request) => {
  assertAppKey(req)
  const phone = new URL(req.url).searchParams.get("phone") ?? ""
  if (!PHONE_RE.test(phone)) badRequest(phoneSchemaMessage)
  const orders = await prisma.order.findMany({ where: { phone }, orderBy: { createdAt: "desc" }, take: 50 })
  return Response.json(
    orders.map((o) => ({ id: o.id, orderNo: o.orderNo, items: o.items, total: o.total, status: o.status, createdAt: o.createdAt })),
  )
})
