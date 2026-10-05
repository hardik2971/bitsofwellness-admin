"use client"

import { formatDate } from "@/lib/format"
import { ImageField } from "@/components/image-field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Field } from "@/lib/resources"

export type FormValues = Record<string, unknown>

const pad = (n: number) => String(n).padStart(2, "0")

/** Converts a database row into editable form values. */
export function toFormValues(fields: Field[], row?: Record<string, unknown>): FormValues {
  const values: FormValues = {}
  for (const f of fields) {
    const v = row ? row[f.name] : f.default
    if (f.type === "list") values[f.name] = Array.isArray(v) ? v.join("\n") : ""
    else if (f.type === "date") values[f.name] = v ? new Date(String(v)).toISOString().slice(0, 10) : ""
    else if (f.type === "datetime") {
      const d = v ? new Date(String(v)) : row ? null : new Date()
      values[f.name] = d
        ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
        : ""
    } else if (f.type === "boolean") values[f.name] = Boolean(v)
    else values[f.name] = v ?? ""
  }
  return values
}

/** Converts form values into the request body (local datetimes become ISO). */
export function toPayload(fields: Field[], values: FormValues) {
  const body: FormValues = {}
  for (const f of fields) {
    if (f.readOnly) continue
    const v = values[f.name]
    body[f.name] = f.type === "datetime" && v ? new Date(String(v)).toISOString() : v
  }
  return body
}

function ReadOnlyValue({ field, value }: { field: Field; value: unknown }) {
  if (field.type === "json" && Array.isArray(value)) {
    const lines = value as { name?: string; qty?: number; price?: number }[]
    return (
      <div className="rounded-lg border">
        {lines.map((l, i) => (
          <div key={i} className="flex justify-between border-b px-3 py-2 text-sm last:border-b-0">
            <span>
              {l.qty} × {l.name}
            </span>
            <span className="font-medium">₹{((l.price ?? 0) * (l.qty ?? 1)).toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    )
  }
  const opt = field.options?.find((o) => o.value === value)
  const text =
    field.type === "date" || field.type === "datetime"
      ? formatDate(value, field.type === "datetime")
      : opt?.label ?? (field.name === "total" || field.name === "price" ? `₹${Number(value).toLocaleString("en-IN")}` : String(value ?? "—"))
  return <p className="bg-muted/60 rounded-md px-3 py-2 text-sm">{text || "—"}</p>
}

export function ResourceForm({
  fields,
  values,
  onChange,
  rawRow,
}: {
  fields: Field[]
  values: FormValues
  onChange: (name: string, value: unknown) => void
  rawRow?: Record<string, unknown>
}) {
  return (
    <div className="space-y-5">
      {fields.map((f) => {
        const id = `field-${f.name}`
        const v = values[f.name]
        if (f.type === "boolean") {
          return (
            <div key={f.name} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
              <Label htmlFor={id} className="cursor-pointer">
                {f.label}
              </Label>
              <Switch id={id} checked={Boolean(v)} onCheckedChange={(c) => onChange(f.name, c)} disabled={f.readOnly} />
            </div>
          )
        }
        return (
          <div key={f.name} className="space-y-2">
            <Label htmlFor={id}>
              {f.label}
              {f.required && !f.readOnly && <span className="text-destructive">*</span>}
            </Label>
            {f.readOnly ? (
              <ReadOnlyValue field={f} value={rawRow?.[f.name]} />
            ) : f.type === "textarea" || f.type === "list" ? (
              <Textarea
                id={id}
                rows={f.type === "list" ? 5 : 4}
                value={String(v ?? "")}
                placeholder={f.placeholder}
                onChange={(e) => onChange(f.name, e.target.value)}
              />
            ) : f.type === "image" ? (
              <ImageField value={String(v ?? "")} onChange={(url) => onChange(f.name, url)} />
            ) : f.type === "select" ? (
              <Select value={String(v ?? "")} onValueChange={(val) => onChange(f.name, val)}>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {f.options?.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : f.type === "color" ? (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label={f.label}
                  value={String(v || "#7CB82F")}
                  onChange={(e) => onChange(f.name, e.target.value.toUpperCase())}
                  className="h-9 w-12 cursor-pointer rounded border"
                />
                <Input id={id} value={String(v ?? "")} onChange={(e) => onChange(f.name, e.target.value)} className="w-32" />
              </div>
            ) : (
              <Input
                id={id}
                type={
                  f.type === "int" || f.type === "float"
                    ? "number"
                    : f.type === "date"
                      ? "date"
                      : f.type === "datetime"
                        ? "datetime-local"
                        : "text"
                }
                step={f.type === "float" ? "0.1" : f.type === "int" ? "1" : undefined}
                value={String(v ?? "")}
                placeholder={f.placeholder}
                onChange={(e) => onChange(f.name, e.target.value)}
              />
            )}
            {f.help && !f.readOnly && <p className="text-muted-foreground text-xs">{f.help}</p>}
          </div>
        )
      })}
    </div>
  )
}
