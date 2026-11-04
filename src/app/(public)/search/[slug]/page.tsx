import capitalizeWords from "@/hooks/capitalize-letter";
import UrlMaker from "@/hooks/url-maker";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

const KNOWN_SWFL_CITIES: Record<string, string> = {
	"NAPLES": "Naples",
	"BONITA SPRINGS": "Bonita-Springs",
	"ESTERO": "Estero",
	"AVE MARIA": "Ave-Maria",
	"MARCO ISLAND": "Marco-Island",
	"FORT MYERS": "Fort-Myers",
	"FORT MYERS BEACH": "Fort-Myers-Beach",
	"CAPE CORAL": "Cape-Coral",
	"BABCOCK RANCH": "Babcock-Ranch",
	"LEHIGH ACRES": "Lehigh-Acres",
	"IMMOKALEE": "Immokalee",
	"SANIBEL": "Sanibel",
};

const KNOWN_COMMUNITIES: Record<string, { city: string; community: string }> = {
	"MEDITERRA": { city: "Naples", community: "Mediterra" },
	"VINEYARDS": { city: "Naples", community: "Vineyards" },
	"PELICAN BAY": { city: "Naples", community: "Pelican-Bay" },
	"PELICAN MARSH": { city: "Naples", community: "Pelican-Marsh" },
	"PELICAN LANDING": { city: "Bonita-Springs", community: "Pelican-Landing" },
	"GREY OAKS": { city: "Naples", community: "Grey-Oaks" },
	"TIBURON": { city: "Naples", community: "Tiburon" },
	"PORT ROYAL": { city: "Naples", community: "Port-Royal" },
	"PARK SHORE": { city: "Naples", community: "Park-Shore" },
	"MOORINGS": { city: "Naples", community: "Moorings" },
	"LELY RESORT": { city: "Naples", community: "Lely-Resort" },
	"LELY": { city: "Naples", community: "Lely-Resort" },
	"FIDDLERS CREEK": { city: "Naples", community: "Fiddlers-Creek" },
	"FIDDLER S CREEK": { city: "Naples", community: "Fiddlers-Creek" },
	"ISLAND WALK": { city: "Naples", community: "Island-Walk" },
	"QUAIL WEST": { city: "Naples", community: "Quail-West" },
	"QUAIL CREEK": { city: "Naples", community: "Quail-Creek" },
	"BONITA BAY": { city: "Bonita-Springs", community: "Bonita-Bay" },
	"BAREFOOT BEACH": { city: "Bonita-Springs", community: "Barefoot-Beach" },
};

export default async function SearchListingPage({
	params,
	searchParams,
}: {
	params: Promise<{ slug: string }>;
	searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const rawSlug = decodeURIComponent((await params).slug || "").trim();
	const sp = searchParams ? await searchParams : {};
	const viewParam = sp?.view === "map" ? "?view=map" : "";

	if (!rawSlug) {
		redirect("/Florida-Real-Estate-Search" + viewParam);
	}

	const cleanSlug = rawSlug.replace(/,\s*(fl|florida)\b/gi, "").trim();
	const cleanUpper = cleanSlug.toUpperCase();

	// 1. FAST IN-MEMORY CHECK (< 1ms): Known City (Naples, Bonita Springs, Fort Myers, etc.)
	if (KNOWN_SWFL_CITIES[cleanUpper]) {
		redirect(`/Florida-Real-Estate-Search/${KNOWN_SWFL_CITIES[cleanUpper]}${viewParam}`);
	}

	// 2. FAST IN-MEMORY CHECK (< 1ms): Known Community (Mediterra, Vineyards, Pelican Bay, etc.)
	if (KNOWN_COMMUNITIES[cleanUpper]) {
		const { city, community } = KNOWN_COMMUNITIES[cleanUpper];
		redirect(`/Florida-Real-Estate-Search/${city}/${community}${viewParam}`);
	}

	// 3. Zipcode (5 digits)
	if (/^\d{5}$/.test(cleanSlug)) {
		redirect(`/Florida-Real-Estate-Search/postalCode-${cleanSlug}${viewParam}`);
	}

	// 4. MLS Number or Listing ID
	if (/^\d{5,12}$/.test(rawSlug)) {
		const property = await prisma.property.findFirst({
			where: {
				OR: [
					{ MLSNumber: rawSlug },
					{ ListingId: rawSlug },
					{ ListingKey: rawSlug }
				]
			},
			select: { City: true, Community: true, FullAddress: true, MLSNumber: true }
		});

		if (property) {
			redirect(
				UrlMaker(
					property.City,
					property.Community || "",
					property.FullAddress,
					property.MLSNumber
				)
			);
		}
	}

	// 5. Database Match: City
	const cityMatch = await prisma.property.findFirst({
		where: { City: { equals: cleanSlug } },
		select: { City: true }
	});
	if (cityMatch && cityMatch.City) {
		redirect(`/Florida-Real-Estate-Search/${cityMatch.City.replaceAll(" ", "-")}${viewParam}`);
	}

	// 6. Database Match: Community
	const communityMatch = await prisma.property.findFirst({
		where: {
			Community: { contains: cleanSlug }
		},
		select: {
			City: true,
			Community: true
		}
	});

	if (communityMatch && communityMatch.Community) {
		const citySlug = communityMatch.City.replaceAll(" ", "-").toLowerCase();
		const communitySlug = communityMatch.Community.replaceAll(" ", "-").toLowerCase();
		redirect(`/Florida-Real-Estate-Search/${citySlug}/${communitySlug}${viewParam}`);
	}

	// 7. Database Match: Property Address (handles full address with city/zip e.g. "3696 Nelsons Walk, Naples 34102")
	const streetPart = cleanSlug.includes(",") ? cleanSlug.split(",")[0].trim() : cleanSlug;
	const normalizedStreet = streetPart.replace(/['’]/g, "");
	const addressMatch = await prisma.property.findFirst({
		where: {
			OR: [
				{ FullAddress: { contains: cleanSlug } },
				{ FullAddress: { contains: streetPart } },
				{ FullAddress: { contains: normalizedStreet } }
			]
		},
		select: { City: true, Community: true, FullAddress: true, MLSNumber: true }
	});

	if (addressMatch) {
		redirect(
			UrlMaker(
				addressMatch.City,
				addressMatch.Community || "",
				addressMatch.FullAddress,
				addressMatch.MLSNumber
			)
		);
	}

	// 8. Database Match: Subdivision Name
	const subdivisionMatch = await prisma.property.findFirst({
		where: {
			SubdivisionName: { contains: cleanSlug },
		},
		select: { SubdivisionName: true },
	});

	if (subdivisionMatch && subdivisionMatch.SubdivisionName) {
		const joiner = viewParam ? "&" : "?";
		redirect(`/Florida-Real-Estate-Search?subdivision=${encodeURIComponent(subdivisionMatch.SubdivisionName)}${viewParam ? joiner + "view=map" : ""}`);
	}

	// 9. Default fallback: redirect to search with clean keyword and preserve view
	const joiner = viewParam ? "&" : "?";
	redirect(`/Florida-Real-Estate-Search?q=${encodeURIComponent(cleanSlug)}${viewParam ? joiner + "view=map" : ""}`);
}
