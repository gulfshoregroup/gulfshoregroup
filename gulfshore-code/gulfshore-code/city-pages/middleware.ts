// middleware.ts — send /NAPLES, /naples etc. to /Naples (301)
const CITIES = ['Naples','Bonita-Springs','Marco-Island','Estero','Fort-Myers','Cape-Coral',
  'Ave-Maria','Sanibel','Captiva','Fort-Myers-Beach','Miromar-Lakes','Babcock-Ranch','Lehigh-Acres','Immokalee'];
const byLower = Object.fromEntries(CITIES.map(c => [c.toLowerCase(), c]));

export function middleware(req) {
  const url = req.nextUrl;
  const parts = url.pathname.split('/');
  const last = parts.at(-1);
  const proper = byLower[last?.toLowerCase()];
  if (url.pathname.startsWith('/Florida-Real-Estate-Search') && proper && proper !== last) {
    parts[parts.length - 1] = proper;
    url.pathname = parts.join('/');
    return Response.redirect(url, 301);
  }
}
