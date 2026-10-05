import { z } from "zod"

import { handle } from "@/lib/api"
import { assertAppKey, PHONE_RE, phoneSchemaMessage, upsertUserByPhone } from "@/lib/app-api"

const body = z.object({
  phone: z.string().regex(PHONE_RE, phoneSchemaMessage),
  countryCode: z.string().max(6).default("+91"),
  profile: z
    .object({
      name: z.string().max(120).optional(),
      email: z.string().max(160).optional(),
      gender: z.string().max(20).optional(),
      dob: z.string().nullable().optional(),
      heightCm: z.number().min(0).max(300).optional(),
      weightKg: z.number().min(0).max(500).optional(),
      targetWeightKg: z.number().min(0).max(500).optional(),
      goal: z.string().max(60).optional(),
      activityLevel: z.string().max(60).optional(),
      dietPreference: z.string().max(60).optional(),
      healthConditions: z.array(z.string().max(60)).max(20).optional(),
    })
    .optional(),
})

/** Called on every login and whenever the profile changes. */
export const POST = handle(async (req: Request) => {
  assertAppKey(req)
  const { phone, countryCode, profile } = body.parse(await req.json())
  const data = {
    countryCode,
    lastLoginAt: new Date(),
    ...(profile ?? {}),
    ...(profile?.dob !== undefined ? { dob: profile.dob ? new Date(profile.dob) : null } : {}),
  }
  const user = await upsertUserByPhone(phone, data, data)
  return Response.json({ id: user.id, isActive: user.isActive })
})
