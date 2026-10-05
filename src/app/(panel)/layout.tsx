import { AppSidebar } from "@/components/app-sidebar"
import { UserMenu } from "@/components/user-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { requireAdmin } from "@/lib/auth"

export default async function PanelLayout({ children }: LayoutProps<"/">) {
  const session = await requireAdmin()
  return (
    <SidebarProvider>
      <AppSidebar role={session.role} />
      <SidebarInset>
        <header className="bg-background/95 sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4 backdrop-blur">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 h-5" />
          <span className="text-muted-foreground text-sm">Bitsofwellness Admin</span>
          <div className="ml-auto">
            <UserMenu name={session.name} email={session.email} role={session.role} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
