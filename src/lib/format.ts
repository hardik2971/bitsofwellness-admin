// Plain formatting helpers, safe to call from server and client components.

export const humanize = (v: string) => v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ")

export function formatDate(v: unknown, withTime = true) {
  if (!v) return "—"
  const d = new Date(String(v))
  if (Number.isNaN(d.getTime())) return "—"
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

export const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`
