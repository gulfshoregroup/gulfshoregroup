"use server";

import prisma from "@/lib/prisma";
export default async function FetchCities() {
	try {
		const res = await prisma.city.findMany({
			where: { isFeatured: true },
		});
		const cities = res.map((c) => ({
			...c,
			_id: String(c.id),
			City: c.name,
			Images: c.images || [],
			infoText: c.description || "",
			defaultImage: c.defaultImage || "",
		}));

		return cities;
	} catch (error) {
		console.error("Error fetching cities:", error);
		return [];
	}
}
