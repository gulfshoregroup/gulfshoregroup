// app/Florida-Real-Estate-Search/[...slug]/page.tsx  (adapt to your routes)
// City page Fix 1 + 2 — unique title/description per city & type, self-referencing canonical.
export async function generateMetadata({ params }) {
  const { type, city } = parseSlug(params.slug);   // e.g. { type: 'Condos', city: 'Naples' }
  const stats = await getCityStats(city, type);    // live count from MLS feed
  const path = type ? `/Florida-Real-Estate-Search/${type}/${city}` : `/Florida-Real-Estate-Search/${city}`;
  return {
    title: titleFor(type, city),
    description: descriptionFor(type, city, stats),
    alternates: { canonical: `https://gulfshoregroup.com${path}` },
    openGraph: { url: `https://gulfshoregroup.com${path}`, images: [`/og/${city}.jpg`] },
  };
}
