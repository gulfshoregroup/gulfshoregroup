# Gulfshore Group - Application Architecture & Data Flow Guide

This document provides a detailed overview of the system architecture, frontend-to-backend data flows, and database connections implemented in this project.

---

## 🏗️ 1. Architecture Overview

The application is built on the **Next.js App Router** framework:
- **Frontend State Management:** Redux Toolkit manages search state, listings, and filters.
- **ORM / Database Access:** Prisma client interacts with the MySQL database hosted on Railway.
- **Map Render:** Keyless Leaflet (OpenStreetMap) embedded seamlessly for listing results and property location views.

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Client (UI)                  │
│  [Search Bar]  [Map / List View]  [Admin Panel Settings] │
└────────────────────────────┬────────────────────────────┘
                             │ (API Actions via Redux / Axios)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Next.js API Routes                   │
│   /api/v2/properties     /api/admin/notification-settings│
│   /api/track/campaign    /api/admin/automation          │
└────────────────────────────┬────────────────────────────┘
                             │ (Prisma Client Queries)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                     MySQL Database                      │
│   [properties]   [campaignclick]   [useralert]   [lead] │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 2. Real Estate Search & Filters Flow

How listings are filtered and fetched when the user searches:

### Flow steps:
1. **User interaction:** The user opens the filter modal and selects criteria (e.g., City: *Naples*, Status: *Sold*, HOA: *Yes*, Acres: *1-5*, features: *Waterfront*).
2. **URL Update:** The filters are normalized into query params and set in the URL address bar:
   `?status=Sold&hoa=Yes&minAcres=1&maxAcres=5&features=Waterfront`
3. **API Dispatch:** Redux triggers `fetchPropertiesApi()` targeting `/api/v2/properties` with all query parameters.
4. **Backend Mapping (`/api/v2/properties/route.ts`):**
   - The query keys are parsed and mapped to the Prisma query builder structure:
     - `status=Sold` ➔ `where.StandardStatus = { in: ["Closed", "Sold"] }`
     - `hoa=Yes` ➔ `where.MandatoryHOAYN = true`
     - `minAcres=1` ➔ `where.LotSizeAcres = { gte: 1 }`
     - `features=Waterfront` ➔ `where.WaterfrontYN = true`
5. **Database Query:** Prisma translates the query into SQL and executes it on the `properties` table.
6. **Result Render:** Active or Sold listings are returned to the client and rendered instantly on the map and property cards.

---

## 📈 3. Social Media Campaign (UTM) Tracking Flow

How social media campaign clicks (Facebook, Instagram, LinkedIn, etc.) are captured without placeholders:

### Flow steps:
1. **Traffic Arrival:** A user clicks a link from a campaign containing UTM source query keys:
   `https://gulfshoregroup.com/Florida-Real-Estate-Search?utm_source=facebook`
2. **Client-side Capture (`utmTracker.tsx`):** A client component runs globally on page load, detects the presence of `utm_source` or `ref`, and extracts the path.
3. **API Logging (`POST /api/track/campaign`):** Send a request containing the source name and page path.
4. **Database Insertion:**
   - Appends a record to the `campaignclick` table in MySQL.
5. **Dashboard Refresh (`/admin/performance`):**
   - Query `/api/admin/performance` reads from `campaignclick` using Prisma group-by queries to show clicks count and pie chart shares in real-time.

---

## ⚙️ 4. Background Service Automation Monitoring Flow

How background services (MLS sync, notifications alerts) are monitored in real-time:

### Flow steps:
1. **Admin Navigation:** The administrator visits `/admin/automation`.
2. **Dashboard Query (`GET /api/admin/automation`):**
   - The route reads the latest sync timestamps and executes real-time database counts:
     - **Properties Sync:** `prisma.property.count()`
     - **Saved Search Alerts:** `prisma.savedSearch.count()`
     - **Lead Interactions:** `prisma.lead.count()`
3. **Execution Simulator (`POST /api/admin/automation`):** Clicking **Run Now** triggers a simulation script on the server that emulates the cron jobs and updates timestamps dynamically.

---

## 🔔 5. Admin Settings Notification Preferences Flow

How notification preferences are saved and synced:

### Flow steps:
1. **User Settings (`/admin/settings`):** Toggles like "Push Notifications" and "Email Alerts" are changed by the user.
2. **Database Save (`POST /api/admin/notification-settings`):**
   - Toggles trigger an API request sending `{ pushEnabled, emailEnabled }`.
   - The backend looks up the logged-in admin email from the cookie session.
   - It performs an `upsert` query on the `useralert` table mapping to the admin's lead record.
3. **Auto Loading:** On mounting the settings page, the frontend fetches current state settings using `GET /api/admin/notification-settings` to display correct toggle states.

---

## 🔑 6. Custom Credentials Auth Flow

How secure custom login changes are handled for administrator access:

### Flow steps:
1. **Input:** Admin enters current password, new email, and optional new password under the settings tab.
2. **Verification (`POST /api/admin/auth`):**
   - The server verifies the current hashed password matches what's stored on the admin's lead profile.
   - Salt and hash the new password using Node's crypto utilities (`pbkdf2`).
3. **Database Update:** Modifies the admin's credentials record in the database.
4. **Cookie update:** Refreshes credentials cookies safely.
