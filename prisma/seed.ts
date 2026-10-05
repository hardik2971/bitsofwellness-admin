/**
 * Seeds the database with everything the mobile app currently ships with.
 * Content tables are only filled when empty, so re-running never duplicates
 * rows or overwrites edits made in the admin panel.
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import fs from "node:fs"
import path from "node:path"

const prisma = new PrismaClient()

const img = (file: string) => `/uploads/seed/${file}`

function copySeedImages() {
  const src = path.join(__dirname, "seed-images")
  const dest = path.join(process.env.UPLOAD_DIR ?? "./storage/uploads", "seed")
  fs.mkdirSync(dest, { recursive: true })
  for (const f of fs.readdirSync(src)) {
    const target = path.join(dest, f)
    if (!fs.existsSync(target)) fs.copyFileSync(path.join(src, f), target)
  }
}

async function seedIfEmpty<T>(
  name: string,
  count: () => Promise<number>,
  rows: T[],
  create: (data: T[]) => Promise<unknown>,
) {
  if ((await count()) > 0) {
    console.log(`- ${name}: already has data, skipped`)
    return
  }
  await create(rows)
  console.log(`+ ${name}: ${rows.length} rows`)
}

const withOrder = <T extends object>(rows: T[]) => rows.map((r, i) => ({ ...r, sortOrder: i }))

async function main() {
  copySeedImages()

  // Admin login
  const email = (process.env.ADMIN_EMAIL ?? "admin@bitsofwellness.com").toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (!(await prisma.admin.findUnique({ where: { email } }))) {
    if (!password) throw new Error("Set ADMIN_PASSWORD in .env before seeding the first admin.")
    await prisma.admin.create({
      data: { name: "Super Admin", email, passwordHash: await bcrypt.hash(password, 12), role: "SUPER_ADMIN" },
    })
    console.log(`+ admin: ${email}`)
  }

  await seedIfEmpty("dietitians", () => prisma.dietitian.count(), withOrder([
    { name: "Dt. Harpreet Singh", title: "Weight Management Expert", years: 12, image: img("dietitian_1.jpg"),
      bio: "Dt. Harpreet Singh is a renowned nutritionist with over 12 years of clinical experience, helping 8,000+ clients lose weight sustainably with home-cooked Indian meals." },
    { name: "Dt. Meera Iyer", title: "Clinical Nutritionist", years: 9, image: img("dietitian_2.jpg"),
      bio: "Dt. Meera Iyer specialises in PCOS, thyroid and diabetes nutrition. She designs gentle, realistic plans that fit busy family routines." },
    { name: "Dt. Ananya Rao", title: "Sports & Fitness Nutritionist", years: 7, image: img("dietitian_3.jpg"),
      bio: "Dt. Ananya Rao works with athletes and fitness enthusiasts on body recomposition, muscle gain and high-protein vegetarian diets." },
    { name: "Dt. Kabir Mehta", title: "Gut Health Specialist", years: 10, image: img("dietitian_4.jpg"),
      bio: "Dt. Kabir Mehta focuses on gut health, digestion and metabolic wellness, combining traditional Indian foods with modern nutrition science." },
  ]), (data) => prisma.dietitian.createMany({ data }))

  await seedIfEmpty("reviews", () => prisma.review.count(), withOrder([
    { name: "Antara Chatterjee", lostKg: 14, text: "High BP, constipation and post-pregnancy weight made transformation feel impossible until Bitesofwellness gave me a plan I could actually follow." },
    { name: "Narayan Pillai", lostKg: 12, text: "At 41, I lost 12 kg and 4 inches off my waist while still eating my favourite home food. My coach checked in every single day." },
    { name: "Simran Kaur", lostKg: 9, text: "The recipes are simple and tasty. My whole family eats the same meals now and we have all become healthier together." },
    { name: "Rohit Deshmukh", lostKg: 18, text: "Daily tracking of water and steps kept me consistent. Down 18 kg in 7 months with no crash diets." },
  ]), (data) => prisma.review.createMany({ data }))

  await seedIfEmpty("transformations", () => prisma.transformation.count(), withOrder([
    { name: "Gurpreet", beforeImage: img("tf_1_before.jpg"), afterImage: img("tf_1_after.jpg"), lostKg: 28, months: 6,
      story: "Gurpreet struggled with weight since college. With a structured plan and weekly coach check-ins he lost 28 kg in just 6 months." },
    { name: "Kehkashan", beforeImage: img("tf_2_before.jpg"), afterImage: img("tf_2_after.jpg"), lostKg: 22, months: 8,
      story: "A busy mother of two, Kehkashan used simple home recipes and daily walks to lose 22 kg and reverse her pre-diabetes." },
    { name: "Nisha", beforeImage: img("tf_3_before.jpg"), afterImage: img("tf_3_after.jpg"), lostKg: 20, months: 5,
      story: "Nisha, a homemaker from Jammu, lost 20 kg in 5 months while her thyroid levels came back to normal." },
  ]), (data) => prisma.transformation.createMany({ data }))

  await seedIfEmpty("recipes", () => prisma.recipe.count(), withOrder([
    { title: "Roti Wrap", image: img("recipe_1.jpg"), minutes: 10, kcal: 260,
      ingredients: ["1 whole wheat roti", "50 g paneer, crumbled", "Lettuce, onion & mint chutney"],
      steps: ["Warm the roti on a tawa.", "Spread mint chutney evenly.", "Add paneer, lettuce and onion, roll tightly and slice in half."] },
    { title: "Protein Salad", image: img("recipe_2.jpg"), minutes: 15, kcal: 320,
      ingredients: ["100 g boiled chicken or tofu", "3 tbsp hung curd", "Cucumber", "Red onion", "Herbs, salt & pepper"],
      steps: ["Whisk hung curd with salt, pepper and herbs.", "Chop cucumber and onion.", "Toss everything together and chill for 5 minutes."] },
    { title: "Masala Makhana", image: img("recipe_3.jpg"), minutes: 10, kcal: 140,
      ingredients: ["2 cups makhana", "1 tsp ghee", "Curry leaves", "Turmeric", "Chaat masala", "Black pepper", "Salt"],
      steps: ["Heat ghee and add curry leaves.", "Add makhana and roast on low flame for 6 minutes.", "Sprinkle spices, toss and cool before storing."] },
    { title: "Moong Dal Toast", image: img("recipe_4.jpg"), minutes: 20, kcal: 280,
      ingredients: ["1/2 cup soaked moong dal", "2 brown bread slices", "Green chilli", "Ginger", "Coriander", "Salt"],
      steps: ["Grind dal with chilli, ginger and salt into a thick batter.", "Spread batter on bread.", "Cook batter-side down on a greased tawa until golden, flip and toast."] },
  ]), (data) => prisma.recipe.createMany({ data }))

  await seedIfEmpty("stories", () => prisma.story.count(), withOrder([
    { tag: "#Recipes", title: "Turmeric + Black Pepper", image: img("story_1.jpg"),
      body: "Piperine in black pepper boosts curcumin absorption by up to 2000%. Add a pinch of pepper to your haldi doodh for maximum anti-inflammatory benefit." },
    { tag: "#Transformations", title: "Lost 18 Kgs in 6 months", image: img("story_2.jpg"),
      body: "Rohit swapped late-night snacking for a fixed dinner time and 8,000 daily steps. Small habits, big results." },
    { tag: "#Facts", title: "Street Food Under 300 kcal", image: img("story_3.jpg"),
      body: "Khaman dhokla, bhel without sev, and grilled corn are all under 300 calories, making them smart picks when you eat out." },
    { tag: "#Breakfast", title: "Healthy Breakfast Ideas", image: img("story_4.jpg"),
      body: "Poha with peanuts, moong chilla, sprouts salad and oats upma are protein-rich breakfasts that keep you full till lunch." },
  ]), (data) => prisma.story.createMany({ data }))

  await seedIfEmpty("feed posts", () => prisma.feedPost.count(), withOrder([
    { category: "Recipes", title: "High Protein Moong Dal Toast", image: img("recipe_4.jpg"), likes: 436,
      caption: "Moong Dal Toast - a crispy, protein-packed breakfast that is ready in 20 minutes. Perfect for busy mornings and great for weight loss." },
    { category: "Transformations", title: "Nisha lost 20 Kgs!", image: img("tf_3_before.jpg"), likes: 88,
      caption: "Nisha lost 20 kgs! - Nisha from Jammu, a homemaker, transformed her health with home-cooked meals and daily walks." },
    { category: "Facts", title: "Street food under 300 calories", image: img("story_3.jpg"), likes: 191,
      caption: "Yes, you can enjoy street food on a diet! Dhokla, grilled corn and bhel are all low-calorie picks." },
    { category: "Recipes", title: "Weight-loss Roti Wrap", image: img("recipe_1.jpg"), likes: 312,
      caption: "Roti Wrap - 3 ingredients, 10 minutes. Your leftover roti becomes a high-protein lunch." },
    { category: "Mythbusters", title: "Myth: Rice makes you fat", image: img("thali.jpg"), likes: 254,
      caption: "Rice is not the enemy - portion size is. Pair a small bowl of rice with dal and sabzi for a balanced meal." },
    { category: "Swaps", title: "Swap fried snacks for makhana", image: img("recipe_3.jpg"), likes: 167,
      caption: "Swap a pack of chips (540 kcal) for roasted masala makhana (140 kcal). Same crunch, a third of the calories." },
    { category: "Transformations", title: "Gurpreet lost 28 Kgs!", image: img("tf_1_after.jpg"), likes: 129,
      caption: "Gurpreet lost 28 kgs in 6 months with weekly coach check-ins and a simple Punjabi meal plan." },
    { category: "Facts", title: "Turmeric needs pepper", image: img("story_1.jpg"), likes: 91,
      caption: "Black pepper multiplies curcumin absorption. Always add a pinch to your haldi doodh." },
  ]), (data) => prisma.feedPost.createMany({ data }))

  await seedIfEmpty("products", () => prisma.product.count(), withOrder([
    { name: "Green Tea Metabolism Boost", image: img("product_1.jpg"), price: 449, mrp: 599, category: "Teas", isFeatured: false,
      description: "Handpicked green tea leaves blended with garcinia and ginger to support a healthy metabolism. 30 servings." },
    { name: "Plant Protein Powder", image: img("product_2.jpg"), price: 1499, mrp: 1999, category: "Protein", isFeatured: true,
      description: "24 g of complete plant protein per scoop from pea and brown rice. Unflavoured, no added sugar." },
    { name: "ACV Gummies", image: img("product_3.jpg"), price: 599, mrp: 899, category: "Supplements", isFeatured: true,
      description: "Apple cider vinegar gummies with the mother. Supports digestion and appetite control. 60 gummies." },
    { name: "Slim Kit - 3 Months", image: img("product_4.jpg"), price: 6999, mrp: 7497, category: "Combos", isFeatured: true,
      description: "3 months of protein sachets, green tea, ACV gummies and a shaker - everything for your weight-loss journey." },
    { name: "Digestive Herbal Infusion", image: img("product_5.jpg"), price: 399, mrp: 549, category: "Teas", isFeatured: false,
      description: "Fennel, ginger, ajwain and mint infusion to relieve bloating after meals. 25 servings." },
    { name: "Roasted Makhana Snack", image: img("product_6.jpg"), price: 249, mrp: 299, category: "Snacks", isFeatured: true,
      description: "Roasted, never fried. Peri-peri masala fox nuts at just 120 kcal per serving." },
    { name: "Daily Multivitamin", image: img("product_7.jpg"), price: 549, mrp: 799, category: "Supplements", isFeatured: false,
      description: "23 essential vitamins and minerals for energy and immunity. 60 tablets." },
    { name: "Smart Shaker Bottle", image: img("product_8.jpg"), price: 349, mrp: 499, category: "Accessories", isFeatured: false,
      description: "Leak-proof 700 ml shaker with a steel mixing ball. BPA free." },
    { name: "Smart Body Scale", image: img("smart_scale.jpg"), price: 1199, mrp: 4999, category: "Smart Devices", isFeatured: false,
      description: "Tracks 13 body metrics including body fat, BMI and muscle mass. Syncs with the Bitesofwellness app." },
  ]), (data) => prisma.product.createMany({ data }))

  await seedIfEmpty("plans", () => prisma.plan.count(), withOrder([
    { durationLabel: "3 MONTHS", name: "Weight Management Starter Plan", price: 5999, mrp: 8999, isRecommended: false,
      features: ["Dedicated Diet Coach", "Personalized Diet Plan", "Weekly Progress Review", "Recipe Library Access"] },
    { durationLabel: "6 MONTHS", name: "Weight Management Core Plan", price: 9999, mrp: 17999, isRecommended: true,
      features: ["Dedicated Diet Coach", "24/7 Dietitian Counselling", "Personalized Diet Plan", "Dedicated Yoga Coach"] },
    { durationLabel: "12 MONTHS", name: "Weight Management Elite Plan", price: 15999, mrp: 32999, isRecommended: false,
      features: ["Everything in Core Plan", "Smart Body Scale Free", "Quarterly Blood Test", "Priority Doctor Consults"] },
  ]), (data) => prisma.plan.createMany({ data }))

  const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000)
  await seedIfEmpty("notifications", () => prisma.notification.count(), [
    { type: "coach", title: "Your coach sent a message", body: "Great start! Remember to log your breakfast today so I can review your plan.", publishedAt: hoursAgo(0.2) },
    { type: "water", title: "Time to hydrate", body: "You are 1.2 L away from your daily water goal. Drink a glass now!", publishedAt: hoursAgo(1) },
    { type: "offer", title: "Flat 44% off on the Core Plan", body: "Get a dedicated diet coach and yoga sessions. Offer ends tonight.", publishedAt: hoursAgo(3) },
    { type: "plan", title: "Your meal plan is ready", body: "We have added 5 high-protein vegetarian recipes to this week's plan.", publishedAt: hoursAgo(9) },
    { type: "tip", title: "Tip of the day", body: "A 10-minute walk after every meal helps control blood sugar spikes.", publishedAt: hoursAgo(24) },
    { type: "order", title: "Welcome to Bitesofwellness", body: "Complete your profile and take the free health test to get started.", publishedAt: hoursAgo(48) },
  ], (data) => prisma.notification.createMany({ data }))

  await seedIfEmpty("food swaps", () => prisma.foodSwap.count(), withOrder([
    ["Packaged chips (100 g)", "540 kcal", "Roasted makhana (30 g)", "120 kcal"],
    ["Cold drink (330 ml)", "140 kcal", "Lemon water (330 ml)", "10 kcal"],
    ["White bread (2 slices)", "160 kcal", "Multigrain roti (1)", "90 kcal"],
    ["Fried samosa (1)", "260 kcal", "Steamed dhokla (2 pcs)", "110 kcal"],
    ["Milk chocolate (40 g)", "210 kcal", "Dates (2)", "65 kcal"],
    ["Sugar in tea (2 tsp)", "32 kcal", "Cinnamon tea", "2 kcal"],
    ["Mayonnaise (1 tbsp)", "94 kcal", "Hung curd dip (1 tbsp)", "20 kcal"],
  ].map(([fromName, fromKcal, toName, toKcal]) => ({ fromName, fromKcal, toName, toKcal }))),
  (data) => prisma.foodSwap.createMany({ data }))

  await seedIfEmpty("food items", () => prisma.foodItem.count(), withOrder(([
    ["Poha (1 bowl)", 250], ["Idli (2 pcs) + sambar", 220], ["Moong chilla (2)", 240], ["Oats upma (1 bowl)", 210],
    ["Roti (1)", 90], ["Dal (1 katori)", 150], ["Rice (1 katori)", 170], ["Paneer sabzi (1 katori)", 260],
    ["Mixed veg sabzi", 120], ["Curd (1 katori)", 100], ["Green salad", 40], ["Chicken curry (1 katori)", 280],
    ["Roasted makhana (30 g)", 120], ["Fruit bowl", 110], ["Green tea", 2], ["Sprouts chaat", 150],
  ] as [string, number][]).map(([name, kcal]) => ({ name, kcal }))),
  (data) => prisma.foodItem.createMany({ data }))

  await seedIfEmpty("tips", () => prisma.tip.count(), withOrder([
    "Drink a glass of warm water with lemon first thing in the morning to kick-start digestion.",
    "Fill half your plate with vegetables at lunch and dinner to stay full on fewer calories.",
    "Finish dinner at least 2-3 hours before bed for better sleep and digestion.",
    "A 10-minute walk after each meal can lower blood sugar spikes significantly.",
    "Add a protein source to every meal - dal, paneer, curd, eggs or sprouts.",
  ].map((text) => ({ text }))), (data) => prisma.tip.createMany({ data }))

  await seedIfEmpty("onboarding slides", () => prisma.onboardingSlide.count(), withOrder([
    { image: img("onboarding_1.jpg"), title: "Eat what you love,\nthe healthy way",
      subtitle: "Personalised Indian meal plans built around the food you already enjoy at home." },
    { image: img("onboarding_2.jpg"), title: "Expert dietitians,\nalways by your side",
      subtitle: "Get a dedicated coach, daily check-ins and 24/7 counselling on chat or call." },
    { image: img("onboarding_3.jpg"), title: "Track progress,\nsee real results",
      subtitle: "Log weight, water, steps and meals - and watch your transformation happen." },
  ]), (data) => prisma.onboardingSlide.createMany({ data }))

  await seedIfEmpty("assessment questions", () => prisma.assessmentQuestion.count(), withOrder([
    { question: "How many hours do you sleep every night?", options: ["Less than 5", "5 - 6 hours", "7 - 8 hours", "More than 8"] },
    { question: "How often do you eat outside or order in?", options: ["Daily", "3 - 4 times a week", "Once a week", "Rarely"] },
    { question: "How many glasses of water do you drink a day?", options: ["1 - 3", "4 - 6", "7 - 9", "10 or more"] },
    { question: "How would you describe your stress levels?", options: ["Very high", "High", "Moderate", "Low"] },
    { question: "How often do you exercise?", options: ["Never", "1 - 2 days a week", "3 - 4 days a week", "5+ days a week"] },
    { question: "Do you crave sweets or snacks late at night?", options: ["Every day", "Often", "Sometimes", "Never"] },
  ]), (data) => prisma.assessmentQuestion.createMany({ data }))

  await seedIfEmpty("spin rewards", () => prisma.spinReward.count(), withOrder([
    { label: "50% OFF", color: "#E57373" },
    { label: "5% OFF", color: "#FFFFFF" },
    { label: "25% OFF", color: "#3F7CB8" },
    { label: "FREE GIFT", color: "#F4C542" },
    { label: "30% OFF", color: "#9C7AB8" },
    { label: "10% OFF", color: "#7CB82F" },
  ]), (data) => prisma.spinReward.createMany({ data }))

  await seedIfEmpty("services", () => prisma.service.count(), withOrder([
    { kind: "LIVE" as const, title: "Morning Yoga Flow", subtitle: "6:30 AM • Daily", priceLabel: "Free with Pro", icon: "yoga" },
    { kind: "LIVE" as const, title: "Fat Burn HIIT", subtitle: "7:30 AM • Mon, Wed, Fri", priceLabel: "Free with Pro", icon: "fire" },
    { kind: "LIVE" as const, title: "Mindful Meditation", subtitle: "9:00 PM • Daily", priceLabel: "Free with Pro", icon: "smile" },
    { kind: "LIVE" as const, title: "Zumba Dance Cardio", subtitle: "6:00 PM • Tue, Thu, Sat", priceLabel: "Free with Pro", icon: "run" },
    { kind: "HEALTH_TEST" as const, title: "Full Body Checkup", subtitle: "84 parameters • Home collection", priceLabel: "₹1499", icon: "medical" },
    { kind: "HEALTH_TEST" as const, title: "Thyroid Profile", subtitle: "T3, T4, TSH • Reports in 24h", priceLabel: "₹499", icon: "heart" },
    { kind: "HEALTH_TEST" as const, title: "Diabetes Screening", subtitle: "HbA1c, Fasting sugar", priceLabel: "₹599", icon: "medicine" },
    { kind: "HEALTH_TEST" as const, title: "Vitamin D & B12", subtitle: "Deficiency panel", priceLabel: "₹899", icon: "sun" },
  ]), (data) => prisma.service.createMany({ data }))

  const settings: { key: string; value: string; label: string; group: string }[] = [
    { group: "Home", key: "home.heroTitle", value: "Ready to Begin?", label: "Home banner title" },
    { group: "Home", key: "home.heroSubtitle", value: "Start your wellness journey today", label: "Home banner subtitle" },
    { group: "Home", key: "home.heroImage", value: img("coach_home.png"), label: "Home banner image" },
    { group: "Home", key: "home.assessmentTitle", value: "Concerned About Your Weight?", label: "Health assessment card title" },
    { group: "Home", key: "home.assessmentSubtitle", value: "Take a Free test to know what's impacting your weight", label: "Health assessment card subtitle" },
    { group: "Login", key: "login.heroImage", value: img("coach_login.png"), label: "Login screen image" },
    { group: "Login", key: "login.title", value: "Verify Your Mobile Number", label: "Login title" },
    { group: "Login", key: "login.subtitle", value: "We'll send you a code to verify your number", label: "Login subtitle" },
    { group: "Store", key: "store.welcomeTitle", value: "Welcome to Bitesofwellness Store", label: "Store header title" },
    { group: "Store", key: "store.welcomeSubtitle", value: "Healthy, Tasty & Weight-Loss Friendly Picks — All in One Place", label: "Store header subtitle" },
    { group: "Store", key: "store.heroImage", value: img("store_hero.png"), label: "Store header image" },
    { group: "Store", key: "store.bannerImage", value: img("store_banner.jpg"), label: "Store promo banner image" },
    { group: "Store", key: "store.freeDeliveryAbove", value: "499", label: "Free delivery above (₹)" },
    { group: "Store", key: "store.deliveryCharge", value: "49", label: "Delivery charge (₹)" },
    { group: "Goals", key: "goals.waterMl", value: "2000", label: "Daily water goal (ml)" },
    { group: "Goals", key: "goals.steps", value: "8000", label: "Daily steps goal" },
    { group: "Goals", key: "goals.calories", value: "1500", label: "Daily calorie budget (kcal)" },
    { group: "Support", key: "support.phone", value: "+91 99999 99999", label: "Support phone" },
    { group: "Support", key: "support.whatsapp", value: "+91 99999 99999", label: "Support WhatsApp" },
    { group: "Support", key: "support.email", value: "support@bitesofwellness.app", label: "Support email" },
    { group: "Test account", key: "demo.phone", value: "9999999999", label: "Test account phone (+91)" },
    { group: "Test account", key: "demo.otp", value: "123456", label: "Test account OTP" },
    { group: "App", key: "app.latestVersion", value: "1.0.0", label: "Latest app version" },
    { group: "App", key: "app.maintenanceMessage", value: "", label: "Maintenance message (blank = off)" },
  ]
  let added = 0
  for (const s of settings) {
    const exists = await prisma.setting.findUnique({ where: { key: s.key } })
    if (!exists) {
      await prisma.setting.create({ data: s })
      added++
    }
  }
  console.log(`+ settings: ${added} new`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
