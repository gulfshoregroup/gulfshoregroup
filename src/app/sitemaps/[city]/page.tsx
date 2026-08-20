import capitalizeWords from "@/hooks/capitalize-letter";
import prisma from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

export const metadata: Metadata = {
	title:
		"Communities Sitemap - Naples Florida Real Estate Office - GULFSHORE GROUP",

	description:
		"Gulfshore Group - We are dedicated to deliver exceptional service and unparalleled expertise in Southwest Florida’s dynamic property market. From luxurious beachfront homes to exclusive waterfront estates, we bring you the finest coastal living experiences.",
	robots: "noindex",
};

async function FetchAllCommunities(city: string) {
	try {
		const cityName = city.trim().toUpperCase().replaceAll("-", " ");
		const res = await prisma.property.findMany({
			where: {
				City: {
					equals: cityName,
				},
				Development: {
					not: null,
				},
			},
			distinct: ["Development"],
			select: {
				Development: true,
			},
			orderBy: {
				Development: "asc",
			},
		});
		return res.map((p) => ({
			DevelopmentName: p.Development,
		}));
	} catch (error) {
		console.error(error);
	}
}

export default async function page({
	params,
}: {
	params: Promise<{ city: string }>;
}) {
	const { city } = await params;

	const communities = await FetchAllCommunities(city);

	const cityName = capitalizeWords(city)
		.replaceAll(" ", "-")
		.replaceAll("&", "And");

	return (
		<div className="px-4 py-8">
			<h1>Florida Real Estate Listings</h1>
			<p className="mb-10">
				Explore properties across various communities in Florida.
			</p>
			<ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{communities?.map(
					(community) =>
						community.DevelopmentName && (
							<li key={community.DevelopmentName}>
								<Link
									className="underline text-blue-600"
									href={`/Florida-Real-Estate-Search/Homes/${cityName}/${capitalizeWords(
										community.DevelopmentName
									)
										.replaceAll(" ", "-")
										.replaceAll("&", "And")}`}>
									Homes for sale in{" "}
									{capitalizeWords(community.DevelopmentName)}
								</Link>
							</li>
						)
				)}
			</ul>
			<ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{communities?.map(
					(community) =>
						community.DevelopmentName && (
							<li key={community.DevelopmentName}>
								<Link
									className="underline text-blue-600"
									href={`/Florida-Real-Estate-Search/Condos/${cityName}/${capitalizeWords(
										community.DevelopmentName
									)
										.replaceAll(" ", "-")
										.replaceAll("&", "And")}`}>
									Condos for sale in{" "}
									{capitalizeWords(community.DevelopmentName)}
								</Link>
							</li>
						)
				)}
			</ul>
			<ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{communities?.map(
					(community) =>
						community.DevelopmentName && (
							<li key={community.DevelopmentName}>
								<Link
									className="underline text-blue-600"
									href={`/Florida-Real-Estate-Search/Residential-Lots/${cityName}/${capitalizeWords(
										community.DevelopmentName
									)
										.replaceAll(" ", "-")
										.replaceAll("&", "And")}`}>
									Residential Lots for sale in{" "}
									{capitalizeWords(community.DevelopmentName)}
								</Link>
							</li>
						)
				)}
			</ul>
			<h2 className="py-4">
				Sitemaps of Properties in SW Florida Communities
			</h2>
			<ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{communities?.map(
					(community) =>
						community.DevelopmentName && (
							<li key={community.DevelopmentName}>
								<Link
									className="underline text-blue-600"
									href={`/sitemaps/${cityName}/${capitalizeWords(
										community.DevelopmentName
									)
										.replaceAll(" ", "-")
										.replaceAll("&", "And")}`}>
									Listings Sitemap For{" "}
									{capitalizeWords(community.DevelopmentName)}
								</Link>
							</li>
						)
				)}
			</ul>
		</div>
	);
}
