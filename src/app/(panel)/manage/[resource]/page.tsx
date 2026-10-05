import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ResourceManager } from "@/components/resource-manager"
import { getResource } from "@/lib/resources"

export async function generateMetadata({ params }: PageProps<"/manage/[resource]">): Promise<Metadata> {
  return { title: getResource((await params).resource)?.title ?? "Not found" }
}

export default async function ManagePage({ params }: PageProps<"/manage/[resource]">) {
  const { resource } = await params
  if (!getResource(resource)) notFound()
  // key forces a fresh state when switching between modules
  return <ResourceManager key={resource} resourceKey={resource} />
}
