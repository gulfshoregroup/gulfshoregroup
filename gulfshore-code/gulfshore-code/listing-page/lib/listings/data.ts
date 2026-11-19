// lib/listings/data.ts
// Data access for the listing page. Connect `databaseSource` to your real listings store
// (the same one behind /api/v2/properties). Set USE_SAMPLE_LISTINGS=1 to run with sample data.
import { cache } from 'react';
import { num, type Listing } from '../seo/listing';
import { SAMPLE_LISTINGS } from './sample-data';

export interface ListingSource {
  byId(id: string): Promise<Listing | null>;
  /** Active listings in the same city and same broad type, price within ±30%. Up to ~50 rows. */
  candidatesForSimilar(l: Listing): Promise<Listing[]>;
}

/*
 * Example SQL for databaseSource (Postgres; adapt names to your schema).
 * Only select the columns the page needs — never send all 109 fields.
 *
 * byId:
 *   SELECT * FROM listings WHERE "ListingId" = $1 LIMIT 1;
 *
 * candidatesForSimilar:
 *   SELECT "ListingId","StreetNumber","StreetName","StreetSuffix","UnitNumber","City","StateOrProvince",
 *          "PostalCode","SubdivisionName","ListPrice","BedroomsTotal","BathroomsTotalInteger","LivingArea",
 *          "PropertyType","PropertySubType","StandardStatus",
 *          ("Photos")[1:1] AS "Photos"
 *   FROM listings
 *   WHERE "StandardStatus" = 'Active'
 *     AND "City" = $city
 *     AND "PropertyType" = $propertyType
 *     AND "ListPrice" BETWEEN $price * 0.7 AND $price * 1.3
 *     AND "ListingId" <> $id
 *   ORDER BY ("SubdivisionName" = $subdivision) DESC, abs("ListPrice" - $price)
 *   LIMIT 50;
 */
const databaseSource: ListingSource = {
  async byId() {
    throw new Error('lib/listings/data.ts: connect databaseSource.byId to your listings database');
  },
  async candidatesForSimilar() {
    throw new Error('lib/listings/data.ts: connect databaseSource.candidatesForSimilar to your listings database');
  },
};

const sampleSource: ListingSource = {
  async byId(id) {
    return SAMPLE_LISTINGS.find((l) => l.ListingId === id) ?? null;
  },
  async candidatesForSimilar(l) {
    const p = num(l.ListPrice) ?? 0;
    return SAMPLE_LISTINGS.filter(
      (c) =>
        c.ListingId !== l.ListingId &&
        /^active/i.test(c.StandardStatus ?? '') &&
        c.City === l.City &&
        c.PropertyType === l.PropertyType &&
        (!p || Math.abs((num(c.ListPrice) ?? 0) - p) <= p * 0.3)
    );
  },
};

const source: ListingSource = process.env.USE_SAMPLE_LISTINGS === '1' ? sampleSource : databaseSource;

/** Cached per request, so generateMetadata and the page share one lookup. */
export const getListingById = cache(async (id: string) => source.byId(id));

/**
 * Small in-memory lookup for middleware.ts: listing ID -> correct path (or null if not found).
 * Kept for 10 minutes per server so redirect checks rarely touch the database.
 */
const pathCache = new Map<string, { path: string | null; at: number }>();
export async function correctPathFor(id: string, build: (l: Listing) => string): Promise<string | null> {
  const hit = pathCache.get(id);
  if (hit && Date.now() - hit.at < 600_000) return hit.path;
  const l = await source.byId(id);
  const path = l ? build(l) : null;
  if (pathCache.size > 20_000) pathCache.clear();
  pathCache.set(id, { path, at: Date.now() });
  return path;
}

/**
 * Similar homes: same type, same community first, within ±30% of the price, closest price next.
 * (Today the site shows the 5 most expensive "Homes" in the city, even under a condo.)
 */
export async function getSimilarListings(l: Listing, limit = 6): Promise<Listing[]> {
  const price = num(l.ListPrice) ?? 0;
  const sub = (l.SubdivisionName ?? '').toLowerCase();
  const sameSubType = (c: Listing) => (c.PropertySubType ?? '') === (l.PropertySubType ?? '');
  const rows = await source.candidatesForSimilar(l);
  return rows
    .filter((c) => c.ListingId !== l.ListingId)
    .sort((a, b) => {
      const sa = Number((a.SubdivisionName ?? '').toLowerCase() === sub && !!sub);
      const sb = Number((b.SubdivisionName ?? '').toLowerCase() === sub && !!sub);
      if (sa !== sb) return sb - sa;
      const ta = Number(sameSubType(a));
      const tb = Number(sameSubType(b));
      if (ta !== tb) return tb - ta;
      return Math.abs((num(a.ListPrice) ?? 0) - price) - Math.abs((num(b.ListPrice) ?? 0) - price);
    })
    .slice(0, limit);
}
