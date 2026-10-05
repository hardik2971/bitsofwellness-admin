import "server-only"

import { badRequest } from "./api"
import { prisma } from "./db"
import type { Field, Resource } from "./resources"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Delegate = Record<string, (args?: any) => Promise<any>>

export function delegateFor(resource: Resource): Delegate {
  return (prisma as unknown as Record<string, Delegate>)[resource.model]
}

function isBlank(v: unknown) {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "")
}

function coerce(field: Field, raw: unknown): unknown {
  switch (field.type) {
    case "int": {
      if (isBlank(raw)) return field.required ? badRequest(`${field.label} is required`) : 0
      const n = Number(raw)
      if (!Number.isFinite(n)) badRequest(`${field.label} must be a number`)
      return Math.round(n)
    }
    case "float": {
      if (isBlank(raw)) return field.required ? badRequest(`${field.label} is required`) : 0
      const n = Number(raw)
      if (!Number.isFinite(n)) badRequest(`${field.label} must be a number`)
      return n
    }
    case "boolean":
      return raw === true || raw === "true" || raw === "on" || raw === 1
    case "list": {
      const items = (Array.isArray(raw) ? raw : String(raw ?? "").split("\n"))
        .map((s) => String(s).trim())
        .filter(Boolean)
      if (field.required && items.length === 0) badRequest(`${field.label} needs at least one entry`)
      return items
    }
    case "date":
    case "datetime": {
      if (isBlank(raw)) return field.required ? badRequest(`${field.label} is required`) : null
      const d = new Date(String(raw))
      if (Number.isNaN(d.getTime())) badRequest(`${field.label} is not a valid date`)
      return d
    }
    case "json":
      return raw
    default: {
      const s = isBlank(raw) ? "" : String(raw).trim()
      if (field.required && !s) badRequest(`${field.label} is required`)
      if (field.type === "select" && s && field.options && !field.options.some((o) => o.value === s)) {
        badRequest(`${field.label} has an invalid value`)
      }
      if (field.type === "color" && s && !/^#[0-9a-fA-F]{6}$/.test(s)) badRequest(`${field.label} must be a hex colour like #7CB82F`)
      return s
    }
  }
}

/** Builds a Prisma data object from a request body, using only editable fields of the resource. */
export function parseInput(resource: Resource, body: Record<string, unknown>, mode: "create" | "update") {
  const data: Record<string, unknown> = {}
  for (const field of resource.fields) {
    if (field.readOnly) continue
    if (mode === "update" && !(field.name in body)) continue
    let raw = body[field.name]
    if (mode === "create" && raw === undefined) raw = field.default
    const value = coerce(field, raw)
    // Leave optional dates out instead of writing null into required columns.
    if (value === null && mode === "create") continue
    data[field.name] = value
  }
  return data
}

export function buildWhere(resource: Resource, params: URLSearchParams) {
  const and: Record<string, unknown>[] = []
  const q = params.get("q")?.trim()
  if (q && resource.searchFields.length) {
    and.push({ OR: resource.searchFields.map((f) => ({ [f]: { contains: q } })) })
  }
  for (const field of resource.fields) {
    const v = params.get(`f_${field.name}`)
    if (!v) continue
    if (field.type === "select") and.push({ [field.name]: v })
    if (field.type === "boolean") and.push({ [field.name]: v === "true" })
  }
  return and.length ? { AND: and } : {}
}
