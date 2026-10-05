import fs from "node:fs/promises"
import path from "node:path"

import { MIME_BY_EXT, resolveUploadPath } from "@/lib/storage"

// Public: the mobile app loads every content image from here.
export async function GET(_req: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const file = resolveUploadPath((await ctx.params).path)
  const type = file && MIME_BY_EXT[path.extname(file).toLowerCase()]
  if (!file || !type) return new Response("Not found", { status: 404 })
  try {
    const data = await fs.readFile(/*turbopackIgnore: true*/ file)
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    })
  } catch {
    return new Response("Not found", { status: 404 })
  }
}
