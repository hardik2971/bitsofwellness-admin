import { badRequest, handle } from "@/lib/api"
import { assertAdmin } from "@/lib/auth"
import { saveUpload } from "@/lib/storage"

export const POST = handle(async (req: Request) => {
  await assertAdmin()
  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) badRequest("No file uploaded")
  try {
    return Response.json({ url: await saveUpload(file) }, { status: 201 })
  } catch (e) {
    badRequest(e instanceof Error ? e.message : "Upload failed")
  }
})
