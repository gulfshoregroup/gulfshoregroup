# Listing page — rebuilt code (Listing Page Fix List)

Paths mirror a Next.js App Router project. Copy into the site, keeping the `@/` import alias.

| File | Fixes |
|---|---|
| `lib/seo/listing.ts` | #1 real meta description, #2 real schema with price, #3 title, #6 noindex when sold, #10 photo alt text |
| `app/Florida-Real-Estate-Listings/[...slug]/page.tsx` | the new page: cached 10 min (#7), focused template (#8), no sign-up wall (#11), all new sections |
| `app/Florida-Real-Estate-Listings/[...slug]/not-found.tsx` | #4 real 404 page |
| `middleware.ts` | #5 wrong URLs → 301 to the one correct URL (needs Next.js 15.5+) |
| `lib/listings/data.ts` | data access + similar-homes rules — **connect `databaseSource` to your database** (example SQL inside) |
| `lib/listings/sample-data.ts` | made-up test data, used only with `USE_SAMPLE_LISTINGS=1` |
| `lib/images.ts` | Cloudinary AVIF/WebP resizing for listing photos |
| `components/listing/*` | Breadcrumbs, ListingHeader, ListingCta (showing / call / email), KeyFacts, PaymentEstimate, Photos, Location, SimilarHomes, styles for 60+ |
| `scripts/site-audit.mjs` | checks home, city and listing pages |

## Before going live
1. **Data:** fill in `databaseSource` in `lib/listings/data.ts` and map your field names onto the `Listing` type in `lib/seo/listing.ts`.
2. **URLs:** `listingPath()` must produce exactly the URLs the site uses today, or every listing will redirect. Compare a few against the sitemap; if they differ, call your existing URL builder inside `listingPath()`.
3. **Settings calls:** use the `SettingsProvider` from `map-search/settings-provider.tsx` so the page stops calling `/api/admin/general-settings` 16 times (#9).
4. **Caching:** don't read `cookies()` or `headers()` in this page or its layout, or Next.js makes it uncached again.
5. **Middleware:** if the city-page `middleware.ts` is also used, merge them into one file (run the city check, then `listingRedirect`).
6. **Cloudinary:** add the MLS photo domain to "Allowed fetch domains".
7. **Showing button:** points to `/contact?topic=showing&listing=ID` — change it if the contact form lives elsewhere.
8. **Sign-up wall:** remove the existing "Join Gulfshore Group to unlock…" component. If MLS rules require it, gate only price history.

## Test
```
node scripts/site-audit.mjs https://staging.gulfshoregroup.com
```
Tested here with sample data on Next.js 15.5: build and type check succeed, and the audit reports **57 passed, 0 failed** on 3 listings (active, active multi-unit, sold), including a clean 301 for wrong URLs and a real 404 for unknown MLS numbers. It still needs testing on staging with the real database.
