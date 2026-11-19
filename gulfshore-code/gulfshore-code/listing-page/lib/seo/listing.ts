// lib/seo/listing.ts
// Listing page fixes 1–3, 6 and 10: real meta description, title, schema, noindex for
// off-market homes, and descriptive photo alt text — all built from the actual listing record.
import type { Metadata } from 'next';
import { cloudinaryUrl } from '../images';

export const SITE = 'https://gulfshoregroup.com';
export const PHONE_DISPLAY = '239-992-9119';
export const PHONE_TEL = '+12399929119';
export const EMAIL = 'mailbox@gulfshoregroup.com';

/** Field names follow the RESO standard used by most MLS feeds. Map your own fields onto this once. */
export interface Listing {
  ListingId: string;
  UnparsedAddress?: string | null;
  StreetNumber?: string | null;
  StreetName?: string | null;
  StreetSuffix?: string | null;
  UnitNumber?: string | null;
  City: string;
  StateOrProvince?: string | null;
  PostalCode?: string | null;
  SubdivisionName?: string | null;
  ListPrice?: number | string | null;
  BedroomsTotal?: number | string | null;
  BathroomsTotalInteger?: number | string | null;
  LivingArea?: number | string | null;
  LotSizeAcres?: number | string | null;
  YearBuilt?: number | string | null;
  PropertyType?: string | null;      // e.g. Residential, Residential Income, Land
  PropertySubType?: string | null;   // e.g. Single Family Residence, Condominium, Quadruplex
  PublicRemarks?: string | null;
  Latitude?: number | string | null;
  Longitude?: number | string | null;
  Photos?: string[] | null;
  StandardStatus?: string | null;    // Active, Pending, Closed, Withdrawn, Expired…
  DaysOnMarket?: number | string | null;
  AssociationFee?: number | string | null;
  AssociationFeeFrequency?: string | null;
  TaxAnnualAmount?: number | string | null;
  ListOfficeName?: string | null;
  ListingContractDate?: string | null;
  ModificationTimestamp?: string | null;
}

// ---------- safe value helpers (this is what stops "undefined" and "NaN") ----------

/** Returns a positive finite number, or null. Never NaN. */
export function num(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Latitude/longitude (longitude is negative in Florida). Returns null if missing or 0. */
export function coord(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

const DIRECTIONS =new Set(['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW']);

/** "286 INDIES DR E 202" -> "286 Indies Dr E 202" */
export function tidyWords(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((w) => {
      const up = w.toUpperCase();
      if (DIRECTIONS.has(up) || /\d/.test(w) || w.startsWith('#')) return up;
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

export function streetLine(l: Listing): string {
  const raw =
    [l.StreetNumber, l.StreetName, l.StreetSuffix, l.UnitNumber].filter(Boolean).join(' ') ||
    (l.UnparsedAddress ?? '').split(',')[0];
  return tidyWords(raw || 'Address on request');
}

export function cityName(l: Listing): string {
  return tidyWords(l.City || 'Naples');
}

export function state(l: Listing): string {
  return (l.StateOrProvince || 'FL').toUpperCase();
}

export function fullAddress(l: Listing): string {
  return `${streetLine(l)}, ${cityName(l)}, ${state(l)}${l.PostalCode ? ' ' + l.PostalCode : ''}`;
}

export function community(l: Listing): string | null {
  const s = l.SubdivisionName?.trim();
  return s && !/^others?$/i.test(s) && !/^none$/i.test(s) ? tidyWords(s) : null;
}

export function isActive(l: Listing): boolean {
  return /^(active|coming soon)/i.test(l.StandardStatus ?? 'Active');
}

export function isLand(l: Listing): boolean {
  return /land|lot/i.test(`${l.PropertyType} ${l.PropertySubType}`);
}

/** Plain-English type for titles and cards: "Home", "Condo", "4-Unit Building", "Lot"… */
export function typeLabel(l: Listing): string {
  const t = `${l.PropertySubType ?? ''} ${l.PropertyType ?? ''}`.toLowerCase();
  if (isLand(l)) return 'Lot';
  if (t.includes('quadruplex')) return '4-Unit Building';
  if (t.includes('triplex')) return '3-Unit Building';
  if (t.includes('duplex')) return 'Duplex';
  if (t.includes('condo')) return 'Condo';
  if (t.includes('townh')) return 'Townhouse';
  if (t.includes('villa')) return 'Villa';
  if (t.includes('mobile') || t.includes('manufactured')) return 'Manufactured Home';
  return 'Home';
}

export const fmtMoney = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
export const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');

/** 1695000 -> "$1.7M", 689000 -> "$689K" */
export function priceShort(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return '$' + (m >= 10 ? Math.round(m) : Number(m.toFixed(1))) + 'M';
  }
  return '$' + Math.round(n / 1000) + 'K';
}

/** "12 bedrooms · 8 bathrooms · 6,092 sq ft" — words, not icons, for older readers. */
export function factsLine(l: Listing): string {
  const beds = num(l.BedroomsTotal);
  const baths = num(l.BathroomsTotalInteger);
  const sqft = num(l.LivingArea);
  const acres = num(l.LotSizeAcres);
  const parts: string[] = [];
  if (beds) parts.push(`${beds} bedroom${beds === 1 ? '' : 's'}`);
  if (baths) parts.push(`${baths} bathroom${baths === 1 ? '' : 's'}`);
  if (sqft) parts.push(`${fmtInt(sqft)} sq ft`);
  if (!sqft && acres) parts.push(`${acres} acre${acres === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

// ---------- URLs ----------

const seg = (s: string) =>
  s.trim().replace(/[#,.'’]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * The one correct URL for a listing. It MUST produce the same URLs the site uses today
 * (e.g. /Florida-Real-Estate-Listings/Naples/Moorings/3100-Gulf-Shore-BLVD-N-504/226041802),
 * otherwise every listing would redirect. If your current URL builder differs, call it here instead.
 */
export function listingPath(l: Listing): string {
  const street =
    [l.StreetNumber, l.StreetName, l.StreetSuffix, l.UnitNumber].filter(Boolean).join(' ') ||
    (l.UnparsedAddress ?? '').split(',')[0];
  return [
    '/Florida-Real-Estate-Listings',
    seg(l.City),
    seg(l.SubdivisionName || 'Others'),
    seg(street),
    encodeURIComponent(l.ListingId),
  ].join('/');
}

export const listingUrl = (l: Listing) => SITE + listingPath(l);
export const cityPath = (l: Listing) => `/Florida-Real-Estate-Search/${seg(cityName(l))}`;

// ---------- meta tags ----------

/** "286 Indies Dr E 202, Naples, FL – $1.7M · 12 Bed 4-Unit Building" */
export function listingTitle(l: Listing): string {
  const price = num(l.ListPrice);
  const beds = num(l.BedroomsTotal);
  const what = isLand(l) ? 'Lot' : `${beds ? beds + ' Bed ' : ''}${typeLabel(l)}`;
  const tail = [price ? priceShort(price) : null, what].filter(Boolean).join(' · ');
  return `${streetLine(l)}, ${cityName(l)}, ${state(l)} – ${tail}`;
}

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:.\-–—\s]+$/, '') + '…';
}

/** "Home for sale at 286 Indies Dr E 202, Naples, FL — 12 bedrooms, 8 bathrooms, 6,092 sq ft in Antilles. AN INVESTOR'S DREAM…" */
export function listingDescription(l: Listing): string {
  const facts = factsLine(l).replace(/ · /g, ', ');
  const comm = community(l);
  const lead = `${isActive(l) ? (isLand(l) ? 'Lot' : 'Home') + ' for sale' : 'Former listing'} at ${streetLine(
    l
  )}, ${cityName(l)}, ${state(l)}${facts ? ' — ' + facts : ''}${comm ? ' in ' + comm : ''}.`;
  const remarks = (l.PublicRemarks ?? '').replace(/\s+/g, ' ').trim();
  return clip(remarks ? `${lead} ${remarks}` : lead, 160);
}

export function photoAlt(l: Listing, i: number, total: number): string {
  return `${streetLine(l)}, ${cityName(l)}, ${state(l)} – ${typeLabel(l).toLowerCase()}${
    isActive(l) ? ' for sale' : ''
  }, photo ${i + 1} of ${total}`;
}

export function listingMetadata(l: Listing): Metadata {
  const url = listingUrl(l);
  const title = listingTitle(l);
  const description = listingDescription(l);
  const photo = l.Photos?.[0];
  const ogImage = photo
    ? { url: cloudinaryUrl(photo, 1200, { height: 630, crop: 'fill' }), width: 1200, height: 630, alt: photoAlt(l, 0, l.Photos!.length) }
    : { url: `${SITE}/og-home.jpg`, width: 1200, height: 630, alt: 'Gulfshore Group' };
  return {
    // `absolute` so a layout title template doesn't add a second "| Gulfshore Group"
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    // Sold / withdrawn homes stay up for visitors, but Google drops them.
    robots: isActive(l) ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { type: 'website', url, title, description, siteName: 'Gulfshore Group', images: [ogImage] },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage.url] },
  };
}

// ---------- structured data ----------

function residenceType(l: Listing): string {
  const t = typeLabel(l);
  if (t === 'Lot') return 'Place';
  if (t === 'Condo') return 'Apartment';
  if (t === 'Home' || t === 'Villa') return 'SingleFamilyResidence';
  return 'House';
}

function availability(l: Listing): string {
  const s = (l.StandardStatus ?? 'Active').toLowerCase();
  if (s.startsWith('active') && s.includes('contract')) return 'https://schema.org/LimitedAvailability';
  if (s.startsWith('active') || s.startsWith('coming')) return 'https://schema.org/InStock';
  if (s.startsWith('pending')) return 'https://schema.org/LimitedAvailability';
  return 'https://schema.org/SoldOut';
}

export function listingSchema(l: Listing) {
  const url = listingUrl(l);
  const price = num(l.ListPrice);
  const lat = coord(l.Latitude);
  const lng = coord(l.Longitude);
  const beds = num(l.BedroomsTotal);
  const baths = num(l.BathroomsTotalInteger);
  const sqft = num(l.LivingArea);
  const year = num(l.YearBuilt);
  const comm = community(l);

  const place: Record<string, unknown> = {
    '@type': residenceType(l),
    name: fullAddress(l),
    address: {
      '@type': 'PostalAddress',
      streetAddress: streetLine(l),
      addressLocality: cityName(l),
      addressRegion: state(l),
      ...(l.PostalCode ? { postalCode: l.PostalCode } : {}),
      addressCountry: 'US',
    },
    ...(lat !== null && lng !== null ? { geo: { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } } : {}),
    ...(beds ? { numberOfBedrooms: beds } : {}),
    ...(baths ? { numberOfBathroomsTotal: baths } : {}),
    ...(sqft ? { floorSize: { '@type': 'QuantitativeValue', value: sqft, unitCode: 'FTK' } } : {}),
    ...(year ? { yearBuilt: year } : {}),
    ...(comm ? { containedInPlace: { '@type': 'Place', name: `${comm}, ${cityName(l)}` } } : {}),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'RealEstateListing',
        '@id': `${url}#listing`,
        url,
        name: `${typeLabel(l)} for sale: ${fullAddress(l)}`,
        description: (l.PublicRemarks ?? listingDescription(l)).trim(),
        ...(l.ListingContractDate ? { datePosted: l.ListingContractDate } : {}),
        ...(l.ModificationTimestamp ? { dateModified: l.ModificationTimestamp } : {}),
        image: (l.Photos ?? []).slice(0, 10).map((p) => cloudinaryUrl(p, 1200)),
        mainEntity: place,
        ...(price
          ? {
              offers: {
                '@type': 'Offer',
                price,
                priceCurrency: 'USD',
                availability: availability(l),
                url,
                offeredBy: { '@id': `${SITE}/#org` },
              },
            }
          : {}),
        provider: { '@id': `${SITE}/#org` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: cityName(l), item: SITE + cityPath(l) },
          { '@type': 'ListItem', position: 3, name: streetLine(l), item: url },
        ],
      },
    ],
  };
}
