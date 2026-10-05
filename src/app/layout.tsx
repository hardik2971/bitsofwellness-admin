import type { Metadata } from "next"
import { Manrope } from "next/font/google"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

import "./globals.css"

const manrope = Manrope({ variable: "--font-sans", subsets: ["latin"] })

export const metadata: Metadata = {
  title: { default: "Bitsofwellness Admin", template: "%s · Bitsofwellness Admin" },
  description: "Manage the Bitsofwellness app: content, store, users and orders.",
  robots: { index: false, follow: false },
  icons: { icon: "/logo_mark.png" },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
