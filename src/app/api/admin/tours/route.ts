import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
	try {
		const tours = await prisma.scheduleTour.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});

		const propertyIds = tours.map((t) => t.propertyId).filter(Boolean);
		const emails = tours.map((t) => t.email.toLowerCase().trim()).filter(Boolean);

		const [properties, leads] = await Promise.all([
			prisma.property.findMany({
				where: {
					OR: [
						{ id: { in: propertyIds } },
						{ ListingId: { in: propertyIds } },
						{ MLSNumber: { in: propertyIds } },
					],
				},
				select: {
					id: true,
					ListingId: true,
					MLSNumber: true,
					FullAddress: true,
					ListPrice: true,
					BedroomsTotal: true,
					BathroomsFull: true,
					LivingArea: true,
					City: true,
					StateOrProvince: true,
					ListAgentFullName: true,
					ListAgentEmail: true,
					ListAgentCellPhone: true,
					ListAgentDirectPhone: true,
					ListAgentOfficePhone: true,
					ListOfficeName: true,
				},
			}),
			prisma.lead.findMany({
				where: { email: { in: emails } },
				select: { email: true, firstName: true, lastName: true, fullName: true },
			}),
		]);

		const propertyMap = new Map<string, any>();
		properties.forEach((p) => {
			if (p.id) propertyMap.set(p.id, p);
			if (p.ListingId) propertyMap.set(p.ListingId, p);
			if (p.MLSNumber) propertyMap.set(p.MLSNumber, p);
		});

		const leadMap = new Map(
			leads.map((l) => [
				l.email.toLowerCase().trim(),
				l.fullName || `${l.firstName || ""} ${l.lastName || ""}`.trim(),
			])
		);

		const mappedTours = tours.map((t) => {
			const syncedLeadName = leadMap.get(t.email.toLowerCase().trim());
			const targetProp = t.propertyId ? propertyMap.get(t.propertyId) : null;
			let resolvedAddress = targetProp ? targetProp.FullAddress : null;
			if (!resolvedAddress && t.message && t.message.includes("for property ")) {
				resolvedAddress = t.message.split("for property ")[1]?.trim();
			}

			return {
				id: t.id,
				propertyId: t.propertyId,
				propertyAddress: resolvedAddress || (t.propertyId ? "MLS ID: " + t.propertyId : "General / Direct Tour"),
				propertyDetails: {
					address: resolvedAddress || (t.propertyId ? "MLS ID: " + t.propertyId : "General / Direct Tour"),
					price: targetProp?.ListPrice ? `$${targetProp.ListPrice.toLocaleString()}` : null,
					beds: targetProp?.BedroomsTotal || null,
					baths: targetProp?.BathroomsFull || null,
					sqft: targetProp?.LivingArea ? `${targetProp.LivingArea.toLocaleString()} sqft` : null,
					city: targetProp?.City || null,
					mlsId: targetProp?.MLSNumber || targetProp?.ListingId || t.propertyId || null,
				},
				listingAgent: {
					name: targetProp?.ListAgentFullName || "Gulfshore In-House Listing Agent",
					email: targetProp?.ListAgentEmail || "listings@gulfshoregroup.com",
					phone: targetProp?.ListAgentCellPhone || targetProp?.ListAgentDirectPhone || targetProp?.ListAgentOfficePhone || "(239) 555-0199",
					office: targetProp?.ListOfficeName || "Gulfshore Real Estate LLC",
				},
				userName: syncedLeadName || t.name || "Unknown User",
				userEmail: t.email,
				userPhone: t.phone || "",
				requestedDate: new Date(t.date).toLocaleDateString("en-US", { timeZone: "America/New_York" }),
				requestedTime: new Date(t.date).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" }),
				status: t.status || "Pending",
				message: t.message || "",
				createdAt: new Date(t.createdAt).toLocaleDateString("en-US", { timeZone: "America/New_York" }),
			};
		});


		return NextResponse.json({ success: true, tours: mappedTours });
	} catch (error: any) {
		console.error("Error fetching admin tours:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}

