"use client"

import {
  Analytics01Icon,
  BodyWeightIcon,
  Book02Icon,
  Compass01Icon,
  CrownIcon,
  CustomerSupportIcon,
  DashboardSquare01Icon,
  Doctor01Icon,
  Exchange01Icon,
  GiftIcon,
  Idea01Icon,
  Notification01Icon,
  Presentation01Icon,
  Quiz01Icon,
  Restaurant01Icon,
  SaladIcon,
  Settings01Icon,
  ShoppingBag02Icon,
  ShoppingCart01Icon,
  CreditCardIcon,
  StarIcon,
  UserGroupIcon,
  UserShield01Icon,
  Yoga01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react"

/** Maps the string icon names used in resources.ts to Hugeicons. */
export const RESOURCE_ICONS = {
  dashboard: DashboardSquare01Icon,
  doctor: Doctor01Icon,
  star: StarIcon,
  transform: BodyWeightIcon,
  recipe: Restaurant01Icon,
  story: Book02Icon,
  explore: Compass01Icon,
  onboarding: Presentation01Icon,
  tip: Idea01Icon,
  product: ShoppingBag02Icon,
  crown: CrownIcon,
  service: Yoga01Icon,
  gift: GiftIcon,
  bell: Notification01Icon,
  quiz: Quiz01Icon,
  swap: Exchange01Icon,
  food: SaladIcon,
  users: UserGroupIcon,
  order: ShoppingCart01Icon,
  subscription: CreditCardIcon,
  request: CustomerSupportIcon,
  settings: Settings01Icon,
  admins: UserShield01Icon,
  analytics: Analytics01Icon,
} as const

export type IconName = keyof typeof RESOURCE_ICONS

export function Icon({ name, ...props }: { name: string } & Omit<HugeiconsIconProps, "icon">) {
  const icon = RESOURCE_ICONS[name as IconName] ?? DashboardSquare01Icon
  return <HugeiconsIcon icon={icon} strokeWidth={1.8} {...props} />
}
