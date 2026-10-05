"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { ImageField } from "@/components/image-field"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Setting = { key: string; value: string; label: string; group: string }

export function SettingsForm({ settings }: { settings: Setting[] }) {
  const router = useRouter()
  const [values, setValues] = useState(() => Object.fromEntries(settings.map((s) => [s.key, s.value])))
  const [saving, setSaving] = useState(false)
  const groups = useMemo(() => [...new Set(settings.map((s) => s.group))], [settings])
  const dirty = settings.some((s) => values[s.key] !== s.value)

  async function save() {
    setSaving(true)
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    })
    setSaving(false)
    if (!res.ok) return toast.error((await res.json().catch(() => ({}))).error ?? "Could not save")
    toast.success("Settings saved. The app picks them up on its next launch.")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <Card key={group}>
          <CardHeader>
            <CardTitle>{group}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            {settings
              .filter((s) => s.group === group)
              .map((s) => (
                <div key={s.key} className={s.key.endsWith("Image") ? "space-y-2 md:col-span-2" : "space-y-2"}>
                  <Label htmlFor={s.key}>{s.label || s.key}</Label>
                  {s.key.endsWith("Image") ? (
                    <ImageField value={values[s.key]} onChange={(url) => setValues((v) => ({ ...v, [s.key]: url }))} />
                  ) : (
                    <Input id={s.key} value={values[s.key]} onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))} />
                  )}
                </div>
              ))}
          </CardContent>
        </Card>
      ))}
      <div className="bg-background/95 sticky bottom-0 z-10 -mx-4 -mb-4 flex justify-end gap-2 border-t p-3 backdrop-blur md:-mx-6 md:-mb-6">
        <Button variant="outline" disabled={!dirty || saving} onClick={() => setValues(Object.fromEntries(settings.map((s) => [s.key, s.value])))}>
          Discard
        </Button>
        <Button disabled={!dirty || saving} onClick={save}>
          {saving ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </div>
  )
}
