# Gulfshore Group — code snippets

All code from the four fix-list docs, as separate files for the developer.
Values in [BRACKETS] are placeholders to fill in.

## home-page/  (Home Page Fix List)
- blog-card-image.tsx — #4 stop preloading blog photos
- hero-image.tsx — #6 correct hero `sizes`
- next.config.images.js — AVIF/WebP + image cache
- schema-organization.json — #15 RealEstateAgent + WebSite JSON-LD
- public/llms.txt — #16 AI-search site summary (goes in /public)
- senior-friendly.css — design for buyers 60+

## city-pages/  (Naples City Page Fix List)
- generateMetadata.ts — Fix 1/2 unique titles + self canonical
- middleware.ts — Fix 1 301 redirect for /NAPLES, /naples
- isr-static-params.ts — Fix 3 cache city pages (ISR, 5 min)
- schema-collection-page.json — Fix 5 CollectionPage + Breadcrumb

## map-search/  (Fast Map Search Fix Plan)
- settings-provider.tsx — 1a load general-settings once
- update-url-without-reload.ts — 1c no server round trip per pan
- map-idle-debounce.ts — 1f debounce + cancel
- map-pins-response.example.json / map-clusters-response.example.json — new API format
- map-pins-queries.sql — index, pins and cluster queries

## listing-page/  (Listing Page Fix List)
Rebuilt from the fix list (the original zip wasn't saved). Full Next.js code for the
listing detail page, middleware for 301s, data layer, components and the site-audit script.
See listing-page/README.md for setup steps. Tested with sample data: 57 checks passed, 0 failed.
