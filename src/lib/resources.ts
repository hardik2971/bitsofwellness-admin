// Declarative description of every admin module. Shared by the generic list/edit UI
// (client) and the generic CRUD API (server), so it must stay free of server imports.

export type FieldType =
  | "text"
  | "textarea"
  | "int"
  | "float"
  | "image"
  | "boolean"
  | "select"
  | "list"
  | "date"
  | "datetime"
  | "color"
  | "json"

export type Field = {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: { label: string; value: string }[]
  /** Shown in the form but not editable (e.g. order line items sent by the app). */
  readOnly?: boolean
  help?: string
  placeholder?: string
  /** Default for new records. */
  default?: unknown
}

export type ResourceGroup = "Content" | "Store" | "Engagement" | "Customers" | "System"

export type Resource = {
  key: string
  model: string
  title: string
  singular: string
  group: ResourceGroup
  icon: string
  description: string
  fields: Field[]
  columns: string[]
  searchFields: string[]
  orderBy: Record<string, "asc" | "desc">[]
  canCreate?: boolean
  canDelete?: boolean
  /** Field shown as the row thumbnail. */
  imageField?: string
  /** Optional link from a row to a custom detail page. */
  detailHref?: (id: number) => string
}

const active: Field = { name: "isActive", label: "Visible in app", type: "boolean", default: true }
const sort: Field = { name: "sortOrder", label: "Sort order", type: "int", default: 0, help: "Lower numbers show first" }
const contentOrder: Resource["orderBy"] = [{ sortOrder: "asc" }, { id: "asc" }]

const opts = (...values: string[]) => values.map((v) => ({ label: v, value: v }))
const enumOpts = (...values: string[]) =>
  values.map((v) => ({ label: v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " "), value: v }))

export const RESOURCES: Resource[] = [
  // ------------------------------------------------------------- Content
  {
    key: "dietitians",
    model: "dietitian",
    title: "Dietitians",
    singular: "Dietitian",
    group: "Content",
    icon: "doctor",
    description: "Experts shown in “Our Dietitians” on Home, About Us and Counselling History.",
    imageField: "image",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "title", label: "Speciality", type: "text", required: true },
      { name: "years", label: "Years of experience", type: "int", default: 0 },
      { name: "image", label: "Photo", type: "image", required: true },
      { name: "bio", label: "Bio", type: "textarea", required: true },
      active,
      sort,
    ],
    columns: ["name", "title", "years", "isActive", "sortOrder"],
    searchFields: ["name", "title"],
    orderBy: contentOrder,
  },
  {
    key: "reviews",
    model: "review",
    title: "User Reviews",
    singular: "Review",
    group: "Content",
    icon: "star",
    description: "Testimonials in the “User Reviews” carousel on Home.",
    fields: [
      { name: "name", label: "Customer name", type: "text", required: true },
      { name: "text", label: "Review", type: "textarea", required: true },
      { name: "lostKg", label: "Weight lost (kg)", type: "float", default: 0 },
      { name: "rating", label: "Rating (1-5)", type: "int", default: 5 },
      active,
      sort,
    ],
    columns: ["name", "lostKg", "rating", "isActive", "sortOrder"],
    searchFields: ["name", "text"],
    orderBy: contentOrder,
  },
  {
    key: "transformations",
    model: "transformation",
    title: "Transformations",
    singular: "Transformation",
    group: "Content",
    icon: "transform",
    description: "Before / after stories in the “Transformations” carousel.",
    imageField: "afterImage",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "beforeImage", label: "Before photo", type: "image", required: true },
      { name: "afterImage", label: "After photo", type: "image", required: true },
      { name: "lostKg", label: "Weight lost (kg)", type: "int", required: true },
      { name: "months", label: "Months", type: "int", required: true },
      { name: "story", label: "Story", type: "textarea", required: true },
      active,
      sort,
    ],
    columns: ["name", "lostKg", "months", "isActive", "sortOrder"],
    searchFields: ["name", "story"],
    orderBy: contentOrder,
  },
  {
    key: "recipes",
    model: "recipe",
    title: "Recipes",
    singular: "Recipe",
    group: "Content",
    icon: "recipe",
    description: "Recipes carousel on Home and the recipe detail screen.",
    imageField: "image",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "image", label: "Image", type: "image", required: true },
      { name: "minutes", label: "Cooking time (min)", type: "int", required: true },
      { name: "kcal", label: "Calories (kcal)", type: "int", required: true },
      { name: "ingredients", label: "Ingredients", type: "list", required: true, help: "One ingredient per line" },
      { name: "steps", label: "Method", type: "list", required: true, help: "One step per line" },
      active,
      sort,
    ],
    columns: ["title", "minutes", "kcal", "isActive", "sortOrder"],
    searchFields: ["title"],
    orderBy: contentOrder,
  },
  {
    key: "stories",
    model: "story",
    title: "Stories",
    singular: "Story",
    group: "Content",
    icon: "story",
    description: "“Stories For You” row on Home and the full-screen story viewer.",
    imageField: "image",
    fields: [
      { name: "tag", label: "Tag", type: "text", required: true, placeholder: "#Recipes" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "image", label: "Image", type: "image", required: true },
      { name: "body", label: "Story text", type: "textarea", required: true },
      active,
      sort,
    ],
    columns: ["title", "tag", "isActive", "sortOrder"],
    searchFields: ["title", "tag"],
    orderBy: contentOrder,
  },
  {
    key: "feed",
    model: "feedPost",
    title: "Explore Feed",
    singular: "Feed post",
    group: "Content",
    icon: "explore",
    description: "Posts in the Explore tab. The category decides which chip shows the post.",
    imageField: "image",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: opts("Recipes", "Transformations", "Mythbusters", "Facts", "Swaps"),
      },
      { name: "image", label: "Image", type: "image", required: true },
      { name: "caption", label: "Caption", type: "textarea", required: true },
      { name: "likes", label: "Starting likes", type: "int", default: 0 },
      active,
      sort,
    ],
    columns: ["title", "category", "likes", "isActive", "sortOrder"],
    searchFields: ["title", "caption"],
    orderBy: contentOrder,
  },
  {
    key: "onboarding",
    model: "onboardingSlide",
    title: "Onboarding",
    singular: "Onboarding slide",
    group: "Content",
    icon: "onboarding",
    description: "Slides shown on first launch, before login.",
    imageField: "image",
    fields: [
      { name: "title", label: "Title", type: "textarea", required: true, help: "Use a new line to break the heading" },
      { name: "subtitle", label: "Subtitle", type: "textarea", required: true },
      { name: "image", label: "Image", type: "image", required: true },
      active,
      sort,
    ],
    columns: ["title", "isActive", "sortOrder"],
    searchFields: ["title"],
    orderBy: contentOrder,
  },
  {
    key: "tips",
    model: "tip",
    title: "Daily Tips",
    singular: "Tip",
    group: "Content",
    icon: "tip",
    description: "“Today's Tip” card on Home rotates through these by day.",
    fields: [{ name: "text", label: "Tip", type: "textarea", required: true }, active, sort],
    columns: ["text", "isActive", "sortOrder"],
    searchFields: ["text"],
    orderBy: contentOrder,
  },

  // ------------------------------------------------------------- Store
  {
    key: "products",
    model: "product",
    title: "Products",
    singular: "Product",
    group: "Store",
    icon: "product",
    description: "Store catalogue. “Featured” products appear under Newly Launched.",
    imageField: "image",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "image", label: "Image", type: "image", required: true },
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: opts("Teas", "Protein", "Supplements", "Combos", "Snacks", "Accessories", "Smart Devices"),
      },
      { name: "price", label: "Selling price (₹)", type: "int", required: true },
      { name: "mrp", label: "MRP (₹)", type: "int", required: true },
      { name: "rating", label: "Rating", type: "float", default: 4.5 },
      { name: "description", label: "Description", type: "textarea", required: true },
      { name: "isFeatured", label: "Featured (Newly Launched)", type: "boolean", default: false },
      active,
      sort,
    ],
    columns: ["name", "category", "price", "mrp", "isFeatured", "isActive"],
    searchFields: ["name", "category"],
    orderBy: contentOrder,
  },
  {
    key: "plans",
    model: "plan",
    title: "Pro Plans",
    singular: "Plan",
    group: "Store",
    icon: "crown",
    description: "Subscription plans in the Pro tab.",
    fields: [
      { name: "durationLabel", label: "Duration label", type: "text", required: true, placeholder: "6 MONTHS" },
      { name: "name", label: "Plan name", type: "text", required: true },
      { name: "price", label: "Price (₹)", type: "int", required: true },
      { name: "mrp", label: "MRP (₹)", type: "int", required: true },
      { name: "features", label: "Features", type: "list", required: true, help: "One feature per line" },
      { name: "isRecommended", label: "Selected by default", type: "boolean", default: false },
      active,
      sort,
    ],
    columns: ["durationLabel", "name", "price", "mrp", "isRecommended", "isActive"],
    searchFields: ["name", "durationLabel"],
    orderBy: contentOrder,
  },
  {
    key: "services",
    model: "service",
    title: "Live Zone & Tests",
    singular: "Service",
    group: "Store",
    icon: "service",
    description: "Live Zone classes and Health Test packages in the Store.",
    fields: [
      { name: "kind", label: "Type", type: "select", required: true, options: [
        { label: "Live class", value: "LIVE" },
        { label: "Health test", value: "HEALTH_TEST" },
      ] },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "subtitle", label: "Subtitle", type: "text", required: true },
      { name: "priceLabel", label: "Price label", type: "text", required: true, placeholder: "₹499 or Free with Pro" },
      { name: "icon", label: "Icon", type: "select", options: opts("yoga", "fire", "smile", "run", "medical", "heart", "medicine", "sun"), default: "medical" },
      active,
      sort,
    ],
    columns: ["title", "kind", "priceLabel", "isActive", "sortOrder"],
    searchFields: ["title", "subtitle"],
    orderBy: [{ kind: "asc" }, ...contentOrder],
  },
  {
    key: "spin-rewards",
    model: "spinReward",
    title: "Spin & Win",
    singular: "Reward",
    group: "Store",
    icon: "gift",
    description: "Segments on the Spin & Win wheel.",
    fields: [
      { name: "label", label: "Label", type: "text", required: true, placeholder: "25% OFF" },
      { name: "color", label: "Segment colour", type: "color", required: true, default: "#7CB82F" },
      active,
      sort,
    ],
    columns: ["label", "color", "isActive", "sortOrder"],
    searchFields: ["label"],
    orderBy: contentOrder,
  },

  // ------------------------------------------------------------- Engagement / tools
  {
    key: "notifications",
    model: "notification",
    title: "Notifications",
    singular: "Notification",
    group: "Engagement",
    icon: "bell",
    description: "In-app notifications (bell icon on Home). The type decides the icon and where a tap goes.",
    fields: [
      { name: "type", label: "Type", type: "select", required: true, options: [
        { label: "Coach message", value: "coach" },
        { label: "Water reminder → Water Tracker", value: "water" },
        { label: "Offer → Pro tab", value: "offer" },
        { label: "Meal plan → Meal Log", value: "plan" },
        { label: "Tip", value: "tip" },
        { label: "Welcome → Health test", value: "order" },
      ] },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "body", label: "Message", type: "textarea", required: true },
      { name: "publishedAt", label: "Published at", type: "datetime" },
      active,
    ],
    columns: ["title", "type", "publishedAt", "isActive"],
    searchFields: ["title", "body"],
    orderBy: [{ publishedAt: "desc" }],
  },
  {
    key: "assessment",
    model: "assessmentQuestion",
    title: "Health Assessment",
    singular: "Question",
    group: "Engagement",
    icon: "quiz",
    description: "Questions in the free weight test. List options from least to most healthy.",
    fields: [
      { name: "question", label: "Question", type: "text", required: true },
      { name: "options", label: "Answer options", type: "list", required: true, help: "One per line, worst habit first" },
      active,
      sort,
    ],
    columns: ["question", "isActive", "sortOrder"],
    searchFields: ["question"],
    orderBy: contentOrder,
  },
  {
    key: "food-swaps",
    model: "foodSwap",
    title: "Food Swaps",
    singular: "Food swap",
    group: "Engagement",
    icon: "swap",
    description: "Healthy swaps in Tools → Food Swap.",
    fields: [
      { name: "fromName", label: "Swap from", type: "text", required: true },
      { name: "fromKcal", label: "From calories", type: "text", required: true, placeholder: "540 kcal" },
      { name: "toName", label: "Swap to", type: "text", required: true },
      { name: "toKcal", label: "To calories", type: "text", required: true, placeholder: "120 kcal" },
      active,
      sort,
    ],
    columns: ["fromName", "fromKcal", "toName", "toKcal", "isActive"],
    searchFields: ["fromName", "toName"],
    orderBy: contentOrder,
  },
  {
    key: "food-items",
    model: "foodItem",
    title: "Meal Log Foods",
    singular: "Food",
    group: "Engagement",
    icon: "food",
    description: "Foods users can pick in Tools → Meal Log.",
    fields: [
      { name: "name", label: "Food", type: "text", required: true },
      { name: "kcal", label: "Calories (kcal)", type: "int", required: true },
      active,
      sort,
    ],
    columns: ["name", "kcal", "isActive", "sortOrder"],
    searchFields: ["name"],
    orderBy: contentOrder,
  },

  // ------------------------------------------------------------- Customers (data sent by the app)
  {
    key: "users",
    model: "appUser",
    title: "App Users",
    singular: "User",
    group: "Customers",
    icon: "users",
    description: "Everyone who signed in to the app, with the profile they set up.",
    canCreate: false,
    detailHref: (id) => `/users/${id}`,
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "phone", label: "Phone", type: "text", required: true },
      { name: "countryCode", label: "Country code", type: "text", default: "+91" },
      { name: "email", label: "Email", type: "text" },
      { name: "gender", label: "Gender", type: "select", options: opts("Male", "Female", "Other") },
      { name: "dob", label: "Date of birth", type: "date" },
      { name: "heightCm", label: "Height (cm)", type: "float" },
      { name: "weightKg", label: "Weight (kg)", type: "float" },
      { name: "targetWeightKg", label: "Target weight (kg)", type: "float" },
      { name: "goal", label: "Goal", type: "select", options: opts("Lose Weight", "Build Muscle", "Maintain Weight", "Manage PCOS / Thyroid", "Manage Diabetes") },
      { name: "activityLevel", label: "Activity level", type: "select", options: opts("Sedentary", "Lightly Active", "Moderately Active", "Very Active") },
      { name: "dietPreference", label: "Diet", type: "select", options: opts("Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan", "Jain") },
      { name: "healthConditions", label: "Health conditions", type: "list" },
      { name: "isActive", label: "Account active", type: "boolean", default: true },
    ],
    columns: ["name", "phone", "goal", "weightKg", "createdAt", "isActive"],
    searchFields: ["name", "phone", "email"],
    orderBy: [{ createdAt: "desc" }],
  },
  {
    key: "orders",
    model: "order",
    title: "Orders",
    singular: "Order",
    group: "Customers",
    icon: "order",
    description: "Store orders placed from the app.",
    canCreate: false,
    fields: [
      { name: "orderNo", label: "Order no.", type: "text", readOnly: true },
      { name: "customerName", label: "Customer", type: "text", readOnly: true },
      { name: "phone", label: "Phone", type: "text", readOnly: true },
      { name: "total", label: "Total (₹)", type: "int", readOnly: true },
      { name: "items", label: "Items", type: "json", readOnly: true },
      { name: "status", label: "Status", type: "select", required: true, options: enumOpts("PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED") },
    ],
    columns: ["orderNo", "customerName", "phone", "total", "status", "createdAt"],
    searchFields: ["orderNo", "phone", "customerName"],
    orderBy: [{ createdAt: "desc" }],
  },
  {
    key: "subscriptions",
    model: "subscription",
    title: "Subscriptions",
    singular: "Subscription",
    group: "Customers",
    icon: "subscription",
    description: "Pro plans bought in the app.",
    canCreate: false,
    fields: [
      { name: "planName", label: "Plan", type: "text", readOnly: true },
      { name: "phone", label: "Phone", type: "text", readOnly: true },
      { name: "price", label: "Price (₹)", type: "int", readOnly: true },
      { name: "paymentMethod", label: "Payment method", type: "text", readOnly: true },
      { name: "startDate", label: "Start date", type: "date" },
      { name: "endDate", label: "End date", type: "date" },
      { name: "status", label: "Status", type: "select", required: true, options: enumOpts("ACTIVE", "EXPIRED", "CANCELLED") },
    ],
    columns: ["planName", "phone", "price", "status", "startDate"],
    searchFields: ["planName", "phone"],
    orderBy: [{ createdAt: "desc" }],
  },
  {
    key: "requests",
    model: "request",
    title: "Requests & Bookings",
    singular: "Request",
    group: "Customers",
    icon: "request",
    description: "Call-backs, WhatsApp chats, dietitian consultations, live class joins and health test bookings.",
    canCreate: false,
    fields: [
      { name: "type", label: "Type", type: "select", readOnly: true, options: enumOpts("CALLBACK", "WHATSAPP", "CONSULTATION", "LIVE_CLASS", "HEALTH_TEST") },
      { name: "name", label: "Name", type: "text", readOnly: true },
      { name: "phone", label: "Phone", type: "text", readOnly: true },
      { name: "subject", label: "Subject", type: "text", readOnly: true },
      { name: "status", label: "Status", type: "select", required: true, options: enumOpts("NEW", "CONTACTED", "CLOSED") },
      { name: "note", label: "Internal note", type: "textarea" },
    ],
    columns: ["type", "name", "phone", "subject", "status", "createdAt"],
    searchFields: ["phone", "name", "subject"],
    orderBy: [{ createdAt: "desc" }],
  },
]

export const RESOURCE_GROUPS: ResourceGroup[] = ["Content", "Store", "Engagement", "Customers"]

export function getResource(key: string) {
  return RESOURCES.find((r) => r.key === key)
}

/** Columns that aren't regular fields but exist on every model. */
export const SYSTEM_COLUMNS: Record<string, { label: string; type: FieldType }> = {
  createdAt: { label: "Created", type: "datetime" },
  updatedAt: { label: "Updated", type: "datetime" },
}
