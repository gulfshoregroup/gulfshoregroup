import UrlMaker from "@/hooks/url-maker";
import capitalizeWords from "@/hooks/capitalize-letter";

export const SITE_URL = "https://gulfshoregroup.com";

/**
 * Shared SEO helpers for listing pages. These read the CURRENT Prisma
 * `Property` field names (ListPrice, FullAddress, BedroomsTotal, LivingArea,
 * images, Community...). Metadata and JSON-LD previously read legacy field
 * names (CurrentPrice, PropertyAddress, BedsTotal, AllPixList...) that no
 * longer exist, which produced "undefined"/"NaN" in titles and descriptions.
 */

/** Resolve the listing photo URLs from `images` (or raw.Media) as absolute URLs. */
export function getListingImageUrls(listing: any, max = 10): string[] {
	let media = listing?.images ?? listing?.raw?.Media;
	if (typeof media === "string") {
		try {
			media = JSON.parse(media);
		} catch {
			media = [];
		}
	}
	if (!Array.isArray(media)) return [];
	return media
		.map((item: any) => {
			const url =
				typeof item === "string"
					? item
					: item?.MediaURL || item?.url || item?.URL || item?.mediaUrl || item?.MediaUrl;
			if (typeof url !== "string" || !url.trim()) return null;
			const clean = url.trim();
			if (clean.startsWith("http")) return clean;
			return `${SITE_URL}${clean.startsWith("/") ? "" : "/"}${clean}`;
		})
		.filter(Boolean)
		.slice(0, max) as string[];
}

/**
 * Canonical listing URL. Uses `Community || ""` (UrlMaker turns empty into
 * "Others") exactly like the property cards and internal links, and the
 * sitemap uses this same helper, so canonical, sitemap and links all agree.
 * ListingId is what the page looks the property up by.
 */
export function getListingUrl(listing: any): string {
	return `${SITE_URL}${UrlMaker(
		listing.City,
		listing.Community || "",
		listing.FullAddress,
		listing.ListingId
	)}`;
}

export function isLandListing(listing: any): boolean {
	const t = `${listing?.PropertyType || ""} ${listing?.PropertySubType || ""}`.toLowerCase();
	return t.includes("land") || t.includes("lot");
}

export function getListingTypeLabel(listing: any): string {
	if (isLandListing(listing)) return "Land";
	const sub = (listing?.PropertySubType || "").trim();
	if (/single family/i.test(sub)) return "Single Family Home";
	if (/condo/i.test(sub)) return "Condo";
	if (/town/i.test(sub)) return "Townhouse";
	if (/villa/i.test(sub)) return "Villa";
	return sub || listing?.PropertyType || "Home";
}

export function getBaths(listing: any): number | undefined {
	const v =
		listing?.BathroomsTotalDecimal ??
		listing?.BathroomsTotalInteger ??
		(listing?.BathroomsFull != null
			? Number(listing.BathroomsFull) + Number(listing.BathroomsHalf || 0) * 0.5
			: undefined);
	const n = Number(v);
	return Number.isFinite(n) && n > 0 ? n : undefined;
}

function money(n: any): string | undefined {
	const v = Number(n);
	if (!Number.isFinite(v) || v <= 0) return undefined;
	return `$${v.toLocaleString("en-US")}`;
}

/** Human, keyword-rich title: "123 Main St, Naples, FL 34102 | 3 Bed Condo for Sale $1,250,000" */
export function getListingTitle(listing: any): string {
	const city = capitalizeWords(listing.City || "");
	const zip = listing.PostalCode ? ` ${listing.PostalCode}` : "";
	const addr = capitalizeWords(listing.FullAddress || "").replace(/ Fl\b/, " FL");
	const addrHasCity = city && addr.toLowerCase().includes(city.toLowerCase());
	const location = addrHasCity ? addr : `${addr}, ${city}, FL${zip}`;
	const type = getListingTypeLabel(listing);
	const beds = Number(listing.BedroomsTotal) > 0 ? `${listing.BedroomsTotal} Bed ` : "";
	const price = money(listing.ListPrice);
	return `${location} | ${isLandListing(listing) ? "" : beds}${type} for Sale${price ? ` ${price}` : ""}`;
}

export function getListingDescription(listing: any): string {
	const city = capitalizeWords(listing.City || "");
	const community = capitalizeWords(listing.Community || listing.SubdivisionName || "");
	const type = getListingTypeLabel(listing);
	const price = money(listing.ListPrice);
	const features = [
		listing.WaterfrontYN ? "waterfront" : null,
		listing.GulfAccessYN ? "Gulf access" : null,
		listing.PoolPrivateYN ? "private pool" : null,
		listing.SpaYN ? "spa" : null,
		listing.NewConstructionYN ? "new construction" : null,
	].filter(Boolean);

	const parts: string[] = [];
	if (isLandListing(listing)) {
		const acres = Number(listing.LotSizeAcres);
		parts.push(
			`${Number.isFinite(acres) && acres > 0 ? `${acres} acre ` : ""}land for sale at ${listing.FullAddress}`
		);
	} else {
		const beds = Number(listing.BedroomsTotal);
		const baths = getBaths(listing);
		const sqft = Number(listing.LivingArea);
		const specs = [
			beds > 0 ? `${beds} bed` : null,
			baths ? `${baths} bath` : null,
			sqft > 0 ? `${sqft.toLocaleString("en-US")} sq ft` : null,
		]
			.filter(Boolean)
			.join(", ");
		parts.push(`${specs ? specs + " " : ""}${type.toLowerCase()} for sale at ${listing.FullAddress}`);
	}
	if (community && community.toLowerCase() !== city.toLowerCase()) {
		parts.push(`in ${community}, ${city}, FL`);
	} else if (city) {
		parts.push(`in ${city}, FL`);
	}
	let text = parts.join(" ");
	if (price) text += ` listed at ${price}`;
	if (features.length) text += `. Features: ${features.join(", ")}`;
	text += `. MLS# ${listing.MLSNumber || listing.ListingId}. Photos, price history, flood zone and schools on Gulfshore Group.`;
	return text;
}
