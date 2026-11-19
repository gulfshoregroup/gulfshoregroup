#!/usr/bin/env node
// scripts/site-audit.mjs — checks the Gulfshore Group fixes on a live or staging site.
//
// Usage:
//   node scripts/site-audit.mjs https://staging.gulfshoregroup.com
//   node scripts/site-audit.mjs https://gulfshoregroup.com --city Naples --listings 5
//   node scripts/site-audit.mjs http://localhost:3000 --only listings --listing-urls /path/a,/path/b
//
// Needs Node 18+. Exits with code 1 if any check fails.

const args = process.argv.slice(2);
const BASE = (args.find((a) => /^https?:\/\//.test(a)) || 'https://gulfshoregroup.com').replace(/\/$/, '');
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const CITY = opt('city', 'Naples');
const MAX_LISTINGS = Number(opt('listings', 5));
const ONLY = opt('only', 'all'); // all | site | listings
const GIVEN_LISTINGS = opt('listing-urls', '').split(',').filter(Boolean);

let pass = 0;
let fail = 0;
const check = (ok, label, detail = '') => {
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? '  PASS' : '  FAIL'}  ${label}${!ok && detail ? `  →  ${detail}` : ''}`);
};

const UA = 'Mozilla/5.0 (compatible; GulfshoreSiteAudit/1.0)';
async function get(url, redirect = 'follow') {
  const res = await fetch(url, { redirect, headers: { 'user-agent': UA } });
  const text = redirect === 'manual' ? '' : await res.text();
  return { res, text };
}

const decode = (s = '') =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const titleOf = (h) => decode((h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').trim();
const metaOf = (h, name) => {
  const m =
    h.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`, 'i')) ||
    h.match(new RegExp(`<meta[^>]+content="([^"]*)"[^>]+(?:name|property)="${name}"`, 'i'));
  return m ? decode(m[1]) : '';
};
const canonicalOf = (h) => {
  const m = h.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) || h.match(/<link[^>]+href="([^"]+)"[^>]+rel="canonical"/i);
  return m ? decode(m[1]) : '';
};
const robotsOf = (h) => metaOf(h, 'robots');
const jsonLd = (h) =>
  [...h.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
    try {
      const j = JSON.parse(m[1]);
      const nodes = Array.isArray(j) ? j : [j];
      return nodes.flatMap((n) => (n['@graph'] ? n['@graph'] : [n]));
    } catch {
      return [{ __invalid: true }];
    }
  });
const BAD = /\bundefined\b|\bNaN\b|\[object Object\]/;
const path = (u) => new URL(u, BASE).pathname;

async function auditSite() {
  console.log(`\nHome page — ${BASE}/`);
  const { res, text: h } = await get(`${BASE}/`);
  check(res.status === 200, 'home returns 200', res.status);
  check(!/admin@gulfshore\.com/i.test(h), 'no broken admin@gulfshore.com email link');
  check((h.match(/<h1[\s>]/gi) || []).length === 1, 'exactly one H1');
  check(titleOf(h) && !BAD.test(titleOf(h)), 'title present', titleOf(h));
  check(metaOf(h, 'description').length > 50, 'meta description present');
  const org = jsonLd(h).find((n) => /RealEstateAgent/.test(n['@type']));
  check(!!org?.address?.streetAddress, 'RealEstateAgent schema has a street address');
  const llms = await get(`${BASE}/llms.txt`);
  check(llms.res.status === 200, '/llms.txt exists', llms.res.status);
  const sm = await get(`${BASE}/sitemap.xml`);
  check(new RegExp(`/Florida-Real-Estate-Search/${CITY}<`, 'i').test(sm.text) || /sitemapindex/i.test(sm.text), `sitemap includes ${CITY} city page (or is an index)`);

  console.log(`\nCity page — /Florida-Real-Estate-Search/${CITY}`);
  const cityUrl = `${BASE}/Florida-Real-Estate-Search/${CITY}`;
  const c = await get(cityUrl);
  check(c.res.status === 200, 'city page returns 200', c.res.status);
  check(path(canonicalOf(c.text)) === `/Florida-Real-Estate-Search/${CITY}`, 'canonical points to itself (same case)', canonicalOf(c.text));
  check(!/no-store/i.test(c.res.headers.get('cache-control') || ''), 'city page is cacheable', c.res.headers.get('cache-control'));
  check(/\/Florida-Real-Estate-Listings\//.test(c.text), 'listings are in the HTML (no JavaScript needed)');
  const upper = await get(`${BASE}/Florida-Real-Estate-Search/${CITY.toUpperCase()}`, 'manual');
  check([301, 308].includes(upper.res.status), `/${CITY.toUpperCase()} redirects permanently`, upper.res.status);
  return c.text;
}

async function findListings(cityHtml) {
  if (GIVEN_LISTINGS.length) return GIVEN_LISTINGS.map((p) => new URL(p, BASE).href);
  let html = cityHtml;
  if (!html) html = (await get(`${BASE}/Florida-Real-Estate-Search/${CITY}`)).text;
  let links = [...html.matchAll(/href="(\/Florida-Real-Estate-Listings\/[^"#?]+)"/g)].map((m) => decode(m[1]));
  if (!links.length) {
    // Fallback: listings aren't in the city page HTML yet — take them from the sitemap.
    const sm = (await get(`${BASE}/sitemap.xml`)).text;
    const subs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    const listingSm = subs.find((u) => /listing/i.test(u) && u.endsWith('.xml'));
    const src = listingSm ? (await get(listingSm)).text : sm;
    links = [...src.matchAll(/<loc>([^<]*\/Florida-Real-Estate-Listings\/[^<]+)<\/loc>/g)].map((m) => path(m[1]));
  }
  return [...new Set(links)].slice(0, MAX_LISTINGS).map((p) => new URL(p, BASE).href);
}

async function auditListing(url) {
  console.log(`\nListing — ${path(url)}`);
  const { res, text: h } = await get(url);
  check(res.status === 200, 'returns 200', res.status);
  const title = titleOf(h);
  const desc = metaOf(h, 'description');
  check(title && !BAD.test(title), 'title has no undefined/NaN', title);
  check(desc.length > 50 && !BAD.test(desc), 'meta description is real (no undefined/NaN)', desc);
  check(/, FL/.test(title), 'title includes city and state', title);
  check(path(canonicalOf(h)) === path(url), 'canonical points to itself', canonicalOf(h));

  const nodes = jsonLd(h);
  check(!nodes.some((n) => n.__invalid), 'JSON-LD is valid JSON');
  const rel = nodes.find((n) => n['@type'] === 'RealEstateListing');
  check(!!rel, 'has RealEstateListing schema');
  if (rel) {
    check(rel.name && !/^Home for Sale$/i.test(rel.name) && !BAD.test(rel.name), 'schema name is the real address', rel.name);
    check(rel.url && !/\/undefined$/.test(rel.url) && path(rel.url) === path(url), 'schema URL is correct', rel.url);
    const robots = robotsOf(h);
    const sold = /noindex/i.test(robots);
    if (!sold) check(typeof rel.offers?.price === 'number' && rel.offers.price > 0, 'schema has a price', JSON.stringify(rel.offers));
    check(!rel.offers || /^https:\/\/schema\.org\//.test(rel.offers.availability), 'availability is a valid schema.org value', rel.offers?.availability);
    check(!!rel.mainEntity?.address?.streetAddress, 'schema has a street address');
  }
  check(nodes.some((n) => n['@type'] === 'BreadcrumbList'), 'has BreadcrumbList schema');

  const cc = res.headers.get('cache-control') || '';
  check(!/no-store|private/i.test(cc), 'page is cacheable', cc);
  check(/Similar homes/i.test(h), 'has a Similar homes section');
  if (!/noindex/i.test(robotsOf(h))) check(/Schedule a showing/i.test(h), 'has a Schedule a showing button');
  check(!/unlock high-resolution|Join Gulfshore Group to unlock/i.test(h), 'no sign-up wall on photos');
  check(!/alt="[^"]*-\d+"/.test(h), 'photo alt text is descriptive (not "address-1")');

  // Wrong community in the URL must redirect to the one correct URL
  const parts = path(url).split('/');
  parts[3] = 'WrongName';
  const wrong = await get(BASE + parts.join('/'), 'manual');
  const loc = wrong.res.headers.get('location') || '';
  check(wrong.res.status === 301 && !loc.includes(',') && path(new URL(loc, BASE).href) === path(url), 'wrong URL 301-redirects to the correct one', `${wrong.res.status} ${loc}`);
}

async function auditMissing(sampleUrl) {
  console.log('\nUnknown listing');
  const parts = path(sampleUrl).split('/');
  parts[parts.length - 1] = '999999999';
  const { res } = await get(BASE + parts.join('/'));
  check(res.status === 404, 'unknown MLS number returns a real 404', res.status);
}

(async () => {
  console.log(`Gulfshore Group site audit — ${BASE}`);
  let cityHtml = '';
  if (ONLY === 'all' || ONLY === 'site') cityHtml = await auditSite();
  if (ONLY === 'all' || ONLY === 'listings') {
    const listings = await findListings(cityHtml);
    check(listings.length > 0, `found listing URLs to test (${listings.length})`);
    for (const u of listings) await auditListing(u);
    if (listings[0]) await auditMissing(listings[0]);
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
