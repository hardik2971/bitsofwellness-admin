"use client"

/* eslint-disable @next/next/no-img-element -- images come from our own /uploads route */
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Delete02Icon,
  LinkSquare02Icon,
  PencilEdit01Icon,
  PlusSignIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Cell } from "@/components/cell"
import { PageHeader } from "@/components/page-header"
import { ResourceForm, toFormValues, toPayload, type FormValues } from "@/components/resource-form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getResource, SYSTEM_COLUMNS, type FieldType } from "@/lib/resources"

type Row = Record<string, unknown> & { id: number }
const PAGE_SIZE = 20

export function ResourceManager({ resourceKey }: { resourceKey: string }) {
  const resource = getResource(resourceKey)!
  const canCreate = resource.canCreate !== false
  const canDelete = resource.canDelete !== false

  const filterField = useMemo(
    () => resource.fields.find((f) => f.type === "select" && resource.columns.includes(f.name) && f.options?.length),
    [resource],
  )

  const [page, setPage] = useState(1)
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [filter, setFilter] = useState("all")
  const [reloadTick, setReloadTick] = useState(0)
  // Result of the last finished request, tagged with the query it answered.
  const [result, setResult] = useState<{ key: string; rows: Row[]; total: number } | null>(null)

  const [editing, setEditing] = useState<Row | null>(null)
  const [creating, setCreating] = useState(false)
  const [values, setValues] = useState<FormValues>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Row | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  const requestKey = `${page}|${debounced}|${filter}|${reloadTick}`
  useEffect(() => {
    let cancelled = false
    const sp = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    if (debounced) sp.set("q", debounced)
    if (filterField && filter !== "all") sp.set(`f_${filterField.name}`, filter)
    fetch(`/api/admin/resources/${resource.key}?${sp}`)
      .then(async (res) => {
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) toast.error(data.error ?? "Could not load data")
        setResult({ key: requestKey, rows: res.ok ? data.rows : [], total: res.ok ? data.total : 0 })
      })
      .catch(() => !cancelled && toast.error("Network error"))
    return () => {
      cancelled = true
    }
  }, [requestKey, resource.key, page, debounced, filter, filterField])

  const loading = result?.key !== requestKey
  const rows = result?.rows ?? []
  const total = result?.total ?? 0
  const load = useCallback(() => setReloadTick((t) => t + 1), [])
  const changeFilter = (v: string) => {
    setFilter(v)
    setPage(1)
  }

  const sheetOpen = creating || editing !== null
  const openCreate = () => {
    setValues(toFormValues(resource.fields))
    setEditing(null)
    setCreating(true)
  }
  const openEdit = (row: Row) => {
    setValues(toFormValues(resource.fields, row))
    setCreating(false)
    setEditing(row)
  }
  const closeSheet = () => {
    setCreating(false)
    setEditing(null)
  }

  async function save() {
    setSaving(true)
    const res = await fetch(
      editing ? `/api/admin/resources/${resource.key}/${editing.id}` : `/api/admin/resources/${resource.key}`,
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(resource.fields, values)),
      },
    )
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return toast.error(data.error ?? "Could not save")
    toast.success(editing ? `${resource.singular} updated` : `${resource.singular} created`)
    closeSheet()
    load()
  }

  async function confirmDelete() {
    if (!deleting) return
    const res = await fetch(`/api/admin/resources/${resource.key}/${deleting.id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    setDeleting(null)
    if (!res.ok) return toast.error(data.error ?? "Could not delete")
    toast.success(`${resource.singular} deleted`)
    load()
  }

  const columnMeta = (name: string): { label: string; type: FieldType } => {
    const f = resource.fields.find((x) => x.name === name)
    if (f) return { label: f.label, type: f.type }
    return SYSTEM_COLUMNS[name] ?? { label: name, type: "text" }
  }
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const rowLabel = (row: Row) =>
    String(row.name ?? row.title ?? row.orderNo ?? row.label ?? row.question ?? row.phone ?? `#${row.id}`)

  return (
    <>
      <PageHeader
        title={resource.title}
        description={resource.description}
        icon={resource.icon}
        actions={
          canCreate && (
            <Button onClick={openCreate}>
              <HugeiconsIcon icon={PlusSignIcon} />
              Add {resource.singular.toLowerCase()}
            </Button>
          )
        }
      />

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-center gap-3 border-b p-3">
          <div className="relative w-full max-w-xs">
            <HugeiconsIcon icon={Search01Icon} className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              placeholder={`Search ${resource.title.toLowerCase()}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {filterField && (
            <Select value={filter} onValueChange={changeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filterField.label.toLowerCase()}</SelectItem>
                {filterField.options!.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-muted-foreground ml-auto text-sm">{total} total</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {resource.imageField && <TableHead className="w-16" />}
                {resource.columns.map((c) => (
                  <TableHead key={c}>{columnMeta(c).label}</TableHead>
                ))}
                <TableHead className="w-28 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={resource.columns.length + 2}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={resource.columns.length + 2} className="text-muted-foreground py-12 text-center">
                    {debounced || filter !== "all" ? "Nothing matches your search." : `No ${resource.title.toLowerCase()} yet.`}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className="cursor-pointer" onClick={() => openEdit(row)}>
                    {resource.imageField && (
                      <TableCell>
                        {row[resource.imageField] ? (
                          <img src={String(row[resource.imageField])} alt="" className="size-11 max-w-none rounded-lg border object-cover" />
                        ) : (
                          <div className="bg-muted size-11 shrink-0 rounded-lg" />
                        )}
                      </TableCell>
                    )}
                    {resource.columns.map((c, i) => (
                      <TableCell key={c} className={i === 0 ? "font-medium" : undefined}>
                        <Cell name={c} type={columnMeta(c).type} value={row[c]} />
                      </TableCell>
                    ))}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        {resource.detailHref && (
                          <Button variant="ghost" size="icon" asChild title="Open details">
                            <Link href={resource.detailHref(row.id)}>
                              <HugeiconsIcon icon={LinkSquare02Icon} />
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(row)}>
                          <HugeiconsIcon icon={PencilEdit01Icon} />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(row)}
                          >
                            <HugeiconsIcon icon={Delete02Icon} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between border-t p-3 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <HugeiconsIcon icon={ArrowLeft01Icon} /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next <HugeiconsIcon icon={ArrowRight01Icon} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Sheet open={sheetOpen} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent className="w-full gap-0 sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle>{editing ? `Edit ${resource.singular.toLowerCase()}` : `New ${resource.singular.toLowerCase()}`}</SheetTitle>
            <SheetDescription>{editing ? rowLabel(editing) : resource.description}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <ResourceForm
              fields={resource.fields}
              values={values}
              rawRow={editing ?? undefined}
              onChange={(name, value) => setValues((v) => ({ ...v, [name]: value }))}
            />
          </div>
          <SheetFooter className="flex-row justify-end gap-2 border-t">
            <Button variant="outline" onClick={closeSheet}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting ? rowLabel(deleting) : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes it from the database and the app. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
