"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Icon } from "@/components/icons"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { RESOURCE_GROUPS, RESOURCES } from "@/lib/resources"

export function AppSidebar({ role }: { role: "SUPER_ADMIN" | "EDITOR" }) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const item = (href: string, label: string, icon: string) => (
    <SidebarMenuItem key={href}>
      <SidebarMenuButton asChild isActive={isActive(href)} tooltip={label}>
        <Link href={href}>
          <Icon name={icon} />
          <span>{label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2 px-1 py-1.5">
          <Image src="/logo_mark.png" alt="" width={32} height={32} className="shrink-0" />
          <div className="leading-tight group-data-[collapsible=icon]:hidden">
            <p className="font-bold text-[#1B5E20]">Bitsofwellness</p>
            <p className="text-muted-foreground text-xs">Admin panel</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{item("/dashboard", "Dashboard", "dashboard")}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {RESOURCE_GROUPS.map((group) => (
          <SidebarGroup key={group}>
            <SidebarGroupLabel>{group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {RESOURCES.filter((r) => r.group === group).map((r) => item(`/manage/${r.key}`, r.title, r.icon))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {item("/settings", "App Settings", "settings")}
              {role === "SUPER_ADMIN" && item("/admins", "Admin Users", "admins")}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="text-muted-foreground px-3 text-xs group-data-[collapsible=icon]:hidden">
        v1.0.0
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
