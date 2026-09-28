# Complete Third-Party API / Integration Audit — Gulfshore Group

**Scope:** Full repository (`src/`, root scripts, `prisma/`, config files, `.github/workflows`, `public/`).  
**Approach:** Read-only. Verified actual imports and calls rather than relying solely on `package.json`.  
**Date:** 2026-09-28  
**Note:** No secret values, API keys, tokens, or credentials are printed below. Environment variables are referenced by name only.

---

## 1. Executive Summary

This is a Next.js 16 / React 19 real-estate CRM and listing site. It actively integrates with **Clerk** (auth, with a custom mock fallback), **Bridge Interactive** (MLS feed), **OpenAI** (legacy SDK + Vercel AI SDK), **Twilio** (SMS), **Resend** (email), **Cloudinary** (images/PDFs), **Google Maps Platform**, **Google OAuth**, **Facebook Graph API**, **OneSignal** (web push), **Google Analytics 4**, **Walk Score**, and **FEMA** flood-map proxies. Data persistence is Prisma + MySQL/MariaDB, with legacy Mongoose/MongoDB model files still present. Redis is used for caching.

A number of packages are installed but appear unused, and several hardcoded credentials/fallbacks exist in source.

---

## 2. Actively Used Third-Party Services & SDKs

### 2.1 Authentication & Identity

| Service | Package / Mechanism | Active Use | Key Files |
|---|---|---|---|
| **Clerk** | `@clerk/nextjs` | Primary auth provider; `ClerkProvider`, `auth()`, `currentUser()`, `clerkClient()`, `verifyToken()`, `verifyWebhook()`. | `src/app/layout.tsx`, `src/lib/api/auth.ts`, `src/app/api/v2/lead-capture/route.ts`, `src/app/api/v2/user/update-phone/route.ts`, `src/app/api/v2/magic-login/route.ts`, `src/app/api/leads/[id]/route.ts` |
| **Google OAuth / One Tap** | `accounts.google.com/gsi/client` (script) + direct tokeninfo call | Google sign-in; token verification via `oauth2.googleapis.com` and `www.googleapis.com/oauth2/v3/userinfo`. | `src/app/api/v2/user/google-auth/route.ts`, `src/lib/mock-clerk.tsx`, `src/app/(public)/signup/signupComponent.tsx` |
| **Custom mock/fallback auth** | Home-grown cookie auth | Aliases `@clerk/nextjs` to mock implementations when `NEXT_PUBLIC_USE_REAL_CLERK` is not `"true"`; admin login via `ADMIN_EMAIL`/`ADMIN_PASSWORD`. | `next.config.mjs`, `src/lib/mock-clerk.tsx`, `src/lib/mock-clerk-server.ts`, `src/app/api/admin/auth/route.ts`, `src/lib/admin-store.ts` |

### 2.2 Database, ORM & Caching

| Service | Package | Active Use | Key Files |
|---|---|---|---|
| **Prisma + MariaDB** | `prisma`, `@prisma/client`, `@prisma/adapter-mariadb`, `mariadb` | Primary ORM. Custom output at `src/app/generated/prisma`. | `prisma/schema.prisma`, `src/lib/prisma.ts`, `prisma.config.ts` |
| **Mongoose / MongoDB** | `mongoose`, `mongodb` | Legacy model files remain; `connectDB` helper is defined but **not called** in source. Only TS interfaces from a couple of model files are imported. | `src/lib/dbconfig.ts`, `src/models/*.ts` |
| **Redis** | `ioredis` | Caching and short-term activity flags. | `src/lib/redis.ts`, `src/lib/safeRedis.ts`, `src/lib/leads/services/hot-alert.service.ts`, `src/lib/leads/services/returning-visitor.service.ts`, `src/lib/services/market-report.service.ts` |

### 2.3 MLS / Property Data

| Service | Active Use | Key Files |
|---|---|---|
| **Bridge Interactive** (`api.bridgedataoutput.com`) | Full sync, incremental sync, single-property sync, active-listing verification. | `src/lib/bridge.ts`, `src/jobs/syncProperties.ts`, `src/jobs/verifyActiveProperties.ts`, `src/app/api/v2/sync/single/route.ts`, `src/app/api/test-db/route.ts`, `scripts/backfill-pending.ts`, `force-sync.ts` |

### 2.4 AI / ML

| Service | Package | Active Use | Key Files |
|---|---|---|---|
| **OpenAI** (legacy SDK v3) | `openai` | Blog/FAQ generation, DALL-E image generation. | `src/lib/openai.ts`, `src/app/api/ai/generate-image/route.ts`, `src/app/api/admin/generate-city-ai/route.ts`, `src/app/api/admin/generate-community-ai/route.ts`, `src/app/api/v2/cron/fetch-fb-posts/route.ts` |
| **Vercel AI SDK + OpenAI provider** | `ai`, `@ai-sdk/openai`, `@ai-sdk/react` | Streaming AI chatbot with tools; `generateText`/`generateObject` in webhooks. | `src/app/api/v2/ai/chat/route.ts`, `src/components/chat/AIChatWidget.tsx`, `src/app/api/webhooks/twilio/incoming/route.ts`, `src/app/api/webhooks/email/route.ts`, `src/app/api/v2/webhooks/resend/route.ts`, `src/app/api/v2/webhooks/twilio/route.ts` |

### 2.5 Communications

| Service | Package | Active Use | Key Files |
|---|---|---|---|
| **Resend** | `resend` | Transactional/marketing emails; React Email templates. | `src/lib/email/*.tsx`, `src/lib/email/admin-lead-alert.ts`, `src/app/api/webhooks/email/route.ts`, `src/app/api/v2/webhooks/resend/route.ts`, `src/app/api/v2/cron/run-drip/route.ts`, `src/app/api/v2/user/forgot-password/route.ts`, `src/app/api/contact/route.ts`, `src/app/api/v2/valuation/route.ts`, `src/app/api/sign-agreement/[leadId]/route.ts`, `src/app/api/tour/sign-agreement/route.ts`, `src/jobs/processSavedSearches.ts` |
| **React Email** | `@react-email/components`, `@react-email/render` | JSX email templates. | `src/lib/email/*.tsx`, `src/lib/leads/services/property-alerts.tsx`, `src/app/api/preview-email/route.ts` |
| **Nodemailer / Gmail SMTP** | `nodemailer` | Fallback SMTP in tour agreement route. | `src/app/api/tour/sign-agreement/route.ts` |
| **Twilio** | `twilio` | Outbound SMS, WhatsApp helper, inbound SMS webhook replies, manual admin SMS, drip SMS, saved-search alerts. | `src/lib/twilio.ts`, `src/app/api/webhooks/twilio/incoming/route.ts`, `src/app/api/v2/webhooks/twilio/route.ts`, `src/app/api/admin/send-manual-sms/route.ts`, `src/app/api/leads/[id]/send-agreement/route.ts`, `src/app/api/v2/cron/run-drip/route.ts`, `src/jobs/processSavedSearches.ts`, `src/lib/leads/services/hot-lead-alert.ts` |

### 2.6 File Storage / CDN

| Service | Package | Active Use | Key Files |
|---|---|---|---|
| **Cloudinary** | `cloudinary`, `next-cloudinary` | Signed uploads, AI/blog images, signed agreement PDF storage, upload widget. | `src/lib/cloudinary.ts`, `src/lib/openai.ts`, `src/app/api/ai/generate-image/route.ts`, `src/app/api/signed-cloudinary-params/route.ts`, `src/app/api/sign-agreement/[leadId]/route.ts`, `src/app/api/tour/sign-agreement/route.ts`, `src/components/cloudinary/uploadImg.tsx` |

### 2.7 Maps / Location

| Service | Package / Mechanism | Active Use | Key Files |
|---|---|---|---|
| **Google Maps Platform** | `@react-google-maps/api`, static map URLs, direct Distance Matrix / Places calls | Interactive maps, static map images, distance matrix, places text search. | `src/components/property/propertyMap.tsx`, `src/components/cards/property/cardCarousel.tsx`, `src/app/(public)/Florida-Real-Estate-Search/[[...slug]]/mapComponent.tsx`, `src/app/(public)/Florida-Real-Estate-Listings/[city]/[community]/[property]/[...mls]/page.tsx`, `src/app/api/v2/ai/chat/route.ts` |
| **Walk Score** | `axios` to `api.walkscore.com` | Walk/transit/bike scores on property pages. | `src/components/property/fetchwalkscore.ts` |

### 2.8 Analytics / Tracking / Push

| Service | Mechanism | Active Use | Key Files |
|---|---|---|---|
| **Google Analytics 4** | `gtag` script from `googletagmanager.com` | Page view/events. | `src/app/layout.tsx` |
| **OneSignal** | `react-onesignal`, `cdn.onesignal.com` SDK, service worker | Web push notifications. | `src/app/layout.tsx`, `src/components/global/pushNotification.tsx`, `public/OneSignalSDKWorker.js` |

### 2.9 Social Media / Sharing

| Service | Package / Mechanism | Active Use | Key Files |
|---|---|---|---|
| **Facebook Graph API** | `fetch()` to `graph.facebook.com` | Fetch page posts, rewrite as blog entries. | `src/components/blogs/blogSection.tsx`, `src/app/api/v2/cron/fetch-fb-posts/route.ts` |
| **Social sharing buttons** | `next-share` | Share property listings. | `src/components/property/share-card.tsx` |

### 2.10 PDF / Document Processing

| Service | Package | Active Use | Key Files |
|---|---|---|---|
| **PDF stamping** | `pdf-lib` | Stamp buyer-broker agreements with signatures and metadata. | `src/app/api/sign-agreement/[leadId]/route.ts`, `src/app/api/tour/sign-agreement/route.ts`, `src/app/api/tour/preview-agreement/route.ts` |

### 2.11 Government / Public Data

| Service | Active Use | Key Files |
|---|---|---|
| **FEMA NFHL** | Proxy FEMA flood-map export images. | `src/app/api/fema/route.ts`, `src/components/property/propertyMap.tsx` |

---

## 3. Installed but Apparently Unused Packages / Services

These packages are in `package.json` but no active imports or runtime usage were found in source:

| Package | Why it stands out |
|---|---|
| `@pinecone-database/pinecone` | No imports; no vector/RAG search implementation. |
| `@clerk/types` | No direct type imports found. |
| `@hookform/resolvers` | No resolver usage found despite `react-hook-form` + `zod` being used. |
| `@next/bundle-analyzer` | Not wired into `next.config.mjs` or scripts. |
| `@next/third-parties` | No `<GoogleAnalytics>`, `<GoogleTagManager>`, or similar component usage. |
| `@prisma/adapter-pg` | Project uses MariaDB/MySQL, not PostgreSQL. |
| `@prisma/extension-accelerate` | No accelerate URL/extension usage in source. |
| `handlebars` | No templating usage found. |
| `mysql2` | Not used directly; Prisma uses the MariaDB adapter/driver. |
| `next-sitemap` | No config file or npm script. |
| `react-email` (the CLI package) | Only `@react-email/components`/`render` are used; CLI is not referenced. |
| `react-is` | No imports found. |
| `schema-dts` | No schema.org type imports found. |

**Potentially removable database stack:** `pg`, `mysql2`, `@prisma/adapter-pg`, `mongoose`, `mongodb` — `mongoose` is effectively legacy; only model files and an uncalled `connectDB` helper remain.

---

## 4. Legacy / Minimal Usage Packages

| Package | Status | Notes |
|---|---|---|
| `mongoose` | Legacy | Model files remain; `connectDB` is not called. Only interfaces from `leads.ts`/`contact.ts` imported in a couple of admin pages. |
| `mongodb` | Transitive | Peer dependency of `mongoose`; no direct imports. |
| `lodash.debounce` | Unclear | Type package installed; main `useDebounce` hook appears custom — verify if the lodash function is imported anywhere. |

---

## 5. Environment Variables Referenced (Names Only)

### Authentication
`CLERK_SECRET_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_USE_REAL_CLERK`

### Application / Server URLs
`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_SITE_URL`, `SITE_URL`, `RAILWAY_PUBLIC_DOMAIN`, `NODE_ENV`, `NEXT_PUBLIC_ENV`

### Databases / Cache
`DATABASE_URL`, `MONGODB_URI`, `DB_NAME`

### MLS
`BRIDGE_BASE_URL`, `BRIDGE_API_KEY`, `BRIDGE_SOURCE`

### AI
`OPENAI_API_KEY`

### Email
`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FROM_EMAIL`, `ADMIN_EMAIL`, `ADMIN_ALERT_EMAIL`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_FROM`, `TEST_EMAIL`

### SMS
`TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_NUMBER`, `ADMIN_ALERT_PHONE`, `PROPERTY_ALERT_PHONE`

### Cloudinary
`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_API_KEY`

### Maps / Location
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_WALK_SCORE_API`

### Facebook
`FACEBOOK_PAGE_ID`, `FACEBOOK_ACCESS_TOKEN`

### Cron / Admin Secrets
`CRON_SECRET`, `PROPERTY_ALERTS_API_SECRET`

### Property Alert Envelope
`PROPERTY_ALERT_TO`, `PROPERTY_ALERT_FROM`, `PROPERTY_ALERT_REPLY_TO`, `PROPERTY_ALERT_TITLE`, `PROPERTY_ALERT_SUBTITLE`, `PROPERTY_ALERT_RECIPIENT_NAME`

---

## 6. External Domains / Network Dependencies

Domains contacted at runtime (excluding self-references to `gulfshoregroup.com`):

| Domain / Service | Purpose |
|---|---|
| `api.bridgedataoutput.com` | Bridge Interactive MLS data |
| `api.openai.com` | OpenAI completions / images |
| `api.resend.com` | Resend email API |
| `api.twilio.com` | Twilio SMS API |
| `graph.facebook.com` | Facebook page posts |
| `maps.googleapis.com` | Google Maps JS, Static Maps, Distance Matrix, Places |
| `api.walkscore.com` | Walk Score |
| `hazards.fema.gov` / `msc.fema.gov` (via `src/app/api/fema/route.ts`) | FEMA flood map exports |
| `oauth2.googleapis.com`, `www.googleapis.com/oauth2/v3/userinfo` | Google OAuth tokeninfo / userinfo |
| `accounts.google.com/gsi/client` | Google Identity Services script |
| `cdn.onesignal.com` | OneSignal web SDK |
| `www.googletagmanager.com` | Google Analytics 4 script |
| `res.cloudinary.com`, `*.cloudinary.com` | Cloudinary CDN images |
| `dvvjkgh94f2v6.cloudfront.net` | MLS media CDN (from Bridge data) |
| `images.unsplash.com` | Unsplash placeholder images |
| `gulfshore-fullcode-next-production.up.railway.app` | Production deployment target hit by GitHub Actions cron |

**Next.js image remotePatterns** (`next.config.mjs`): `res.cloudinary.com`, `*.cloudinary.com`, `maps.googleapis.com`, `gulfshoregroup.com`, `dvvjkgh94f2v6.cloudfront.net`, `images.unsplash.com`.

---

## 7. Webhook / Cron Endpoints

| Endpoint | External Caller | Purpose |
|---|---|---|
| `POST /api/v2/lead-capture` | Clerk | `verifyWebhook` — creates/updates lead |
| `POST /api/webhooks/twilio/incoming` | Twilio | Inbound SMS → AI reply |
| `POST /api/v2/webhooks/twilio` | Twilio | Alternate SMS webhook |
| `POST /api/webhooks/twilio/events` | Twilio | Message status callbacks |
| `POST /api/webhooks/email` | Resend | Email reply parser / AI matcher |
| `POST /api/v2/webhooks/resend` | Resend | Resend webhook duplicate |
| `POST /api/webhooks/resend/events` | Resend | Email event status callbacks |
| `GET /api/v2/cron/sync-properties` | GitHub Actions | Property sync |
| `GET /api/v2/cron/run-drip` | GitHub Actions | Drip campaign run |
| `GET /api/v2/cron/send-daily-alerts` | Cron | Saved-search alerts |
| `GET /api/v2/cron/verify-active` | Cron | Active-listing verification |
| `GET /api/v2/cron/fetch-fb-posts` | Cron | Facebook → blog import |
| `GET /api/admin/cron/generate-blog` | Cron | AI blog generation |
| `GET /api/admin/cron/generate-faq` | Cron | AI FAQ generation |

GitHub Actions workflow `.github/workflows/cron.yml` triggers the sync and drip cron jobs hourly.

---

## 8. Security & Hygiene Observations (No Values Exposed)

Multiple locations in the codebase contain hardcoded credentials, fallback secrets, or plaintext configuration. Values are intentionally omitted below; only file locations are given:

1. **Redis credentials** are hardcoded in `src/lib/redis.ts` (host, port, password).
2. **MySQL connection strings** with embedded credentials are hardcoded in root debug/migration scripts: `check.js`, `check_mediterra.js`, `compare_db.js`, `sync_missing_properties.js`, and in `src/app/api/admin/sync-missing/route.ts`.
3. **Bridge API key fallback** is hardcoded in `src/app/api/v2/sync/single/route.ts` and `src/app/api/test-db/route.ts`.
4. **Admin credentials** are stored in plaintext in `src/data/admin-credentials.json`, with additional hardcoded fallback defaults in `src/lib/admin-store.ts`.
5. **Twilio WhatsApp configuration** includes hardcoded content SID / messaging service SID in `src/lib/twilio.ts`.
6. **OneSignal app ID / safari web ID** and **Google Analytics measurement ID** are hardcoded in `src/app/layout.tsx` and `src/components/global/pushNotification.tsx` (public client IDs, but confirm live services).
7. **DEPLOY.md** contains documented example configuration values, including API keys and cloud names.
8. **Debug/test scripts** manually parse `.env` line-by-line, duplicating `dotenv` behavior and increasing risk of leaking values to logs.
9. **Webhook routes** for Twilio/Resend do not appear to verify signatures; some cron routes rely on a simple `CRON_SECRET` bearer check.
10. **Mock Clerk by default:** `next.config.mjs` aliases `@clerk/nextjs` to custom mock implementations unless `NEXT_PUBLIC_USE_REAL_CLERK=true`, making `CLERK_SECRET_KEY` dormant in the default configuration.

---

## 9. Recommendations

1. **Move all secrets out of source.** Replace hardcoded Redis, MySQL, Bridge, Twilio, and admin credentials with required environment variables.
2. **Add `.env.example`** listing every required/optional variable (names only, no values).
3. **Remove or secure fallback admin credentials** in `src/lib/admin-store.ts` and `src/data/admin-credentials.json`.
4. **Verify signature validation** on Twilio and Resend webhook endpoints.
5. **Remove unused packages** (`@pinecone-database/pinecone`, `@prisma/adapter-pg`, `@prisma/extension-accelerate`, `handlebars`, `mysql2`, `next-sitemap`, `react-email` CLI, `schema-dts`, `react-is`, `@hookform/resolvers` if truly unused, `@next/bundle-analyzer` if unused).
6. **Decide on Mongoose/MongoDB.** If the migration to Prisma/MySQL is complete, remove `mongoose`, `mongodb`, `src/lib/dbconfig.ts`, and `src/models/*.ts`.
7. **Standardize URL variables.** Consolidate `NEXT_PUBLIC_SERVER_URL`, `SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `RAILWAY_PUBLIC_DOMAIN`.
8. **Migrate legacy OpenAI SDK** (`openai@3.x`) callers to the Vercel AI SDK to reduce API surface.
9. **Review DEPLOY.md** and remove any committed example secrets; replace with placeholder instructions.

---

*This audit is based on a read-only scan of the repository. No files were modified during the audit.*
