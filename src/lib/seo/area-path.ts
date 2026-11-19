import capitalizeWords from "@/hooks/capitalize-letter";

/**
 * One definition of what a city / community looks like inside a search URL,
 * used by the sitemap, the canonical tag, llms.txt, breadcrumbs and the
 * wrong-capitalisation redirect, so they can never disagree again.
 *
 *   "NAPLES"       -> "Naples"
 *   "PELICAN BAY"  -> "Pelican-Bay"
 *   "bonita-springs" -> "Bonita-Springs"
 *
 * It is the same transformation the site's own links already use
 * (capitalizeWords + spaces -> hyphens), so existing links stay valid.
 */
export function areaSegment(name: string): string {
	return capitalizeWords(
		(name || "").replaceAll("-", " ").replaceAll(/\s+/g, " ").trim()
	).replaceAll(" ", "-");
}

export const SEARCH_BASE_PATH = "/Florida-Real-Estate-Search";

/** Path for a city page or city/community page (segments URL-encoded). */
export function areaPath(city: string, community?: string | null): string {
	const parts = [city, community].filter(Boolean) as string[];
	return `${SEARCH_BASE_PATH}/${parts
		.map((p) => encodeURIComponent(areaSegment(p)))
		.join("/")}`;
}

// Same markers ExtractSearchParams uses to tell filter slugs from area slugs.
const FILTER_MARKERS = [
	"-beds",
	"-baths",
	"-minPrice",
	"-maxPrice",
	"-minBuiltYear",
	"-maxBuiltYear",
	"-minSqft",
	"sort=Newest-First",
	"sort=Price-High-to-Low",
	"sort=Price-Low-to-High",
	"sort=Oldest-First",
	"propertyTypes=",
	"postalCode-",
	"page-",
	"keyword-",
];
const PROPERTY_TYPE_SLUGS = ["Homes", "Residential-Lots", "Condos"];

function safeDecode(s: string): string {
	try {
		return decodeURIComponent(s);
	} catch {
		return s;
	}
}

/**
 * If a search URL uses the wrong capitalisation for a city/community
 * (/NAPLES, /naples, /bonita-springs), returns the corrected path to
 * 301-redirect to. Returns null when the URL is already correct.
 *
 * Only area segments are touched; property types (Homes, Condos...) and
 * filter segments (3-beds, page-2, sort=...) are left exactly as they are.
 */
export function correctedSearchPath(rawSlugs: string[] | undefined): string | null {
	if (!rawSlugs || rawSlugs.length === 0) return null;

	let changed = false;
	const out = rawSlugs.map((raw) => {
		const slug = safeDecode(raw);
		const isFilter = FILTER_MARKERS.some(
			(f) => slug === f || slug.startsWith(f) || slug.endsWith(f)
		);
		if (isFilter || PROPERTY_TYPE_SLUGS.includes(slug)) return raw;

		const fixed = areaSegment(slug);
		if (fixed && fixed !== slug) {
			changed = true;
			return encodeURIComponent(fixed);
		}
		return raw;
	});

	return changed ? `${SEARCH_BASE_PATH}/${out.join("/")}` : null;
}
