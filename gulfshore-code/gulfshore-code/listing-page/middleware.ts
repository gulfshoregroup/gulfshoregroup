// middleware.ts — listing page fix 5: one URL per listing.
// /Florida-Real-Estate-Listings/Naples/WrongName/286-Indies-DR-E-202/226041936 -> 301 to the correct URL.
// The MLS number (last part of the URL) decides which home it is.
//
// Needs Next.js 15.5+ (Node.js middleware). If you already have a middleware.ts
// (e.g. the city-name redirect from the city-pages fixes), merge both into one file:
// run the city check first, then call listingRedirect(req).
import { NextResponse, type NextRequest } from 'next/server';
import { correctPathFor } from '@/lib/listings/data';
import { listingPath } from '@/lib/seo/listing';

const PREFIX = '/Florida-Real-Estate-Listings/';
const MLS_ID = /^[A-Za-z0-9-]{4,20}$/;

export async function listingRedirect(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith(PREFIX)) return NextResponse.next();
  const id = decodeURIComponent(pathname.split('/').at(-1) ?? '');
  if (!MLS_ID.test(id)) return NextResponse.next();

  const correct = await correctPathFor(id, listingPath);
  if (!correct) return NextResponse.next(); // unknown listing: the page returns a real 404
  const requested = pathname.split('/').map((p) => encodeURIComponent(decodeURIComponent(p))).join('/');
  if (requested === correct) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = correct;
  return NextResponse.redirect(url, 301);
}

export function middleware(req: NextRequest) {
  return listingRedirect(req);
}

export const config = {
  matcher: '/Florida-Real-Estate-Listings/:path*',
  runtime: 'nodejs',
};
