import type { Metadata } from "next"
import Image from "next/image"
import { Suspense } from "react"

import { LoginForm } from "./login-form"

export const metadata: Metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#2E7D32] to-[#1B5E20] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-[#7CB82F]/30" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-[#F7931E]/25" />
        <div className="relative inline-flex w-fit rounded-2xl bg-white px-4 py-3">
          <Image src="/logo_full.png" alt="Bitsofwellness" width={180} height={60} priority />
        </div>
        <div className="relative max-w-md space-y-4">
          <h1 className="text-4xl font-bold leading-tight">Everything your app shows, in one place.</h1>
          <p className="text-lg text-white/80">
            Manage recipes, dietitians, the store, plans and notifications, and follow every user, order and
            booking coming from the app.
          </p>
        </div>
        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} Bitsofwellness</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <Image src="/logo_full.png" alt="Bitsofwellness" width={160} height={54} className="lg:hidden" priority />
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to the admin panel.</p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
