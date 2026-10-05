# Bitsofwellness Admin

Admin panel and API for the **Bitsofwellness** mobile app (Flutter, in `../bitsofwellness-mobile`).
Every piece of content the app shows is managed here, and everything the app records
(users, weight logs, orders, Pro subscriptions, call-back and booking requests) shows up here.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · Hugeicons · Prisma 6 · MySQL

## Modules

| Group | Modules |
| --- | --- |
| Content | Dietitians, User Reviews, Transformations, Recipes, Stories, Explore Feed, Onboarding, Daily Tips |
| Store | Products, Pro Plans, Live Zone & Health Tests, Spin & Win rewards |
| Engagement | Notifications, Health Assessment questions, Food Swaps, Meal Log foods |
| Customers | App Users (with per-user detail page), Orders, Subscriptions, Requests & Bookings |
| System | App Settings (home/login/store texts and images, goals, delivery rules, support contacts, review test account, maintenance message), Admin Users |

Plus a dashboard with sign-ups, revenue, and the latest orders and requests.

## Local setup

Requirements: Node.js 20+ and MySQL 8 (or MariaDB 10.4+).

```bash
npm install
cp .env.example .env           # then fill in the values (see below)
npx prisma migrate deploy      # create the tables
npm run db:seed                # load the app's current content + first admin
npm run dev                    # http://localhost:3000
```

### Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | MySQL connection string. URL-encode special characters in the password (`@` → `%40`). |
| `SESSION_SECRET` | Long random string (32+ chars) used to sign admin sessions. |
| `APP_API_KEY` | Shared key the mobile app sends as `x-app-key`. Must match the app build. |
| `PUBLIC_BASE_URL` | Public URL of this panel, e.g. `https://admin.example.com`. Used for image URLs sent to the app. Leave empty to use the request host. |
| `UPLOAD_DIR` | Folder for uploaded images (default `./storage/uploads`). Back it up. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | First super admin, created by `npm run db:seed` if it doesn't exist. |

## Production (Ubuntu server with Nginx + PM2)

```bash
git clone https://github.com/hardik2971/bitsofwellness-admin.git && cd bitsofwellness-admin
npm ci
cp .env.example .env && nano .env      # production values
npx prisma migrate deploy
npm run db:seed                        # safe to re-run: only fills empty tables
npm run build
pm2 start ecosystem.config.js && pm2 save
```

Put Nginx in front (HTTPS via Let's Encrypt) and proxy to port 3100:

```nginx
server {
  server_name admin.example.com;
  client_max_body_size 6m;
  location / {
    proxy_pass http://127.0.0.1:3100;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Updating: `git pull && npm ci && npx prisma migrate deploy && npm run build && pm2 restart bitsofwellness-admin`.

## Mobile API (`/api/v1`)

All endpoints except `health` require the header `x-app-key: <APP_API_KEY>`.

| Method | Path | Body / query | Used by the app for |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | – | Uptime check (also checks the database) |
| GET | `/api/v1/content` | – | All app content + settings in one payload (cached on the phone) |
| POST | `/api/v1/users/sync` | `{ phone, countryCode, profile? }` | Sign-in and profile updates |
| POST | `/api/v1/users/delete` | `{ phone }` | In-app account deletion |
| POST | `/api/v1/weight-logs` | `{ phone, kg }` | Weight tracker |
| POST | `/api/v1/orders` | `{ phone, items: [{ productId, qty }] }` | Checkout (prices and delivery are computed on the server) |
| GET | `/api/v1/orders?phone=` | – | "Your Orders" with live status |
| POST | `/api/v1/subscriptions` | `{ phone, planId, paymentMethod }` | Pro plan purchase |
| POST | `/api/v1/requests` | `{ phone, type, subject }` | Call-back, WhatsApp, consultation, live class, health test |

Images are served publicly from `/uploads/...`.

> Login in the app is a static OTP flow (the code is generated on the phone), so these endpoints
> identify users by phone number plus the shared app key. Add real OTP verification and per-user
> tokens before relying on this for sensitive data.
