import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { PageHeader } from "@/components/page-header"
import { requireAdmin } from "@/lib/auth"

import { AdminsManager } from "./admins-manager"

export const metadata: Metadata = { title: "Admin Users" }

export default async function AdminsPage() {
  const session = await requireAdmin()
  if (session.role !== "SUPER_ADMIN") redirect("/dashboard")
  return (
    <>
      <PageHeader
        title="Admin Users"
        description="People who can sign in to this panel. Editors manage content and customers; super admins can also manage admins."
        icon="admins"
      />
      <AdminsManager currentId={session.adminId} />
    </>
  )
}
