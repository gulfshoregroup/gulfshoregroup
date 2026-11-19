// City page Fix 3 — build each city × type page statically, refresh every 5 minutes (ISR).
export const revalidate = 300; // rebuild at most every 5 minutes
export async function generateStaticParams() {
  const types = [null, 'Homes', 'Condos', 'Residential-Lots'];
  return CITIES.flatMap(city => types.map(t => ({ slug: t ? [t, city] : [city] })));
}
