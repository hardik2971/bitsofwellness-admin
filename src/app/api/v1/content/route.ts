import { handle } from "@/lib/api"
import { absoluteUrl, assertAppKey } from "@/lib/app-api"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

const visible = { where: { isActive: true }, orderBy: [{ sortOrder: "asc" as const }, { id: "asc" as const }] }

/** Everything the app displays, in one request. The app caches it for offline use. */
export const GET = handle(async (req: Request) => {
  assertAppKey(req)
  const url = (v: string) => absoluteUrl(req, v)

  const [
    settings, dietitians, reviews, transformations, recipes, stories, feed, products, plans,
    notifications, foodSwaps, foodItems, tips, onboarding, assessment, spinRewards, services,
  ] = await Promise.all([
    prisma.setting.findMany(),
    prisma.dietitian.findMany(visible),
    prisma.review.findMany(visible),
    prisma.transformation.findMany(visible),
    prisma.recipe.findMany(visible),
    prisma.story.findMany(visible),
    prisma.feedPost.findMany(visible),
    prisma.product.findMany(visible),
    prisma.plan.findMany(visible),
    prisma.notification.findMany({ where: { isActive: true, publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, take: 50 }),
    prisma.foodSwap.findMany(visible),
    prisma.foodItem.findMany(visible),
    prisma.tip.findMany(visible),
    prisma.onboardingSlide.findMany(visible),
    prisma.assessmentQuestion.findMany(visible),
    prisma.spinReward.findMany(visible),
    prisma.service.findMany(visible),
  ])

  const settingMap = Object.fromEntries(
    settings.map((s) => [s.key, s.key.endsWith("Image") ? url(s.value) : s.value]),
  )

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      settings: settingMap,
      dietitians: dietitians.map((d) => ({ id: d.id, name: d.name, title: d.title, bio: d.bio, image: url(d.image), years: d.years })),
      reviews: reviews.map((r) => ({ id: r.id, name: r.name, text: r.text, lostKg: r.lostKg, rating: r.rating })),
      transformations: transformations.map((t) => ({
        id: t.id, name: t.name, before: url(t.beforeImage), after: url(t.afterImage), lostKg: t.lostKg, months: t.months, story: t.story,
      })),
      recipes: recipes.map((r) => ({
        id: r.id, title: r.title, image: url(r.image), minutes: r.minutes, kcal: r.kcal, ingredients: r.ingredients, steps: r.steps,
      })),
      stories: stories.map((s) => ({ id: s.id, tag: s.tag, title: s.title, image: url(s.image), body: s.body })),
      feed: feed.map((f) => ({ id: f.id, category: f.category, title: f.title, caption: f.caption, image: url(f.image), likes: f.likes })),
      products: products.map((p) => ({
        id: p.id, name: p.name, image: url(p.image), price: p.price, mrp: p.mrp, category: p.category,
        description: p.description, rating: p.rating, isFeatured: p.isFeatured,
      })),
      plans: plans.map((p) => ({
        id: p.id, durationLabel: p.durationLabel, name: p.name, price: p.price, mrp: p.mrp, features: p.features, isRecommended: p.isRecommended,
      })),
      notifications: notifications.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, publishedAt: n.publishedAt })),
      foodSwaps: foodSwaps.map((s) => ({ id: s.id, fromName: s.fromName, fromKcal: s.fromKcal, toName: s.toName, toKcal: s.toKcal })),
      foodItems: foodItems.map((f) => ({ id: f.id, name: f.name, kcal: f.kcal })),
      tips: tips.map((t) => t.text),
      onboarding: onboarding.map((o) => ({ id: o.id, title: o.title, subtitle: o.subtitle, image: url(o.image) })),
      assessment: assessment.map((a) => ({ id: a.id, question: a.question, options: a.options })),
      spinRewards: spinRewards.map((s) => ({ id: s.id, label: s.label, color: s.color })),
      services: services.map((s) => ({
        id: s.id, kind: s.kind, title: s.title, subtitle: s.subtitle, priceLabel: s.priceLabel, icon: s.icon,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  )
})
