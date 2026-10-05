import type { Metadata } from "next"
import Link from "next/link"

import { Cell } from "@/components/cell"
import { formatDate, humanize } from "@/lib/format"
import { DashboardCharts, type DayPoint } from "@/components/dashboard-charts"
import { Icon } from "@/components/icons"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const metadata: Metadata = { title: "Dashboard" }
export const dynamic = "force-dynamic"

const DAYS = 14

function dayKey(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
}

export default async function DashboardPage() {
  const session = await requireAdmin()
  const since = new Date()
  since.setHours(0, 0, 0, 0)
  since.setDate(since.getDate() - (DAYS - 1))

  const [
    users, newUsersToday, orders, revenue, activeSubs, newRequests,
    recentUsers, recentOrdersInRange, latestOrders, latestRequests,
    dietitians, recipes, products, feed, plans, notifications,
  ] = await Promise.all([
    prisma.appUser.count(),
    prisma.appUser.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.request.count({ where: { status: "NEW" } }),
    prisma.appUser.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: since }, status: { not: "CANCELLED" } }, select: { createdAt: true, total: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.request.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.dietitian.count(),
    prisma.recipe.count(),
    prisma.product.count(),
    prisma.feedPost.count(),
    prisma.plan.count(),
    prisma.notification.count(),
  ])

  const series: DayPoint[] = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    return { day: dayKey(d), users: 0, revenue: 0, orders: 0 }
  })
  const byDay = new Map(series.map((p) => [p.day, p]))
  for (const u of recentUsers) {
    const p = byDay.get(dayKey(u.createdAt))
    if (p) p.users++
  }
  for (const o of recentOrdersInRange) {
    const p = byDay.get(dayKey(o.createdAt))
    if (p) {
      p.revenue += o.total
      p.orders++
    }
  }

  const stats = [
    { label: "App users", value: users.toLocaleString("en-IN"), hint: `${newUsersToday} joined today`, icon: "users", href: "/manage/users" },
    { label: "Orders", value: orders.toLocaleString("en-IN"), hint: "Excluding cancelled", icon: "order", href: "/manage/orders" },
    { label: "Revenue", value: `₹${(revenue._sum.total ?? 0).toLocaleString("en-IN")}`, hint: "All store orders", icon: "analytics", href: "/manage/orders" },
    { label: "Active Pro plans", value: activeSubs.toLocaleString("en-IN"), hint: "Subscriptions", icon: "crown", href: "/manage/subscriptions" },
    { label: "New requests", value: newRequests.toLocaleString("en-IN"), hint: "Waiting for a reply", icon: "request", href: "/manage/requests" },
  ]

  const content = [
    { label: "Dietitians", count: dietitians, href: "/manage/dietitians", icon: "doctor" },
    { label: "Recipes", count: recipes, href: "/manage/recipes", icon: "recipe" },
    { label: "Products", count: products, href: "/manage/products", icon: "product" },
    { label: "Feed posts", count: feed, href: "/manage/feed", icon: "explore" },
    { label: "Pro plans", count: plans, href: "/manage/plans", icon: "crown" },
    { label: "Notifications", count: notifications, href: "/manage/notifications", icon: "bell" },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={`Hello, ${session.name.split(" ")[0]}`} description="Here's what's happening in the Bitsofwellness app." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="hover:border-primary/40 h-full transition-colors">
              <CardContent className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-sm">{s.label}</p>
                  <p className="mt-1 text-2xl font-bold">{s.value}</p>
                  <p className="text-muted-foreground mt-1 text-xs">{s.hint}</p>
                </div>
                <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                  <Icon name={s.icon} className="size-5" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <DashboardCharts data={series} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest orders</CardTitle>
            <Link href="/manage/orders" className="text-primary text-sm font-medium">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestOrders.length === 0 && <p className="text-muted-foreground text-sm">No orders yet. They appear here as soon as someone checks out in the app.</p>}
            {latestOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{o.orderNo}</p>
                  <p className="text-muted-foreground text-xs">{o.customerName || o.phone} · {formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">₹{o.total.toLocaleString("en-IN")}</span>
                  <Cell name="status" type="select" value={o.status} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest requests</CardTitle>
            <Link href="/manage/requests" className="text-primary text-sm font-medium">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestRequests.length === 0 && <p className="text-muted-foreground text-sm">No call-back or booking requests yet.</p>}
            {latestRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{humanize(r.type)}{r.subject ? ` · ${r.subject}` : ""}</p>
                  <p className="text-muted-foreground text-xs">{r.name || r.phone} · {formatDate(r.createdAt)}</p>
                </div>
                <Cell name="status" type="select" value={r.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>App content</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {content.map((c) => (
            <Link key={c.label} href={c.href} className="hover:bg-muted flex items-center gap-3 rounded-xl border p-3 transition-colors">
              <Icon name={c.icon} className="text-primary size-5" />
              <div>
                <p className="text-lg font-bold leading-none">{c.count}</p>
                <p className="text-muted-foreground mt-1 text-xs">{c.label}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
