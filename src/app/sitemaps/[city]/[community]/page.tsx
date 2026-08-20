import capitalizeWords from "@/hooks/capitalize-letter";
import prisma from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export async function generateMetadata({
	params,
}: {
	params: { city: string; community: string };
}): Promise<Metadata> {
	return {
		title:
			"Listings Sitemap - Naples Florida Real Estate Office - GULFSHORE GROUP",
		description:
			"Gulfshore Group - We are dedicated to deliver exceptional service and unparalleled expertise in Southwest Florida’s dynamic property market. From luxurious beachfront homes to exclusive waterfront estates, we bring you the finest coastal living experiences.",
		robots: "noindex",
	};
}

async function FetchAllProperties(community: string) {
	try {
		const communityName = community
			.trim()
			.toUpperCase()
			.replaceAll("-", " ")
			.replaceAll("And", "&");
		const res = await prisma.property.findMany({
			where: {
				Development: {
					equals: communityName,
				},
			},
			select: {
				Development: true,
				City: true,
				FullAddress: true,
			},
		});

		return res.map((p) => ({
			Development: p.Development,
			City: p.City,
			PropertyAddress: p.FullAddress,
		}));
	} catch (error) {
		console.error("Error fetching properties:", error);
		return [];
	}
}

export default async function Page({
	params,
}: {
	params: { city: string; community: string };
}) {
	const { city, community } = await params;
	const communityName = capitalizeWords(community)
		.replaceAll(" ", "-")
		.replaceAll("&", "And");

	const properties = await FetchAllProperties(community);
	const cityName = capitalizeWords(city)
		.replaceAll(" ", "-")
		.replaceAll("&", "And");

	return (
		<div className="px-4 py-8">
			<h1>Florida Real Estate Listings</h1>
			<p className="mb-10">
				Explore properties across various listings in Florida.
			</p>
			<ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{properties.map((property, i) => {
					const dev = capitalizeWords(property.Development ?? "")
						.replaceAll(" ", "-")
						.replaceAll("&", "And");

					const address = capitalizeWords(property.PropertyAddress)
						.replaceAll(" ", "-")
						.replaceAll("&", "And");

					return (
						<li key={i}>
							<Link
								className="underline text-blue-600"
								href={`/Florida-Real-Estate-Listings/${cityName}/${dev}/${address}`}>
								{capitalizeWords(property.PropertyAddress)}
							</Link>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
