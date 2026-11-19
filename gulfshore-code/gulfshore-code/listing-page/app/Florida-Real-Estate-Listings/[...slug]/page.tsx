// app/Florida-Real-Estate-Listings/[...slug]/page.tsx
// URL: /Florida-Real-Estate-Listings/{City}/{Community}/{Address}/{MLS#}
//
// Fixes: real title/description/schema (1–3), real 404 (4), 301 for wrong URLs (5),
// noindex for sold homes (6), cached page (7), focused template (8), photos (10),
// no sign-up wall (11), showing request / monthly cost / similar homes / key facts.
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getListingById, getSimilarListings } from '@/lib/listings/data';
import {
  cityName, cityPath, isActive, listingMetadata, listingPath, listingSchema, num, type Listing,
} from '@/lib/seo/listing';
import { Breadcrumbs } from '@/components/listing/Breadcrumbs';
import { ListingHeader } from '@/components/listing/ListingHeader';
import { ListingCta } from '@/components/listing/ListingCta';
import { KeyFacts, hoaMonthly } from '@/components/listing/KeyFacts';
import { PaymentEstimate } from '@/components/listing/PaymentEstimate';
import { HeroPhoto, AllPhotos } from '@/components/listing/Photos';
import { Location } from '@/components/listing/Location';
import { SimilarHomes } from '@/components/listing/SimilarHomes';
import s from '@/components/listing/listing.module.css';

// Cache each listing page and rebuild it at most every 10 minutes (was: no-store, built on every visit).
// Do not read cookies() or headers() in this page or its layout, or Next.js will make it dynamic again.
export const revalidate = 600;
export const dynamicParams = true;
export async function generateStaticParams() {
  return []; // build each listing on its first visit, then serve it from cache
}

type Props = { params: Promise<{ slug: string[] }> };

const MLS_ID = /^[A-Za-z0-9-]{4,20}$/;

async function load(slug: string[] | undefined): Promise<Listing | null> {
  const id = slug?.at(-1);
  if (!id || !MLS_ID.test(id)) return null;
  return getListingById(id);
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const listing = await load(slug);
  if (!listing) return { title: 'Home not found', robots: { index: false, follow: true } };
  return listingMetadata(listing);
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await load(slug);
  if (!listing) notFound(); // real HTTP 404 (was a 200 "Property Not Found" page)

  // One URL per listing. middleware.ts already 301-redirects wrong URLs to the correct one;
  // this is a safety net so a wrong URL can never be cached as a duplicate page.
  const correct = listingPath(listing);
  const requested = '/Florida-Real-Estate-Listings/' + slug.map((p) => encodeURIComponent(decodeURIComponent(p))).join('/');
  if (requested !== correct) notFound();

  const active = isActive(listing);
  const price = num(listing.ListPrice);
  const similar = await getSimilarListings(listing);

  return (
    <main className={s.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema(listing)).replace(/</g, '\\u003c') }}
      />
      <Breadcrumbs listing={listing} />

      {!active && (
        <section className={s.status} style={{ display: 'block', marginBottom: 16 }}>
          <strong>This home is no longer for sale.</strong>{' '}
          <a href="#similar">See similar homes</a> or{' '}
          <Link href={cityPath(listing)}>browse all {cityName(listing)} homes for sale</Link>.
        </section>
      )}

      <div className={s.hero}>
        <HeroPhoto listing={listing} />
        <div>
          <ListingHeader listing={listing} />
          {active && <ListingCta listing={listing} />}
        </div>
      </div>

      <section aria-labelledby="about">
        <h2 id="about">About this home</h2>
        {/* Full description, no "Read More" — it is the most unique text on the page */}
        <p className={s.description}>{listing.PublicRemarks}</p>
      </section>

      <section aria-labelledby="facts">
        <h2 id="facts">Key facts</h2>
        <KeyFacts listing={listing} />
      </section>

      {active && price && (
        <section aria-labelledby="cost">
          <h2 id="cost">Estimated monthly cost</h2>
          <PaymentEstimate price={price} annualTaxes={num(listing.TaxAnnualAmount)} monthlyHoa={hoaMonthly(listing)} />
        </section>
      )}

      <section aria-labelledby="location">
        <h2 id="location">Location</h2>
        <Location listing={listing} />
      </section>

      <section aria-labelledby="similar" id="similar">
        <h2>Similar homes</h2>
        <SimilarHomes listing={listing} homes={similar} />
      </section>

      {(listing.Photos?.length ?? 0) > 1 && (
        <section aria-labelledby="photos">
          <h2 id="photos">All photos ({listing.Photos!.length})</h2>
          <AllPhotos listing={listing} />
        </section>
      )}

      {listing.ListOfficeName && <p className={s.note}>Listing courtesy of {listing.ListOfficeName}. Source: MLS.</p>}
    </main>
  );
}
