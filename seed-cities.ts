import prisma from "./src/lib/prisma";

async function seed() {
	console.log("Reading properties from database to extract cities and communities...");
	const properties = await prisma.property.findMany({
		select: {
			City: true,
			Community: true,
			Development: true,
		}
	});

	// Find or create a default Naples city first
	const naplesSlug = "naples";
	const defaultCity = await prisma.city.upsert({
		where: { slug: naplesSlug },
		update: {},
		create: {
			name: "Naples",
			slug: naplesSlug,
			isFeatured: true,
		}
	});

	const cityMap = new Map<string, number>();
	cityMap.set("naples", defaultCity.id);

	// Extract unique cities
	const cities = new Set<string>();
	const communities = new Map<string, string>(); // community -> city

	for (const p of properties) {
		if (p.City) {
			const cityTrimmed = p.City.trim();
			cities.add(cityTrimmed);
			
			const comm = p.Community?.trim() || p.Development?.trim();
			if (comm) {
				communities.set(comm, cityTrimmed);
			}
		}
	}

	console.log(`Found ${cities.size} unique cities and ${communities.size} unique communities.`);

	// Insert cities
	for (const cityName of cities) {
		const slug = cityName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
		if (!slug) continue;
		
		try {
			const cityObj = await prisma.city.upsert({
				where: { slug },
				update: {},
				create: {
					name: cityName,
					slug: slug,
					isFeatured: true,
				}
			});
			cityMap.set(cityName.toLowerCase(), cityObj.id);
		} catch (err: any) {
			console.log(`Failed to upsert city ${cityName}:`, err.message);
		}
	}

	// Insert communities
	let commCount = 0;
	for (const [commName, cityName] of communities.entries()) {
		const slug = commName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
		if (!slug) continue;

		const cityId = cityMap.get(cityName.toLowerCase()) || defaultCity.id;

		try {
			await prisma.community.upsert({
				where: { slug },
				update: {},
				create: {
					name: commName,
					slug: slug,
					cityId: cityId,
				}
			});
			commCount++;
		} catch (err: any) {
			// Skip duplicates or formatting issues
		}
	}
	console.log(`Successfully seeded ${cityMap.size} cities and ${commCount} communities.`);
}

seed().catch(console.error).finally(() => prisma.$disconnect());
