import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import UrlMaker from "@/hooks/url-maker";

const BASE_URL = "https://gulfshoregroup.com";
const MAX_URLS_PER_SITEMAP = 50000; // Google's limit
const BATCH_SIZE = 5000; // Fetch properties in batches

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	// Static routes
	const staticRoutes: MetadataRoute.Sitemap = [
		{
			url: "https://gulfshoregroup.com/",
			lastModified: new Date(),
			changeFrequency: "hourly",
			priority: 1.0,
		},
		{
			url: "https://gulfshoregroup.com/about",
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: "https://gulfshoregroup.com/contact",
			lastModified: new Date(),
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: "https://gulfshoregroup.com/Florida-Real-Estate-Search",
			lastModified: new Date(),
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: "https://gulfshoregroup.com/sitemaps",
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 0.5,
		},
	];

	// Fetch properties in batches to avoid memory issues
	const allProperties: MetadataRoute.Sitemap = [];
	let skip = 0;
	let hasMore = true;
	const maxProperties = MAX_URLS_PER_SITEMAP - staticRoutes.length;

	try {
		while (hasMore && allProperties.length < maxProperties) {
			const properties = await prisma.property.findMany({
				where: {
					StandardStatus: "Active",
				},
				select: {
					Community: true,
					ListingId: true,
					City: true,
					FullAddress: true,
					ModificationTimestamp: true,
				},
				orderBy: {
					ModificationTimestamp: "desc",
				},
				skip,
				take: Math.min(
					BATCH_SIZE,
					maxProperties - allProperties.length
				),
			});

			if (properties.length === 0) {
				hasMore = false;
				break;
			}

			const propertyRoutes = properties.map((p) => ({
				url: `${BASE_URL}${UrlMaker(
					p.City,
					p.Community || "Other",
					p.FullAddress,
					p.ListingId
				)}`,
				lastModified: p.ModificationTimestamp || new Date(),
				changeFrequency: "weekly" as const,
				priority: 0.7,
			}));

			allProperties.push(...propertyRoutes);
			skip += BATCH_SIZE;
		}
	} catch (error) {
		console.warn("Sitemap properties generation failed (database might not be reachable at build time):", error);
	}

	return [...staticRoutes, ...allProperties];
}
