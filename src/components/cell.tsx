"use client"

import { Badge } from "@/components/ui/badge"
import { formatDate, humanize } from "@/lib/format"
import type { FieldType } from "@/lib/resources"

const MONEY = new Set(["price", "mrp", "total"])

const STATUS_STYLES: Record<string, string> = {
  PLACED: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-sky-100 text-sky-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-rose-100 text-rose-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  EXPIRED: "bg-zinc-200 text-zinc-700",
  NEW: "bg-amber-100 text-amber-800",
  CONTACTED: "bg-sky-100 text-sky-800",
  CLOSED: "bg-zinc-200 text-zinc-700",
}

export function Cell({ name, type, value }: { name: string; type: FieldType; value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">—</span>
  if (type === "boolean") {
    return value ? (
      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Yes</Badge>
    ) : (
      <Badge variant="secondary">No</Badge>
    )
  }
  if (type === "date" || type === "datetime") return <span className="whitespace-nowrap">{formatDate(value, type === "datetime")}</span>
  if (type === "color") {
    return (
      <span className="flex items-center gap-2">
        <span className="size-4 rounded border" style={{ background: String(value) }} />
        {String(value)}
      </span>
    )
  }
  if (type === "select" && typeof value === "string" && STATUS_STYLES[value]) {
    return <Badge className={`${STATUS_STYLES[value]} border-0`}>{humanize(value)}</Badge>
  }
  if (type === "select" && typeof value === "string" && /^[A-Z_]+$/.test(value)) return <span>{humanize(value)}</span>
  if (MONEY.has(name)) return <span className="font-medium">₹{Number(value).toLocaleString("en-IN")}</span>
  if (Array.isArray(value)) return <span>{value.length} items</span>
  const text = String(value)
  return <span className="line-clamp-2 max-w-xs">{text}</span>
}
