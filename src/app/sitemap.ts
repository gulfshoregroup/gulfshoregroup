import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import capitalizeWords from "@/hooks/capitalize-letter";
import { getListingUrl } from "@/lib/seo/listing";

const BASE_URL = "https://gulfshoregroup.com";
const MAX_URLS_PER_SITEMAP = 50000; // Google's limit
const BATCH_SIZE = 5000;

// Regenerate at most once per hour instead of on every crawler hit.
export const revalidate = 3600;

const toPath = (s: string) =>
	capitalizeWords(s || "")
		.trim()
		.replaceAll(/\s+/g, "-")
		.replaceAll("&", "And");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const now = new Date();

	const staticRoutes: MetadataRoute.Sitemap = [
		{ url: `${BASE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
		{ url: `${BASE_URL}/Florida-Real-Estate-Search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
		{ url: `${BASE_URL}/explore`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
		{ url: `${BASE_URL}/sell`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
		{ url: `${BASE_URL}/property-management`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
		{ url: `${BASE_URL}/mortgage-calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
		{ url: `${BASE_URL}/blogs`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
		{ url: `${BASE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
		{ url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
	];

	// City + community landing pages: the pages that should rank for
	// "<city> homes for sale" / "<community> homes for sale".
	const areaRoutes: MetadataRoute.Sitemap = [];
	try {
		const cities = await prisma.city.findMany({
			select: {
				name: true,
				updatedAt: true,
				communities: { select: { name: true, updatedAt: true, propertyCount: true } },
			},
		});
		for (const city of cities) {
			const c = toPath(city.name);
			if (!c) continue;
			areaRoutes.push(
				{ url: `${BASE_URL}/Florida-Real-Estate-Search/${c}`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
				{ url: `${BASE_URL}/explore/${c}`, lastModified: city.updatedAt, changeFrequency: "weekly", priority: 0.8 }
			);
			for (const community of city.communities) {
				const m = toPath(community.name);
				if (!m || community.propertyCount === 0) continue; // skip empty (thin) pages
				areaRoutes.push({
					url: `${BASE_URL}/Florida-Real-Estate-Search/${c}/${m}`,
					lastModified: community.updatedAt,
					changeFrequency: "daily",
					priority: 0.8,
				});
			}
		}
	} catch (error) {
		console.warn("Sitemap: city/community generation failed:", error);
	}

	const blogRoutes: MetadataRoute.Sitemap = [];
	try {
		const blogs = await prisma.blog.findMany({
			where: { published: true },
			select: { slug: true, updatedAt: true },
			orderBy: { updatedAt: "desc" },
		});
		for (const b of blogs) {
			blogRoutes.push({
				url: `${BASE_URL}/blogs/${b.slug}`,
				lastModified: b.updatedAt,
				changeFrequency: "monthly",
				priority: 0.6,
			});
		}
	} catch (error) {
		console.warn("Sitemap: blog generation failed:", error);
	}

	const fixed = [...staticRoutes, ...areaRoutes, ...blogRoutes];

	// Active for-sale listings. URL built with the same helper as the page's
	// canonical tag so they always match.
	const allProperties: MetadataRoute.Sitemap = [];
	let skip = 0;
	const maxProperties = MAX_URLS_PER_SITEMAP - fixed.length;

	try {
		while (allProperties.length < maxProperties) {
			const properties = await prisma.property.findMany({
				where: {
					StandardStatus: "Active",
					NOT: [
						{ PropertyType: { contains: "Lease" } },
						{ PropertySubType: { contains: "Lease" } },
						{ PropertyType: { contains: "Rental" } },
						{ PropertySubType: { contains: "Rental" } },
					],
				},
				select: {
					Community: true,
					ListingId: true,
					City: true,
					FullAddress: true,
					ModificationTimestamp: true,
				},
				orderBy: { ModificationTimestamp: "desc" },
				skip,
				take: Math.min(BATCH_SIZE, maxProperties - allProperties.length),
			});

			if (properties.length === 0) break;

			for (const p of properties) {
				allProperties.push({
					url: getListingUrl(p),
					lastModified: p.ModificationTimestamp || now,
					changeFrequency: "weekly",
					priority: 0.7,
				});
			}
			skip += BATCH_SIZE;
		}
	} catch (error) {
		console.warn("Sitemap: listing generation failed (database unreachable?):", error);
	}

	return [...fixed, ...allProperties];
}
