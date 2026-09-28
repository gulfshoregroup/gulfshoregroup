# Complete Third-Party API / Integration Audit — Gulfshore Group

**Scope:** Full repository (`src/`, root scripts, `prisma/`, config files, `.github/workflows`, `public/`).  
**Approach:** Read-only. Verified actual imports, SDK instantiations, `fetch`/`axios` calls, `process.env` references, and hardcoded URLs rather than relying solely on `package.json`.  
**Date:** 2026-09-28  
**Note:** No secret values, API keys, tokens, or credentials are printed below. Environment variables and credential locations are referenced by name/path only.

---

## 1. Executive Summary

This is a **Next.js 16 / React 19** real-estate CRM and listing site. It actively integrates with:

- **Clerk** (auth, with a custom mock fallback)
- **Bridge Interactive** (MLS feed)
- **OpenAI** (legacy `openai` SDK v3 + Vercel AI SDK)
- **Twilio** (SMS / WhatsApp)
- **Resend** (transactional/marketing email)
- **Cloudinary** (images / PDFs)
- **Google Maps Platform** + **Google OAuth**
- **Facebook Graph API**
- **OneSignal** (web push)
- **Google Analytics 4**
- **Walk Score**
- **FEMA** (flood-map proxy)

Data persistence is **Prisma + MariaDB/MySQL**, with **Redis** for caching and legacy **Mongoose/MongoDB** model files still present.

**Key concerns found:**
- Several packages are installed but appear unused (reducing them would shrink attack surface).
- Multiple hardcoded credentials/fallbacks exist in source code (locations listed, values omitted).
- Some webhook endpoints do not appear to verify sender signatures.
- URL environment variables are duplicated/inconsistent across the codebase.

---

## 2. `package.json` at a Glance

| Category | Count |
|----------|-------|
| `dependencies` | 78 |
| `devDependencies` | 15 |
| Directly imported / configured packages | ~64 |
| Unused / leftover direct dependencies | ~14 |
| Distinct external API/network integrations | ~16 |
| Unique `process.env.*` variables found | 50+ |

---

## 3. Actively Used Third-Party Services & SDKs

### 3.1 Authentication & Identity

| Service | Package / Mechanism | Purpose | Key Files (line refs) |
|---|---|---|---|
| **Clerk** | `@clerk/nextjs` | Primary auth: `ClerkProvider`, `auth()`, `currentUser()`, `clerkClient()`, `verifyToken()`, `verifyWebhook()`. | `src/app/layout.tsx:4,69`, `src/lib/api/auth.ts:1`, `src/hooks/verifyUser.tsx:1-2`, `src/app/api/v2/lead-capture/route.ts:2`, `src/app/api/v2/user/update-phone/route.ts:2`, `src/app/api/v2/magic-login/route.ts:3`, `src/app/api/leads/[id]/route.ts:3` |
| **Google OAuth / One Tap** | `accounts.google.com/gsi/client` script + direct `fetch` to Google tokeninfo/userinfo | Google sign-in on client; server verifies tokens. | `src/app/api/v2/user/google-auth/route.ts:23-42`, `src/lib/mock-clerk.tsx:77,440,505,950`, `src/app/(public)/signup/signupComponent.tsx:140` |
| **Custom mock/fallback auth** | Home-grown cookie auth | `next.config.mjs` aliases `@clerk/nextjs` to mock implementations unless `NEXT_PUBLIC_USE_REAL_CLERK="true"`; admin login via `ADMIN_EMAIL`/`ADMIN_PASSWORD`. | `next.config.mjs:55-69`, `src/lib/mock-clerk.tsx`, `src/lib/mock-clerk-server.ts`, `src/app/api/admin/auth/route.ts`, `src/lib/admin-store.ts:5-27` |

### 3.2 Database, ORM & Caching

| Service | Package | Purpose | Key Files (line refs) |
|---|---|---|---|
| **Prisma + MariaDB/MySQL** | `prisma`, `@prisma/client`, `@prisma/adapter-mariadb`, `mariadb` | Primary ORM. Custom output at `src/app/generated/prisma`. | `prisma/schema.prisma:1-739`, `src/lib/prisma.ts:1-58`, `prisma.config.ts:1-11` |
| **MySQL2 (raw driver)** | `mysql2/promise` | Direct connection in one admin sync route and several root debug/migration scripts. | `src/app/api/admin/sync-missing/route.ts:2-6`, `check.js:1-3`, `check_mediterra.js:1-3`, `compare_db.js:1-5`, `sync_missing_properties.js:1-5`, `debug_dimitri_job.js`, `check_property_dates.js`, `scratch_check.js`, `test_db.js` |
| **Redis** | `ioredis` | Caching and short-term activity flags. | `src/lib/redis.ts:1-55`, `src/lib/safeRedis.ts:1-27`, `src/lib/leads/services/hot-alert.service.ts`, `src/lib/leads/services/returning-visitor.service.ts`, `src/lib/services/market-report.service.ts`, `src/app/api/v2/cities/route.ts`, `src/app/api/v2/properties/[property]/route.ts` |
| **Mongoose / MongoDB** | `mongoose`, `mongodb` | Legacy model files remain; `connectDB` helper is defined but **not called** in source. Only TS interfaces from a couple of model files are imported. | `src/lib/dbconfig.ts:1-30`, `src/models/*.ts` |

### 3.3 MLS / Property Data

| Service | Active Use | Key Files (line refs) |
|---|---|---|
| **Bridge Interactive** (`api.bridgedataoutput.com`) | Full sync, incremental sync, single-property sync, active-listing verification. | `src/lib/bridge.ts:2-99`, `src/jobs/syncProperties.ts`, `src/jobs/verifyActiveProperties.ts`, `src/app/api/v2/sync/single/route.ts:5-47`, `src/app/api/test-db/route.ts:4-13`, `scripts/backfill-pending.ts`, `force-sync.ts` |

### 3.4 AI / LLM

| Service | Package | Purpose | Key Files (line refs) |
|---|---|---|---|
| **OpenAI** (legacy SDK v3) | `openai` | Blog/FAQ generation, DALL-E image generation, Facebook-post rewriting. | `src/lib/openai.ts:1-238`, `src/app/api/ai/generate-image/route.ts:2-51`, `src/app/api/admin/generate-city-ai/route.ts`, `src/app/api/admin/generate-community-ai/route.ts`, `src/app/api/v2/cron/fetch-fb-posts/route.ts:3-77` |
| **Vercel AI SDK + OpenAI provider** | `ai`, `@ai-sdk/openai`, `@ai-sdk/react` | Streaming AI chatbot with tools (Distance Matrix, Places, property search, tour booking); `generateText` for SMS/email webhook replies. | `src/app/api/v2/ai/chat/route.ts:1-703`, `src/components/chat/AIChatWidget.tsx:3`, `src/app/api/webhooks/twilio/incoming/route.ts:4-79`, `src/app/api/webhooks/email/route.ts:7-489`, `src/app/api/v2/webhooks/resend/route.ts`, `src/app/api/v2/webhooks/twilio/route.ts` |

### 3.5 Communications

| Service | Package | Purpose | Key Files (line refs) |
|---|---|---|---|
| **Resend** | `resend` | Transactional/marketing emails; React Email templates; admin lead alerts; webhooks. | `src/lib/email/admin-lead-alert.ts:1-199`, `src/lib/email/*.tsx`, `src/lib/leads/services/property-alerts.tsx`, `src/app/api/webhooks/email/route.ts:3-566`, `src/app/api/v2/webhooks/resend/route.ts`, `src/app/api/v2/cron/run-drip/route.ts`, `src/app/api/v2/user/forgot-password/route.ts`, `src/app/api/contact/route.ts`, `src/app/api/v2/valuation/route.ts`, `src/app/api/sign-agreement/[leadId]/route.ts`, `src/app/api/tour/sign-agreement/route.ts`, `src/jobs/processSavedSearches.ts` |
| **React Email** | `@react-email/components`, `@react-email/render` | JSX email templates rendered to HTML. | `src/lib/email/*.tsx`, `src/lib/leads/services/property-alerts.tsx`, `src/app/api/preview-email/route.ts` |
| **Nodemailer / Gmail SMTP** | `nodemailer` | Fallback SMTP in tour agreement route. | `src/app/api/tour/sign-agreement/route.ts:4,171-184` |
| **Twilio** | `twilio` | Outbound SMS, WhatsApp helper, inbound SMS webhook AI replies, manual admin SMS, drip SMS, saved-search alerts, hot-lead admin alerts. | `src/lib/twilio.ts:1-69`, `src/app/api/webhooks/twilio/incoming/route.ts`, `src/app/api/v2/webhooks/twilio/route.ts`, `src/app/api/admin/send-manual-sms/route.ts`, `src/app/api/leads/[id]/send-agreement/route.ts`, `src/app/api/v2/cron/run-drip/route.ts:159`, `src/app/api/v2/user/signup-lead/route.ts`, `src/app/api/v2/property-alerts/route.ts`, `src/lib/leads/services/hot-lead-alert.ts`, `src/lib/leads/services/hot-alert.service.ts`, `src/jobs/processSavedSearches.ts` |

### 3.6 File Storage / CDN

| Service | Package | Purpose | Key Files (line refs) |
|---|---|---|---|
| **Cloudinary** | `cloudinary`, `next-cloudinary` | Signed uploads, AI/blog images, signed agreement PDF storage, upload widget. | `src/lib/cloudinary.ts:1-9`, `src/lib/openai.ts:200-231`, `src/app/api/ai/generate-image/route.ts:12-51`, `src/app/api/signed-cloudinary-params/route.ts`, `src/app/api/sign-agreement/[leadId]/route.ts`, `src/app/api/tour/sign-agreement/route.ts`, `src/components/cloudinary/uploadImg.tsx` |

### 3.7 Maps / Location

| Service | Package / Mechanism | Purpose | Key Files (line refs) |
|---|---|---|---|
| **Google Maps Platform** | `@react-google-maps/api`, static map URLs, direct Distance Matrix / Places `fetch` | Interactive maps, static map images, distance matrix, places text search. | `src/components/property/propertyMap.tsx:4,36`, `src/components/map/marker.tsx:4`, `src/components/cards/property/cardCarousel.tsx:40`, `src/app/(public)/Florida-Real-Estate-Search/[[...slug]]/mapComponent.tsx:71`, `src/app/(public)/Florida-Real-Estate-Listings/[city]/[community]/[property]/[...mls]/page.tsx:91-92`, `src/app/api/v2/ai/chat/route.ts:117-186` |
| **Walk Score** | `axios` to `api.walkscore.com` | Walk/transit/bike scores on property pages. | `src/components/property/fetchwalkscore.ts:1-28`, `src/components/property/walkscore.tsx` |

### 3.8 Analytics / Tracking / Push

| Service | Mechanism | Purpose | Key Files (line refs) |
|---|---|---|---|
| **Google Analytics 4** | `gtag` script from `googletagmanager.com` | Page views/events. | `src/app/layout.tsx:139-152` |
| **OneSignal** | `react-onesignal`, `cdn.onesignal.com` SDK, service worker | Web push notifications. | `src/app/layout.tsx:120-138`, `src/components/global/pushNotification.tsx:1-32`, `public/OneSignalSDKWorker.js` |

### 3.9 Social Media / Sharing

| Service | Package / Mechanism | Purpose | Key Files (line refs) |
|---|---|---|---|
| **Facebook Graph API** | `fetch()` to `graph.facebook.com` | Fetch page posts, rewrite as blog entries; render FB posts in blog section. | `src/app/api/v2/cron/fetch-fb-posts/route.ts:21-149`, `src/components/blogs/blogSection.tsx:22-45` |
| **Social sharing buttons** | `next-share` | Share property listings. | `src/components/property/share-card.tsx` |

### 3.10 PDF / Document Processing

| Service | Package | Purpose | Key Files (line refs) |
|---|---|---|---|
| **PDF stamping** | `pdf-lib` | Stamp buyer-broker agreements with signatures and metadata. | `src/app/api/sign-agreement/[leadId]/route.ts`, `src/app/api/tour/sign-agreement/route.ts:3-110`, `src/app/api/tour/preview-agreement/route.ts` |

### 3.11 Government / Public Data

| Service | Mechanism | Purpose | Key Files (line refs) |
|---|---|---|---|
| **FEMA NFHL** | Proxy FEMA flood-map export images via `/api/fema` | Flood-map tile overlay on property maps. | `src/app/api/fema/route.ts:1-79`, `src/components/property/propertyMap.tsx:59-87`, `src/app/(public)/Florida-Real-Estate-Search/[[...slug]]/mapComponent.tsx:236-268` |

---

## 4. Active Runtime Dependencies

| Package | Version | Purpose | Sample Usage |
|---|---|---|---|
| `@ai-sdk/openai` | `^4.0.20` | Vercel AI SDK provider for OpenAI | `src/app/api/v2/ai/chat/route.ts:1` |
| `@ai-sdk/react` | `^4.0.40` | `useChat` hook for AI widget | `src/components/chat/AIChatWidget.tsx:3` |
| `@clerk/nextjs` | `^6.36.5` | Auth provider & server helpers | `src/app/layout.tsx:4`, `src/lib/api/auth.ts:1` |
| `@dnd-kit/*` | various | Drag-and-drop primitives | `src/components/data-table.tsx` |
| `@prisma/adapter-mariadb` | `^7.8.0` | MariaDB driver adapter for Prisma | `src/lib/prisma.ts:10,26` |
| `@prisma/client` | `^7.0.0` | Generated Prisma client | `src/lib/prisma.ts:1` |
| `@radix-ui/react-*` | various | shadcn/ui primitives | `src/components/ui/*.tsx` |
| `@react-email/components` | `^1.0.12` | React email components | `src/lib/email/welcome-email.tsx:16` |
| `@react-email/render` | `^2.0.8` | Render React emails to HTML | `src/lib/email/welcome-email.tsx:17` |
| `@react-google-maps/api` | `^2.20.7` | Google Maps React components | `src/components/property/propertyMap.tsx:4` |
| `@reduxjs/toolkit` | `^2.9.2` | State management | `src/state/store.ts:1` |
| `@tailwindcss/postcss` | `^4.1.16` | Tailwind PostCSS plugin | `postcss.config.mjs:3` |
| `@tailwindcss/typography` | `^0.5.20` | Typography plugin | `tailwind.config.ts:19` |
| `@tanstack/react-table` | `^8.21.3` | Headless data tables | `src/components/data-table.tsx:51` |
| `ai` | `^7.0.37` | Vercel AI SDK core | `src/app/api/v2/ai/chat/route.ts:2` |
| `axios` | `^1.13.0` | HTTP client (admin CRUD, Walk Score) | `src/app/(admin)/admin/blogs/page.tsx:23` |
| `class-variance-authority` | `^0.7.1` | `cva` utility | `src/components/ui/button.tsx:3` |
| `cloudinary` | `^2.10.0` | Cloudinary Node SDK | `src/lib/cloudinary.ts:1` |
| `clsx` | `^2.1.1` | Conditional classnames | `src/lib/utils.ts:1` |
| `cmdk` | `^1.1.1` | Command palette | `src/components/ui/command.tsx:4` |
| `date-fns` | `^4.1.0` | Date formatting | `src/app/(admin)/admin/communication-logs/page.tsx:24` |
| `dotenv` | `^17.2.3` | Load `.env` in scripts | `prisma.config.ts:1`, `seed-blogs.ts:1` |
| `embla-carousel-*` | `^8.6.0` | Carousels | `src/components/ui/carousel.tsx`, `src/components/home/reviews-section.tsx` |
| `eslint-config-next` | `^16.0.0` | Next.js ESLint preset | `.eslintrc.json:2` |
| `input-otp` | `^1.4.2` | OTP input | `src/components/ui/input-otp.tsx:4` |
| `ioredis` | `^5.8.2` | Redis client | `src/lib/redis.ts:1` |
| `lucide-react` | `^0.548.0` | Lucide icons | Many UI files |
| `mongoose` | `^8.19.2` | MongoDB ODM (legacy) | `src/lib/dbconfig.ts:1` |
| `mysql2` | `^3.24.2` | Raw MySQL driver | `src/app/api/admin/sync-missing/route.ts:2` |
| `next` | `^16.0.0` | Framework | `src/app/layout.tsx:3` |
| `next-cloudinary` | `^6.17.5` | Cloudinary upload widget | `src/components/cloudinary/uploadImg.tsx:2` |
| `next-share` | `^0.27.0` | Social share buttons | `src/components/property/share-card.tsx:23` |
| `next-themes` | `^0.4.6` | Theme provider | `src/components/global/themeProvider.tsx:4` |
| `nodemailer` | `^7.0.10` | SMTP fallback | `src/app/api/tour/sign-agreement/route.ts:4` |
| `openai` | `^3.3.0` | Legacy OpenAI SDK | `src/lib/openai.ts:3` |
| `pdf-lib` | `^1.17.1` | PDF generation for agreements | `src/app/api/tour/sign-agreement/route.ts:3` |
| `qs` | `^6.14.0` | Query-string parsing | `src/state/api.ts:9` |
| `react` / `react-dom` | `^19.2.0` | UI library | `src/app/layout.tsx`, etc. |
| `react-day-picker` | `^10.0.1` | Date picker | `src/components/ui/calendar.tsx:9` |
| `react-hook-form` | `^7.80.0` | Form handling | `src/components/ui/form.tsx:14` |
| `react-onesignal` | `^3.4.0` | OneSignal React wrapper | `src/components/global/pushNotification.tsx:2` |
| `react-redux` | `^9.2.0` | Redux bindings | `src/components/cards/property/property-card.tsx:12` |
| `react-resizable-panels` | `^4.12.0` | Resizable panels | `src/components/ui/resizable.tsx:6` |
| `react-signature-canvas` | `^1.1.0-alpha.2` | Signature pad | `src/components/cards/models/scheduleTour.tsx:7` |
| `recharts` | `^3.3.0` | Charts | `src/app/(admin)/admin/analytics/page.tsx:22` |
| `resend` | `^6.7.0` | Email provider | `src/lib/email/admin-lead-alert.ts:5` |
| `sonner` | `^2.0.7` | Toast notifications | `src/app/(admin)/admin/blogs/page.tsx:24` |
| `tailwind-merge` | `^3.3.1` | Merge Tailwind classes | `src/lib/utils.ts:2` |
| `tailwindcss-animate` | `^1.0.7` | Tailwind animations | `tailwind.config.ts:18` |
| `tw-animate-css` | `^1.4.0` | CSS animations import | `src/app/globals.css:3` |
| `twilio` | `^5.11.2` | SMS / WhatsApp | `src/lib/twilio.ts:1` |
| `vaul` | `^1.1.2` | Drawer primitive | `src/components/ui/drawer.tsx:4` |
| `zod` | `^3.25.76` | Schema validation | `src/app/api/v2/ai/chat/route.ts:3` |

### 4.1 Active Dev / Build / Config Dependencies

| Package | Version | Purpose |
|---|---|---|
| `prisma` | `^7.0.0` | ORM CLI / generate |
| `tailwindcss` | `^4.1.16` | CSS framework |
| `postcss` | `^8.5.6` | CSS processing |
| `typescript` | `^5` | Type checking |
| `tsx` | `^4.21.0` | TS execution utility |
| `@types/*` | various | Type definitions |

### 4.2 Transitive / Peer Driver Packages

| Package | Notes |
|---|---|
| `mariadb` | Required by `@prisma/adapter-mariadb`; loaded at runtime |
| `mongodb` | Peer driver for `mongoose` |
| `caniuse-lite` | Browserslist data used by Next.js |
| `baseline-browser-mapping` | Transitive build metadata |

---

## 5. Installed but Apparently Unused Packages / Services

These packages are in `package.json` but no active imports or runtime usage were found in source code (excluding generated code):

| Package | Why it appears unused |
|---|---|
| `@pinecone-database/pinecone` | No imports; no vector/RAG search implementation. |
| `@clerk/types` | No direct type imports found. |
| `@hookform/resolvers` | `react-hook-form` and `zod` are used, but no resolver imports found. |
| `@next/bundle-analyzer` | Not wired into `next.config.mjs` or scripts. |
| `@next/third-parties` | No `<GoogleAnalytics>`, `<GoogleTagManager>`, or similar component usage. |
| `@prisma/adapter-pg` | Project uses MariaDB/MySQL, not PostgreSQL. |
| `@prisma/extension-accelerate` | No accelerate URL/extension usage in source. |
| `handlebars` | No templating usage found. |
| `next-sitemap` | No config file or npm script. |
| `react-email` (CLI package) | Only `@react-email/components`/`render` are used; CLI is not referenced. |
| `react-is` | No imports found. |
| `schema-dts` | No schema.org type imports found. |
| `pg` | No direct `pg` imports found. |
| `lodash.debounce` | A custom `useDebounce` hook is used; no lodash debounce import found. |

**Note on `mysql2`:** It **is** directly used in `src/app/api/admin/sync-missing/route.ts:2` and several root debug/migration scripts, so it is not strictly unused despite Prisma using MariaDB.

**Potentially removable database stack:** `@prisma/adapter-pg`, `mongoose`, `mongodb` — `mongoose` is effectively legacy; only model files and an uncalled `connectDB` helper remain.

---

## 6. Legacy / Minimal Usage Packages

| Package | Status | Notes |
|---|---|---|
| `mongoose` | Legacy | Model files remain; `connectDB` is not called. Only TS interfaces from a couple of model files are imported. |
| `mongodb` | Transitive | Peer dependency of `mongoose`; no direct imports. |
| `openai@3.x` | Legacy but active | Still used for blog/FAQ/image generation; consider migrating to Vercel AI SDK. |

---

## 7. Environment Variables Referenced (Names Only)

### 7.1 Authentication

| Variable | Representative location(s) |
|---|---|
| `CLERK_SECRET_KEY` | `src/app/api/v2/user/update-phone/route.ts:16` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `src/lib/mock-clerk.tsx:440,505,950`, `src/app/(public)/signup/signupComponent.tsx:140`, `src/app/api/v2/user/google-auth/route.ts:42` |
| `ADMIN_EMAIL` | `src/lib/admin-store.ts:8`, `src/app/api/tour/sign-agreement/route.ts:150,183`, `src/app/api/sign-agreement/[leadId]/route.ts:188` |
| `ADMIN_PASSWORD` | `src/lib/admin-store.ts:9`, `src/app/api/admin/auth/route.ts` |
| `NEXT_PUBLIC_USE_REAL_CLERK` | `next.config.mjs:55,64` |

### 7.2 Application / Server URLs

| Variable | Representative location(s) |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `src/app/api/webhooks/email/route.ts:14`, `src/app/api/v2/webhooks/resend/route.ts:13` |
| `NEXT_PUBLIC_BASE_URL` | `src/app/(public)/blogs/[id]/page.tsx:17-18` |
| `NEXT_PUBLIC_SERVER_URL` | `src/state/api.ts:21`, `src/DAL/FetchProperties.ts:21-23`, `src/lib/email/welcome-email.tsx:29`, `src/app/fetchListings.tsx:47`, `src/app/api/leads/[id]/send-agreement/route.ts:27` |
| `NEXT_PUBLIC_SITE_URL` | `src/lib/leads/client-examples.ts:6`, `src/lib/email/welcome-email.tsx:30` |
| `SITE_URL` | `src/lib/email/welcome-email.tsx:30`, `src/lib/leads/services/property-alerts.tsx:122`, `src/DAL/FetchProperties.ts:36-37` |
| `RAILWAY_PUBLIC_DOMAIN` | `src/DAL/FetchProperties.ts:22-23,37-38` |
| `NODE_ENV` | `src/lib/redis.ts:6`, `src/lib/prisma.ts:53` |
| `NEXT_PUBLIC_ENV` | `src/lib/redis.ts:6`, `src/lib/prisma.ts:9`, `src/hooks/trackUserActivity.ts:45,86` |
| `REACT_APP_SERVER` | `src/components/cards/models/contactModal.tsx:59` (legacy variable, likely stale) |

### 7.3 Databases / Cache

| Variable | Representative location(s) |
|---|---|
| `DATABASE_URL` | `src/lib/prisma.ts:27`, `test_search_logic.js:18`, `debug_dimitri_job.js:19`, `check_property_dates.js:18`, `scratch_check.js:18` |
| `MONGODB_URI` | `src/lib/dbconfig.ts:3` |
| `DB_NAME` | `src/lib/dbconfig.ts:4` |

### 7.4 MLS

| Variable | Representative location(s) |
|---|---|
| `BRIDGE_BASE_URL` | `src/lib/bridge.ts:2`, `src/jobs/verifyActiveProperties.ts:4`, `src/app/api/v2/sync/single/route.ts:6` |
| `BRIDGE_API_KEY` | `src/lib/bridge.ts:3`, `src/app/api/test-db/route.ts:5`, `src/app/api/v2/sync/single/route.ts:9` |
| `BRIDGE_SOURCE` | `src/lib/bridge.ts:4`, `src/jobs/verifyActiveProperties.ts:6`, `src/app/api/v2/sync/single/route.ts:10` |

### 7.5 AI

| Variable | Representative location(s) |
|---|---|
| `OPENAI_API_KEY` | `src/lib/openai.ts:9`, `src/app/api/ai/generate-image/route.ts:7`, `src/app/api/v2/cron/fetch-fb-posts/route.ts:6` |

### 7.6 Email

| Variable | Representative location(s) |
|---|---|
| `RESEND_API_KEY` | `src/lib/email/admin-lead-alert.ts:5-6`, `src/app/api/webhooks/email/route.ts:13`, `src/app/api/v2/webhooks/resend/route.ts:12`, `src/app/api/v2/cron/run-drip/route.ts:10`, `src/app/api/contact/route.ts:135` |
| `RESEND_FROM_EMAIL` | `src/lib/email/welcome-email.tsx:309`, `src/app/api/v2/property-alerts/route.ts:80`, `src/app/api/tour/sign-agreement/route.ts:151` |
| `FROM_EMAIL` | `src/app/api/contact/route.ts:137`, `src/app/api/v2/valuation/route.ts:136` |
| `ADMIN_ALERT_EMAIL` | `src/lib/email/admin-lead-alert.ts:133`, `src/app/api/v2/property-alerts/route.ts:26-28`, `src/app/api/tour/sign-agreement/route.ts:150` |
| `EMAIL_USER` | `src/app/api/tour/sign-agreement/route.ts:171,177,183-184` |
| `EMAIL_PASS` | `src/app/api/tour/sign-agreement/route.ts:171,178` |
| `EMAIL_SERVER_HOST` | `src/app/api/tour/sign-agreement/route.ts:173` |
| `EMAIL_SERVER_PORT` | `src/app/api/tour/sign-agreement/route.ts:174` |
| `EMAIL_FROM` | `src/app/api/tour/sign-agreement/route.ts:183` |
| `TEST_EMAIL` | `src/app/api/v2/property-alerts/route.ts:27` |

### 7.7 SMS

| Variable | Representative location(s) |
|---|---|
| `TWILIO_SID` | `src/lib/twilio.ts:4`, `src/app/api/leads/[id]/send-agreement/route.ts:33`, `src/lib/leads/services/hot-lead-alert.ts:63-69` |
| `TWILIO_TOKEN` | `src/lib/twilio.ts:5`, `src/app/api/leads/[id]/send-agreement/route.ts:34`, `src/lib/leads/services/hot-lead-alert.ts:63-69` |
| `TWILIO_NUMBER` | `src/lib/twilio.ts:9,54`, `src/app/api/v2/cron/run-drip/route.ts:162`, `src/lib/leads/services/hot-lead-alert.ts:79` |
| `ADMIN_ALERT_PHONE` | `src/lib/leads/services/hot-lead-alert.ts:65` |
| `PROPERTY_ALERT_PHONE` | `src/lib/leads/services/returning-visitor.service.ts:55`, `src/lib/leads/services/hot-alert.service.ts:50`, `src/app/api/v2/property-alerts/route.ts:104` |

### 7.8 Cloudinary

| Variable | Representative location(s) |
|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `src/lib/cloudinary.ts:4`, `src/lib/openai.ts:202`, `src/app/api/sign-agreement/[leadId]/route.ts:10` |
| `CLOUDINARY_CLOUD_NAME` | `src/lib/cloudinary.ts:4` |
| `CLOUDINARY_API_KEY` | `src/lib/cloudinary.ts:5`, `src/lib/openai.ts:203`, `src/app/api/sign-agreement/[leadId]/route.ts:11` |
| `CLOUDINARY_API_SECRET` | `src/lib/cloudinary.ts:6`, `src/lib/openai.ts:204`, `src/app/api/signed-cloudinary-params/route.ts:11` |
| `NEXT_PUBLIC_CLOUDINARY_API_KEY` | `src/app/api/sign-agreement/[leadId]/route.ts:11` |

### 7.9 Maps / Location

| Variable | Representative location(s) |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `src/components/property/propertyMap.tsx:36`, `src/components/cards/property/cardCarousel.tsx:40`, `src/app/(public)/Florida-Real-Estate-Search/[[...slug]]/mapComponent.tsx:71`, `src/app/api/v2/ai/chat/route.ts:117,156` |
| `NEXT_PUBLIC_WALK_SCORE_API` | `src/components/property/fetchwalkscore.ts:16` |

### 7.10 Facebook

| Variable | Representative location(s) |
|---|---|
| `FACEBOOK_PAGE_ID` | `src/components/blogs/blogSection.tsx:23`, `src/app/api/v2/cron/fetch-fb-posts/route.ts:21` |
| `FACEBOOK_ACCESS_TOKEN` | `src/components/blogs/blogSection.tsx:24`, `src/app/api/v2/cron/fetch-fb-posts/route.ts:22` |

### 7.11 Cron / Admin Secrets

| Variable | Representative location(s) |
|---|---|
| `CRON_SECRET` | `src/app/api/v2/cron/sync-properties/route.ts:19`, `src/app/api/v2/cron/send-daily-alerts/route.ts:18`, `src/app/api/v2/cron/fetch-fb-posts/route.ts:17`, `src/app/api/admin/cron/generate-blog/route.ts:5`, `src/app/api/admin/cron/generate-faq/route.ts:5` |
| `PROPERTY_ALERTS_API_SECRET` | `src/app/api/v2/property-alerts/route.ts:10` |

### 7.12 Property Alert Envelope

| Variable | Representative location(s) |
|---|---|
| `PROPERTY_ALERT_TO` | `src/app/api/v2/property-alerts/route.ts:26` |
| `PROPERTY_ALERT_FROM` | `src/app/api/v2/property-alerts/route.ts:79` |
| `PROPERTY_ALERT_REPLY_TO` | `src/app/api/v2/property-alerts/route.ts:81` |
| `PROPERTY_ALERT_TITLE` | `src/app/api/v2/property-alerts/route.ts:85` |
| `PROPERTY_ALERT_SUBTITLE` | `src/app/api/v2/property-alerts/route.ts:89` |
| `PROPERTY_ALERT_RECIPIENT_NAME` | `src/app/api/v2/property-alerts/route.ts:75` |

### 7.13 Internal / Generated

`DEBUG`, `PRISMA_DISABLE_WARNINGS`, `NO_COLOR`, `PRISMA_CLIENT_GET_TIME`, `TEST_CLIENT_ENGINE_REMOTE_EXECUTOR`, `_CLUSTER_NETWORK_NAME_`, `COMPUTERNAME` — these are referenced only inside generated Prisma runtime files and are not project secrets.

---

## 8. External Domains / Network Dependencies

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
| `hazards.fema.gov` / `msc.fema.gov` | FEMA flood map exports |
| `oauth2.googleapis.com`, `www.googleapis.com/oauth2/v3/userinfo` | Google OAuth tokeninfo / userinfo |
| `accounts.google.com/gsi/client` | Google Identity Services script |
| `cdn.onesignal.com` | OneSignal web SDK |
| `www.googletagmanager.com` | Google Analytics 4 script |
| `res.cloudinary.com`, `*.cloudinary.com` | Cloudinary CDN images |
| `dvvjkgh94f2v6.cloudfront.net` | MLS media CDN (from Bridge data) |
| `images.unsplash.com` | Unsplash placeholder images |
| `gulfshore-fullcode-next-production.up.railway.app` | Production deployment target hit by GitHub Actions cron |

**Next.js `images.remotePatterns`** (`next.config.mjs:16-47`): `res.cloudinary.com`, `*.cloudinary.com`, `maps.googleapis.com`, `gulfshoregroup.com`, `dvvjkgh94f2v6.cloudfront.net`, `images.unsplash.com`.

---

## 9. Webhook / Cron Endpoints

| Endpoint | External Caller | Purpose |
|---|---|---|
| `POST /api/v2/lead-capture` | Clerk | `verifyWebhook` — creates/updates lead |
| `POST /api/webhooks/twilio/incoming` | Twilio | Inbound SMS → AI reply |
| `POST /api/v2/webhooks/twilio` | Twilio | Alternate SMS webhook |
| `POST /api/webhooks/twilio/events` | Twilio | Message status callbacks |
| `POST /api/webhooks/email` | Resend | Email reply parser / AI matcher |
| `POST /api/v2/webhooks/resend` | Resend | Resend webhook duplicate |
| `POST /api/webhooks/resend/events` | Resend | Email event status callbacks |
| `GET /api/v2/cron/sync-properties` | GitHub Actions / Cron | Property sync |
| `GET /api/v2/cron/run-drip` | GitHub Actions / Cron | Drip campaign run |
| `GET /api/v2/cron/send-daily-alerts` | Cron | Saved-search alerts |
| `GET /api/v2/cron/verify-active` | Cron | Active-listing verification |
| `GET /api/v2/cron/fetch-fb-posts` | Cron | Facebook → blog import |
| `GET /api/admin/cron/generate-blog` | Cron | AI blog generation |
| `GET /api/admin/cron/generate-faq` | Cron | AI FAQ generation |

GitHub Actions workflow `.github/workflows/cron.yml` triggers the sync and drip cron jobs hourly.

---

## 10. Security & Hygiene Observations (No Values Exposed)

Multiple locations in the codebase contain hardcoded credentials, fallback secrets, or plaintext configuration. Values are intentionally omitted below; only file locations are given:

1. **Redis credentials** are hardcoded in `src/lib/redis.ts` (host, port, password at lines ~10–14).
2. **MySQL connection strings** with embedded credentials are hardcoded in root debug/migration scripts (`check.js`, `check_mediterra.js`, `compare_db.js`, `sync_missing_properties.js`, `debug_dimitri_job.js`, `check_property_dates.js`, `scratch_check.js`, `test_db.js`) and in `src/app/api/admin/sync-missing/route.ts:5-6`.
3. **Bridge API key fallback** is hardcoded in `src/app/api/v2/sync/single/route.ts:8-9` and `src/app/api/test-db/route.ts:5`.
4. **Admin credentials** are stored in plaintext in `src/data/admin-credentials.json`, with additional hardcoded fallback defaults in `src/lib/admin-store.ts:26`.
5. **Twilio WhatsApp configuration** includes hardcoded `contentSid` / `messagingServiceSid` in `src/lib/twilio.ts:58-59`.
6. **OneSignal app ID / safari web ID** and **Google Analytics measurement ID** are hardcoded in `src/app/layout.tsx:131-132,141,149` and `src/components/global/pushNotification.tsx:14-16` (public client IDs, but confirm live services).
7. **`DEPLOY.md`** contains documented example configuration values, including API keys and cloud names.
8. **Debug/test scripts** manually parse `.env` line-by-line, duplicating `dotenv` behavior and increasing risk of leaking values to logs.
9. **Webhook routes** for Twilio/Resend do not appear to verify sender signatures; some cron routes rely on a simple `CRON_SECRET` bearer check.
10. **Mock Clerk by default:** `next.config.mjs:55-69` aliases `@clerk/nextjs` to custom mock implementations unless `NEXT_PUBLIC_USE_REAL_CLERK="true"`, making `CLERK_SECRET_KEY` dormant in the default configuration.
11. **CORS middleware** (`src/middleware.ts:1-32`) allows `*` origin and credentials for all `/api` routes.

---

## 11. Recommendations

1. **Move all secrets out of source.** Replace hardcoded Redis, MySQL, Bridge, Twilio, and admin credentials with required environment variables.
2. **Add `.env.example`** listing every required/optional variable (names only, no values).
3. **Remove or secure fallback admin credentials** in `src/lib/admin-store.ts` and `src/data/admin-credentials.json`.
4. **Verify signature validation** on Twilio and Resend webhook endpoints.
5. **Remove unused packages** (`@pinecone-database/pinecone`, `@prisma/adapter-pg`, `@prisma/extension-accelerate`, `handlebars`, `next-sitemap`, `react-email` CLI, `schema-dts`, `react-is`, `@hookform/resolvers` if truly unused, `@next/bundle-analyzer` if unused).
6. **Decide on Mongoose/MongoDB.** If the migration to Prisma/MySQL is complete, remove `mongoose`, `mongodb`, `src/lib/dbconfig.ts`, and `src/models/*.ts`.
7. **Standardize URL variables.** Consolidate `NEXT_PUBLIC_SERVER_URL`, `SITE_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_SITE_URL`, `RAILWAY_PUBLIC_DOMAIN`.
8. **Migrate legacy OpenAI SDK** (`openai@3.x`) callers to the Vercel AI SDK to reduce API surface.
9. **Review `DEPLOY.md`** and remove any committed example secrets; replace with placeholder instructions.
10. **Delete or move root debug scripts** with hardcoded DB credentials out of the repository.

---

*This audit is based on a read-only scan of the repository. No files were modified during the audit.*
