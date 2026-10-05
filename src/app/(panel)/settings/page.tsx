import type { Metadata } from "next"

import { PageHeader } from "@/components/page-header"
import { requireAdmin } from "@/lib/auth"
import { prisma } from "@/lib/db"

import { SettingsForm } from "./settings-form"

export const metadata: Metadata = { title: "App Settings" }
export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  await requireAdmin()
  const settings = await prisma.setting.findMany({ orderBy: { id: "asc" } })
  return (
    <>
      <PageHeader
        title="App Settings"
        description="Texts, images, goals, contact details and the review test account used across the app."
        icon="settings"
      />
      <SettingsForm settings={settings.map(({ key, value, label, group }) => ({ key, value, label, group }))} />
    </>
  )
}
