import prisma from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import React from "react";

function capitalizeWords(str: string) {
	const directions = ['ne', 'nw', 'se', 'sw', 'n', 's', 'e', 'w'];
	return str
		.toLowerCase()
		.split(" ")
		.map((word) => {
			if (directions.includes(word)) return word.toUpperCase();
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(" ");
}


export const metadata: Metadata = {
	title:
		"Sitemaps - Naples Florida Real Estate Office - GULFSHORE GROUP",

	description:
		"Gulfshore Group - We are dedicated to deliver exceptional service and unparalleled expertise in Southwest Florida’s dynamic property market. From luxurious beachfront homes to exclusive waterfront estates, we bring you the finest coastal living experiences.",
	robots: "noindex",
};

async function FetchAllCities() {
	try {
		const res = await prisma.city.findMany({
			orderBy: {
				name: "asc",
			},
		});

		return res.map((c) => ({
			City: c.name,
		}));
	} catch (error) {
		console.error(error);
	}
}

export default async function page() {
	const cities = await FetchAllCities();

	return (
		<div className="px-4 py-8">
			<h1>Florida Real Estate Listings</h1>
			<p className="mb-10">
				Explore properties across various cities in Florida.
			</p>
			<ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{cities?.map((city) => (
					<li key={city.City}>
						<Link
							className="underline text-blue-600"
							href={`/Florida-Real-Estate-Search/Homes/${capitalizeWords(
								city.City
							).replaceAll(" ", "-")}`}>
							Homes for sale in {capitalizeWords(city.City)}
						</Link>
					</li>
				))}
			</ul>
			<ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{cities?.map((city) => (
					<li key={city.City}>
						<Link
							className="underline text-blue-600"
							href={`/Florida-Real-Estate-Search/Condos/${capitalizeWords(
								city.City
							).replaceAll(" ", "-")}`}>
							Condos for sale in {capitalizeWords(city.City)}
						</Link>
					</li>
				))}
			</ul>
			<ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{cities?.map((city) => (
					<li key={city.City}>
						<Link
							className="underline text-blue-600"
							href={`/Florida-Real-Estate-Search/Residential-Lots/${capitalizeWords(
								city.City
							).replaceAll(" ", "-")}`}>
							Residential Lots for sale in{" "}
							{capitalizeWords(city.City)}
						</Link>
					</li>
				))}
			</ul>
			<h2 className="py-4">
				Sitemaps of Communities in SW Florida Cities
			</h2>

			<ul className="list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{cities?.map((city) => (
					<li key={city.City}>
						<Link
							className="underline text-blue-600"
							href={`/sitemaps/${capitalizeWords(
								city.City
							).replaceAll(" ", "-")}`}>
							Communities Sitemap For {capitalizeWords(city.City)}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
