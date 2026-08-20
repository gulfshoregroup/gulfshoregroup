import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const q = searchParams.get("q")?.trim();

		if (!q || q.length < 2) {
			return NextResponse.json({ suggestions: [] });
		}

		const properties = await prisma.property.findMany({
			where: {
				PropertyType: { not: "Residential Lease" },
				OR: [
					{ City: { contains: q } },
					{ Community: { contains: q } },
					{ SubdivisionName: { contains: q } },
					{ PostalCode: { contains: q } },
					{ MLSNumber: { contains: q } },
					{ ListingId: { contains: q } },
					{ FullAddress: { contains: q } },
				],
			},
			select: {
				City: true,
				Community: true,
				SubdivisionName: true,
				PostalCode: true,
				MLSNumber: true,
				ListingId: true,
				FullAddress: true,
				raw: true,
			},
			take: 30, // fetch a bit more, trim later
		});

		const suggestionsMap = new Map<string, any>();

		for (const p of properties) {
			// CITY
			if (
				p.City &&
				p.City.toLowerCase().includes(q.toLowerCase()) &&
				!suggestionsMap.has(`city-${p.City}`)
			) {
				suggestionsMap.set(`city-${p.City}`, {
					text: p.City,
					type: "city",
				});
			}

			// COMMUNITY
			if (
				p.Community &&
				p.Community.toLowerCase().includes(q.toLowerCase()) &&
				!suggestionsMap.has(`community-${p.Community}`)
			) {
				suggestionsMap.set(`community-${p.Community}`, {
					text: p.Community,
					type: "community",
					city: p.City ?? undefined,
				});
			}

			// SUBDIVISION
			if (
				p.SubdivisionName &&
				p.SubdivisionName.toLowerCase().includes(q.toLowerCase()) &&
				!suggestionsMap.has(`subdivision-${p.SubdivisionName}`)
			) {
				suggestionsMap.set(`subdivision-${p.SubdivisionName}`, {
					text: p.SubdivisionName,
					type: "subdivision",
					city: p.City ?? undefined,
					community: p.Community ?? undefined,
				});
			}

			// SCHOOL
			const rawObj = p.raw as any;
			const schools = [
				rawObj?.HighSchool,
				rawObj?.MiddleSchool,
				rawObj?.ElementarySchool,
				rawObj?.SchoolDistrict,
			].filter(Boolean);
			for (const sc of schools) {
				if (
					typeof sc === "string" &&
					sc.toLowerCase().includes(q.toLowerCase()) &&
					!suggestionsMap.has(`school-${sc}`)
				) {
					suggestionsMap.set(`school-${sc}`, {
						text: sc,
						type: "school",
						city: p.City ?? undefined,
					});
				}
			}

			// ZIPCODE
			if (
				p.PostalCode &&
				p.PostalCode.includes(q) &&
				!suggestionsMap.has(`zip-${p.PostalCode}`)
			) {
				suggestionsMap.set(`zip-${p.PostalCode}`, {
					text: p.PostalCode,
					type: "zipcode",
				});
			}

			// MLS / LISTING ID
			const mlsVal = p.MLSNumber || p.ListingId;
			if (
				mlsVal &&
				mlsVal.toLowerCase().includes(q.toLowerCase()) &&
				!suggestionsMap.has(`mls-${mlsVal}`)
			) {
				suggestionsMap.set(`mls-${mlsVal}`, {
					text: mlsVal,
					type: "mls",
					MLSNumber: mlsVal,
				});
			}

			// FULL ADDRESS
			if (
				p.FullAddress &&
				p.FullAddress.toLowerCase().includes(q.toLowerCase()) &&
				!suggestionsMap.has(`address-${p.FullAddress}`)
			) {
				suggestionsMap.set(`address-${p.FullAddress}`, {
					text: p.FullAddress,
					type: "address",
					city: p.City ?? undefined,
					community: p.Community ?? undefined,
					zip: p.PostalCode ?? undefined,
					MLSNumber: p.MLSNumber || p.ListingId || undefined,
				});
			}

			if (suggestionsMap.size >= 8) break;
		}

		const suggestions = Array.from(suggestionsMap.values()).slice(
			0,
			8
		);

		return NextResponse.json({ suggestions });
	} catch (error) {
		console.error("Search suggestion error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch suggestions" },
			{ status: 500 }
		);
	}
}
