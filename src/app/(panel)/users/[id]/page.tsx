import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Cell } from "@/components/cell"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { formatDate, humanize, rupees } from "@/lib/format"

export const metadata: Metadata = { title: "User" }
export const dynamic = "force-dynamic"

export default async function UserPage({ params }: PageProps<"/users/[id]">) {
  await requireAdmin()
  const id = Number((await params).id)
  if (!Number.isInteger(id)) notFound()
  const user = await prisma.appUser.findUnique({
    where: { id },
    include: {
      weightLogs: { orderBy: { loggedAt: "desc" }, take: 30 },
      orders: { orderBy: { createdAt: "desc" } },
      subscriptions: { orderBy: { createdAt: "desc" } },
      requests: { orderBy: { createdAt: "desc" } },
    },
  })
  if (!user) notFound()

  const bmi = user.heightCm > 0 ? user.weightKg / (user.heightCm / 100) ** 2 : 0
  const conditions = Array.isArray(user.healthConditions) ? (user.healthConditions as string[]) : []
  const profile: [string, string][] = [
    ["Phone", `${user.countryCode} ${user.phone}`],
    ["Email", user.email || "—"],
    ["Gender", user.gender || "—"],
    ["Date of birth", user.dob ? formatDate(user.dob, false) : "—"],
    ["Height", user.heightCm ? `${user.heightCm} cm` : "—"],
    ["Current weight", user.weightKg ? `${user.weightKg} kg` : "—"],
    ["Target weight", user.targetWeightKg ? `${user.targetWeightKg} kg` : "—"],
    ["BMI", bmi ? bmi.toFixed(1) : "—"],
    ["Goal", user.goal || "—"],
    ["Activity", user.activityLevel || "—"],
    ["Diet", user.dietPreference || "—"],
    ["Joined", formatDate(user.createdAt)],
    ["Last login", formatDate(user.lastLoginAt)],
  ]

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/manage/users">
          <HugeiconsIcon icon={ArrowLeft01Icon} /> All users
        </Link>
      </Button>
      <PageHeader
        title={user.name || "Unnamed user"}
        description={`${user.countryCode} ${user.phone}`}
        icon="users"
        actions={user.isActive ? <Badge className="bg-primary/10 text-primary">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            {profile.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
            {conditions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {conditions.map((c) => (
                  <Badge key={c} variant="secondary">{c}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Weight history</CardTitle>
            </CardHeader>
            <CardContent>
              {user.weightLogs.length === 0 ? (
                <p className="text-muted-foreground text-sm">No weight entries yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {user.weightLogs.map((w) => (
                    <div key={w.id} className="rounded-lg border px-3 py-2 text-sm">
                      <p className="font-semibold">{w.kg} kg</p>
                      <p className="text-muted-foreground text-xs">{formatDate(w.loggedAt, false)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Orders ({user.orders.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user.orders.length === 0 && <p className="text-muted-foreground text-sm">No orders.</p>}
              {user.orders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{o.orderNo}</p>
                    <p className="text-muted-foreground text-xs">{formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{rupees(o.total)}</span>
                    <Cell name="status" type="select" value={o.status} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subscriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.subscriptions.length === 0 && <p className="text-muted-foreground text-sm">No Pro plan.</p>}
                {user.subscriptions.map((s) => (
                  <div key={s.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{s.planName}</p>
                      <Cell name="status" type="select" value={s.status} />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {rupees(s.price)} · {formatDate(s.startDate, false)}
                      {s.endDate ? ` → ${formatDate(s.endDate, false)}` : ""}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Requests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.requests.length === 0 && <p className="text-muted-foreground text-sm">No requests.</p>}
                {user.requests.map((r) => (
                  <div key={r.id} className="rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{humanize(r.type)}</p>
                      <Cell name="status" type="select" value={r.status} />
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {r.subject || "—"} · {formatDate(r.createdAt)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
