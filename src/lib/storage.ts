import "server-only"

import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

/** Uploaded images live outside /public so they are served even after `next build`. */
export const UPLOAD_ROOT = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? "./storage/uploads")

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

/** Detects the real image format from its first bytes (the browser-sent type can't be trusted). */
function detectImageExt(b: Buffer): string | null {
  if (b.length < 12) return null
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ".jpg"
  if (b[0] === 0x89 && b.toString("ascii", 1, 4) === "PNG") return ".png"
  if (b.toString("ascii", 0, 4) === "GIF8") return ".gif"
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return ".webp"
  return null
}

export async function saveUpload(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Image must be 5 MB or smaller")
  const data = Buffer.from(await file.arrayBuffer())
  const ext = detectImageExt(data)
  if (!ext) throw new Error("Only JPG, PNG, WEBP or GIF images are allowed")

  const month = new Date().toISOString().slice(0, 7) // 2026-10
  const dir = path.join(/*turbopackIgnore: true*/ UPLOAD_ROOT, month)
  await fs.mkdir(dir, { recursive: true })
  const name = `${crypto.randomBytes(12).toString("hex")}${ext}`
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ dir, name), data)
  return `/uploads/${month}/${name}`
}

/** Resolves an /uploads/... path to a file on disk, refusing anything outside UPLOAD_ROOT. */
export function resolveUploadPath(segments: string[]): string | null {
  const full = path.resolve(/*turbopackIgnore: true*/ UPLOAD_ROOT, ...segments)
  return full.startsWith(UPLOAD_ROOT + path.sep) ? full : null
}

export const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
}
