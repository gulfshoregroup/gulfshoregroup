import "server-only";
import prisma from "@/lib/prisma";

/** An area needs at least this many active listings to get its own sitemap entry. */
export const MIN_LISTINGS_FOR_SITEMAP = 3;

export type AreaCity = { name: string; count: number; communities: { name: string; count: number }[] };

/**
 * Cities and communities that actually have active for-sale listings, with
 * counts, read straight from the Property table.
 *
 * (The Community.propertyCount column is not maintained — it is 0 for every
 * row — so using it left every community page out of the sitemap.)
 */
export async function getActiveAreas(): Promise<AreaCity[]> {
	const rows = await prisma.property.groupBy({
		by: ["City", "Community"],
		where: {
			StandardStatus: "Active",
			NOT: [
				{ PropertyType: { contains: "Lease" } },
				{ PropertySubType: { contains: "Lease" } },
				{ PropertyType: { contains: "Rental" } },
				{ PropertySubType: { contains: "Rental" } },
			],
		},
		_count: { _all: true },
	});

	// City values differ in capitalisation across MLS rows, so group case-insensitively.
	const cities = new Map<string, { name: string; count: number; communities: Map<string, { name: string; count: number }> }>();
	for (const r of rows as any[]) {
		const cityName = String(r.City || "").trim();
		if (!cityName) continue;
		const cKey = cityName.toUpperCase();
		const n = r._count?._all ?? 0;
		let c = cities.get(cKey);
		if (!c) cities.set(cKey, (c = { name: cityName, count: 0, communities: new Map() }));
		c.count += n;

		const commName = String(r.Community || "").trim();
		if (!commName || commName.toUpperCase() === "OTHER" || commName.toUpperCase() === "OTHERS") continue;
		const mKey = commName.toUpperCase();
		const m = c.communities.get(mKey);
		if (m) m.count += n;
		else c.communities.set(mKey, { name: commName, count: n });
	}

	return [...cities.values()]
		.map((c) => ({
			name: c.name,
			count: c.count,
			communities: [...c.communities.values()].sort((a, b) => b.count - a.count),
		}))
		.sort((a, b) => b.count - a.count);
}
