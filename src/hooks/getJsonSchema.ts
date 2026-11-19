import capitalizeWords from "./capitalize-letter";
import { areaPath } from "@/lib/seo/area-path";
import {
	getBaths,
	getListingDescription,
	getListingImageUrls,
	getListingTitle,
	getListingUrl,
	isLandListing,
	SITE_URL,
} from "@/lib/seo/listing";

const BROKERAGE = {
	"@type": "RealEstateAgent",
	"@id": `${SITE_URL}/#organization`,
	name: "Gulfshore Group",
	url: SITE_URL,
	telephone: "+1-239-992-9119",
	email: "mailbox@gulfshoregroup.com",
};

const OFF_MARKET = ["Withdrawn", "Canceled", "Expired", "Off Market", "Off-Market", "Closed", "Sold"];

const isoDate = (d: any) => {
	if (!d) return undefined;
	const dt = new Date(d);
	return isNaN(dt.getTime()) ? undefined : dt.toISOString().split("T")[0];
};

/**
 * Schema.org JSON-LD for a listing page: RealEstateListing + the House /
 * Apartment / Landform it offers + BreadcrumbList.
 * Reads the CURRENT Prisma `Property` fields.
 */
export default function createHouseJsonLd(listing: any) {
	const url = getListingUrl(listing);
	const images = getListingImageUrls(listing, 10);
	const city = capitalizeWords(listing.City || "");
	const community = capitalizeWords(listing.Community || "");
	const land = isLandListing(listing);
	const isCondo = /condo|apartment/i.test(listing.PropertySubType || "");
	const price = Number(listing.ListPrice);
	const lat = Number(listing.Latitude);
	const lng = Number(listing.Longitude);
	const beds = Number(listing.BedroomsTotal);
	const baths = getBaths(listing);
	const sqft = Number(listing.LivingArea);
	const acres = Number(listing.LotSizeAcres);
	const offMarket = OFF_MARKET.includes(listing.StandardStatus || "");

	const address = {
		"@type": "PostalAddress",
		streetAddress: listing.FullAddress || undefined,
		addressLocality: city || undefined,
		addressRegion: listing.StateOrProvince || "FL",
		postalCode: listing.PostalCode || undefined,
		addressCountry: "US",
	};

	const amenityFeature = [
		listing.PoolPrivateYN && "Private Pool",
		listing.WaterfrontYN && "Waterfront",
		listing.GulfAccessYN && "Gulf Access",
		listing.SpaYN && "Spa",
		listing.GarageYN && "Garage",
		listing.NewConstructionYN && "New Construction",
	]
		.filter(Boolean)
		.map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true }));

	const place: any = {
		"@id": `${url}#property`,
		"@type": land ? "Landform" : isCondo ? "Apartment" : "SingleFamilyResidence",
		name: listing.FullAddress,
		url,
		image: images.length ? images : undefined,
		address,
		geo:
			Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
				? { "@type": "GeoCoordinates", latitude: lat, longitude: lng }
				: undefined,
		amenityFeature: amenityFeature.length ? amenityFeature : undefined,
	};
	if (!land) {
		place.numberOfBedrooms = beds > 0 ? beds : undefined;
		place.numberOfBathroomsTotal = baths;
		place.numberOfRooms = Number(listing.RoomsTotal) > 0 ? Number(listing.RoomsTotal) : beds > 0 ? beds : undefined;
		place.floorSize =
			sqft > 0 ? { "@type": "QuantitativeValue", value: sqft, unitCode: "FTK" } : undefined;
		place.yearBuilt = Number(listing.YearBuilt) > 0 ? Number(listing.YearBuilt) : undefined;
	}
	if (acres > 0) {
		place.additionalProperty = {
			"@type": "PropertyValue",
			name: "Lot size",
			value: acres,
			unitCode: "ACR",
		};
	}

	const listingNode: any = {
		"@type": "RealEstateListing",
		"@id": `${url}#listing`,
		url,
		name: getListingTitle(listing),
		description: listing.Description || getListingDescription(listing),
		image: images.length ? images : undefined,
		datePosted: isoDate(listing.OnMarketDate || listing.OnMarketTimestamp),
		dateModified: isoDate(listing.ModificationTimestamp),
		identifier: listing.MLSNumber || listing.ListingId,
		about: { "@id": `${url}#property` },
		provider: BROKERAGE,
		offers:
			price > 0
				? {
						"@type": "Offer",
						price,
						priceCurrency: "USD",
						availability: offMarket
							? "https://schema.org/SoldOut"
							: "https://schema.org/InStock",
						url,
						seller: BROKERAGE,
				  }
				: undefined,
	};

	const hasCommunity = community && community.toLowerCase() !== city.toLowerCase();
	const crumbs = [
		{ name: "Home", item: SITE_URL },
		{ name: `${city} Real Estate`, item: `${SITE_URL}${areaPath(city)}` },
		hasCommunity
			? { name: community, item: `${SITE_URL}${areaPath(city, community)}` }
			: null,
		{ name: listing.FullAddress, item: url },
	].filter(Boolean) as { name: string; item: string }[];

	const breadcrumb = {
		"@type": "BreadcrumbList",
		itemListElement: crumbs.map((c, i) => ({
			"@type": "ListItem",
			position: i + 1,
			name: c.name,
			item: c.item,
		})),
	};

	return {
		"@context": "https://schema.org",
		"@graph": [listingNode, place, breadcrumb],
	};
}
