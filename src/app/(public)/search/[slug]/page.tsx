import capitalizeWords from "@/hooks/capitalize-letter";
import UrlMaker from "@/hooks/url-maker";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Cities from "@/types/cities";

// Robust router that maps search queries to details or filter results
export default async function SearchListingPage({
	params,
}: {
	params: { slug: string };
}) {
	const rawSlug = decodeURIComponent((await params).slug || "").trim();

	if (!rawSlug) {
		redirect("/Florida-Real-Estate-Search");
	}

	const normalized = rawSlug.toLowerCase().replaceAll("-", " ");

	// 1. Check if the query is an MLS Number or ID
	if (/^\d{5,12}$/.test(rawSlug)) {
		const property = await prisma.property.findFirst({
			where: {
				OR: [
					{ MLSNumber: rawSlug },
					{ ListingId: rawSlug },
					{ ListingKey: rawSlug }
				]
			}
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

	// 2. Check if the query is a known City (from cities.tsx list)
	const cityMatch = Cities.find(
		(c) => c.toLowerCase() === normalized.replaceAll(" ", "-") || c.toLowerCase().replaceAll("-", " ") === normalized
	);
	if (cityMatch) {
		redirect(`/Florida-Real-Estate-Search/${cityMatch}`);
	}

	// 3. Check if it matches a Community Name in the DB
	const communityMatch = await prisma.property.findFirst({
		where: {
			Community: {
				contains: rawSlug
			}
		},
		select: {
			City: true,
			Community: true
		}
	});

	if (communityMatch && communityMatch.Community) {
		const citySlug = communityMatch.City.replaceAll(" ", "-").toLowerCase();
		const communitySlug = communityMatch.Community.replaceAll(" ", "-").toLowerCase();
		redirect(`/Florida-Real-Estate-Search/${citySlug}/${communitySlug}`);
	}

	// 4. Check if it matches a Property Address
	const addressMatch = await prisma.property.findFirst({
		where: {
			FullAddress: {
				contains: rawSlug
			}
		}
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

	// 5. Check if the query is a Zipcode (5 digits)
	if (/^\d{5}$/.test(rawSlug)) {
		redirect(`/Florida-Real-Estate-Search/postalCode-${rawSlug}`);
	}

	// 5b. Check if it matches a Subdivision Name in the DB
	const subdivisionMatch = await prisma.property.findFirst({
		where: {
			SubdivisionName: {
				contains: rawSlug
			},
		},
		select: {
			SubdivisionName: true,
		},
	});

	if (subdivisionMatch && subdivisionMatch.SubdivisionName) {
		redirect(`/Florida-Real-Estate-Search?subdivision=${encodeURIComponent(subdivisionMatch.SubdivisionName)}`);
	}

	// 6. Default fallback: redirect to the search map page with general search keyword
	redirect(`/Florida-Real-Estate-Search?q=${encodeURIComponent(rawSlug)}`);
}
