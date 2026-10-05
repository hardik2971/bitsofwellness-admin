"use client"

import { Delete02Icon, PencilEdit01Icon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"

type Admin = {
  id: number
  name: string
  email: string
  role: "SUPER_ADMIN" | "EDITOR"
  isActive: boolean
  lastLoginAt: string | null
}

const blank = { name: "", email: "", password: "", role: "EDITOR" as Admin["role"], isActive: true }

export function AdminsManager({ currentId }: { currentId: number }) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [editing, setEditing] = useState<Admin | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<Admin | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/admins")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => !cancelled && setAdmins(data))
    return () => {
      cancelled = true
    }
  }, [tick])
  const load = useCallback(() => setTick((t) => t + 1), [])

  function openNew() {
    setEditing(null)
    setForm(blank)
    setOpen(true)
  }
  function openEdit(a: Admin) {
    setEditing(a)
    setForm({ name: a.name, email: a.email, password: "", role: a.role, isActive: a.isActive })
    setOpen(true)
  }

  async function save() {
    setSaving(true)
    const body = editing
      ? { name: form.name, role: form.role, isActive: form.isActive, ...(form.password ? { password: form.password } : {}) }
      : { name: form.name, email: form.email, password: form.password, role: form.role }
    const res = await fetch(editing ? `/api/admin/admins/${editing.id}` : "/api/admin/admins", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) return toast.error(data.error ?? "Could not save")
    toast.success(editing ? "Admin updated" : "Admin created")
    setOpen(false)
    load()
  }

  async function remove() {
    if (!deleting) return
    const res = await fetch(`/api/admin/admins/${deleting.id}`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    setDeleting(null)
    if (!res.ok) return toast.error(data.error ?? "Could not delete")
    toast.success("Admin removed")
    load()
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={openNew}>
          <HugeiconsIcon icon={PlusSignIcon} /> Add admin
        </Button>
      </div>
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.name} {a.id === currentId && <span className="text-muted-foreground text-xs">(you)</span>}
                </TableCell>
                <TableCell>{a.email}</TableCell>
                <TableCell>{a.role === "SUPER_ADMIN" ? "Super admin" : "Editor"}</TableCell>
                <TableCell>
                  {a.isActive ? <Badge className="bg-primary/10 text-primary">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
                </TableCell>
                <TableCell>{formatDate(a.lastLoginAt)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(a)}>
                    <HugeiconsIcon icon={PencilEdit01Icon} />
                  </Button>
                  {a.id !== currentId && (
                    <Button variant="ghost" size="icon" title="Delete" className="text-destructive" onClick={() => setDeleting(a)}>
                      <HugeiconsIcon icon={Delete02Icon} />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit admin" : "Add admin"}</DialogTitle>
            <DialogDescription>{editing ? editing.email : "They can sign in right away with this email and password."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-name">Name</Label>
              <Input id="a-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="a-email">Email</Label>
                <Input id="a-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="a-pass">{editing ? "New password (leave blank to keep)" : "Password"}</Label>
              <Input id="a-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <p className="text-muted-foreground text-xs">At least 8 characters.</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Admin["role"] })} disabled={editing?.id === currentId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editing && editing.id !== currentId && (
              <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <Label htmlFor="a-active">Can sign in</Label>
                <Switch id="a-active" checked={form.isActive} onCheckedChange={(c) => setForm({ ...form, isActive: c })} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>They will no longer be able to sign in to the admin panel.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive hover:bg-destructive/90 text-white">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
