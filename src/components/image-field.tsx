"use client"

/* eslint-disable @next/next/no-img-element -- images come from our own /uploads route */
import { Delete02Icon, ImageUpload01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function ImageField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function upload(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/admin/upload", { method: "POST", body: form })
    const data = await res.json().catch(() => ({}))
    setUploading(false)
    if (!res.ok) return toast.error(data.error ?? "Upload failed")
    onChange(data.url)
  }

  return (
    <div className="flex items-center gap-4">
      <div className="bg-muted flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
        {value ? (
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <HugeiconsIcon icon={ImageUpload01Icon} className="text-muted-foreground size-7" />
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) upload(f)
            e.target.value = ""
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => input.current?.click()}>
          <HugeiconsIcon icon={ImageUpload01Icon} />
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange("")}>
            <HugeiconsIcon icon={Delete02Icon} />
            Remove
          </Button>
        )}
        <p className="text-muted-foreground text-xs">JPG, PNG or WEBP, up to 5 MB</p>
      </div>
    </div>
  )
}
