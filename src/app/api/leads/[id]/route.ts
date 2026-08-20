import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

async function getMappedLead(id: string) {
	const lead = await prisma.lead.findUnique({
		where: { id },
		include: {
			notes: {
				orderBy: {
					createdAt: "desc",
				},
			},
			inquiryHistory: {
				orderBy: {
					createdAt: "desc",
				},
			},
			savedSearch: {
				orderBy: {
					createdAt: "desc",
				},
			},
			aiChats: {
				orderBy: { createdAt: "desc" },
			},
			tasks: {
				orderBy: { createdAt: "desc" },
			},
			viewHistory: {
				orderBy: { lastViewedAt: "desc" },
				include: { property: true },
			},
		},
	});

	if (!lead) return null;

	let parsedTags: string[] = [];
	if (lead.tags) {
		try {
			const raw = typeof lead.tags === "string" ? JSON.parse(lead.tags) : lead.tags;
			if (Array.isArray(raw)) {
				parsedTags = raw.filter((t: any) => typeof t === "string");
			} else if (typeof raw === "object" && raw !== null) {
				parsedTags = Object.values(raw).filter((t: any) => typeof t === "string");
			}
		} catch {
			parsedTags = [];
		}
	}

	const mappedCriteria = (lead.savedSearch || []).map((s) => {
		const f = typeof s.filters === "string" ? JSON.parse(s.filters) : s.filters || {};
		return {
			_id: s.id,
			city: f.city || f.City || "",
			developmentName: f.developmentName || f.community || "",
			beds: f.beds || "",
			baths: f.baths || "",
			minPrice: f.minPrice || "",
			maxPrice: f.maxPrice || "",
			propertyTypes: f.propertyTypes || [],
			features: f.features || [],
		};
	});

	// Fetch sent alerts from drip logs & sequence steps
	const [dripLogs, sequenceSteps] = await Promise.all([
		prisma.dripCampaignLog.findMany({
			where: { userId: id },
			orderBy: { sentAt: "desc" },
		}),
		prisma.sequenceStep.findMany({
			where: { leadId: id, sentAt: { not: null } },
			orderBy: { sentAt: "desc" },
		}),
	]);

	const sentAlerts = [
		...dripLogs.map((log) => ({
			id: log.id,
			sentAt: log.sentAt,
			subject: "Automated Property Match Digest",
			campaignName: "Property Drip Campaign",
			type: "Property Alert",
			status: log.status === "sent" ? "Delivered" : log.status,
			propertiesCount: 3,
		})),
		...sequenceSteps.map((step) => ({
			id: step.id,
			sentAt: step.sentAt || step.scheduledAt,
			subject: step.message ? step.message.slice(0, 50) + "..." : "Property Email Alert",
			campaignName: "Drip Sequence",
			type: step.type || "Email Alert",
			status: step.status === "sent" ? "Delivered" : "Sent",
			propertiesCount: 1,
		})),
		...(lead.savedSearch || [])
			.filter((s) => s.lastNotifiedAt)
			.map((s) => {
				const f = typeof s.filters === "string" ? JSON.parse(s.filters) : s.filters || {};
				return {
					id: s.id,
					sentAt: s.lastNotifiedAt!,
					subject: `Instant Alert: New Listings in ${f.city || f.City || "SW Florida"}`,
					campaignName: s.name || "Saved Search Alert",
					type: "Saved Search Alert",
					status: "Delivered",
					propertiesCount: 5,
				};
			}),
	].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

	// Fetch all viewed properties for this lead (including any associated by email or clerk userId)
	const orConditions: any[] = [{ userId: lead.id }];
	if (lead.userId) orConditions.push({ userId: lead.userId });
	if (lead.email) orConditions.push({ user: { email: { equals: lead.email } } });

	const rawViews = await prisma.viewedProperty.findMany({
		where: { OR: orConditions },
		orderBy: { lastViewedAt: "desc" },
		include: { property: true },
	});

	// Deduplicate by propertyId
	const seenProperties = new Set<string>();
	const allViewedProperties = rawViews.filter((v) => {
		if (seenProperties.has(v.propertyId)) return false;
		seenProperties.add(v.propertyId);
		return true;
	});

	return {
		...lead,
		_id: lead.id,
		fullName: lead.fullName || `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unknown User",
		tags: parsedTags,
		propertyCriteria: mappedCriteria,
		sentAlerts,

		notes: lead.notes.map((n) => ({
			_id: n.id,
			content: n.message,
			createdAt: n.createdAt,
		})),
		inquiryHistory: lead.inquiryHistory.map((i) => ({
			_id: i.id,
			type: i.type,
			message: i.message,
			propertyId: i.propertyId,
			createdAt: i.createdAt,
		})),
		aiChats: lead.aiChats,
		tasks: lead.tasks,
		viewHistory: allViewedProperties.map((v) => {
			let image = "/map-bg.webp";
			if (v.property?.images) {
				try {
					const imgs = typeof v.property.images === "string" ? JSON.parse(v.property.images) : v.property.images;
					if (Array.isArray(imgs) && imgs.length > 0) {
						const first = imgs[0];
						image = typeof first === "string" ? first : first?.MediaURL || image;
					}
				} catch (e) {}
			}

			const city = v.property?.City || "";
			const community = v.property?.Community || "";
			const address = v.property?.FullAddress || "Unknown Address";
			const mls = v.property?.MLSNumber || "";
			const formattedCity = city ? city.replaceAll(/\s+/g, "-") : "Florida";
			const formattedCommunity = community ? community.replaceAll(/\s+/g, "-") : "others";
			const formattedAddress = address.replaceAll(", ", "-").replaceAll(" ", "-").replaceAll("/", "-");
			const url = `/Florida-Real-Estate-Listings/${formattedCity}/${formattedCommunity}/${formattedAddress}${mls ? `/${mls}` : ""}`;

			return {
				_id: v.id,
				propertyId: v.propertyId,
				address: v.property?.FullAddress || "Unknown Address",
				price: v.property?.ListPrice,
				propertyType: v.property?.PropertySubType || v.property?.PropertyType || "Single Family Residence",
				image,
				url,
				mlsNumber: mls,
				viewCount: v.viewCount,
				lastViewedAt: v.lastViewedAt,
			};
		}),
	};
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const lead = await getMappedLead(id);
		if (!lead) {
			return NextResponse.json(
				{ error: "Lead not found" },
				{ status: 404 }
			);
		}
		return NextResponse.json(lead);
	} catch (error: any) {
		console.error("Error fetching lead detail:", error);
		return NextResponse.json(
			{ error: "Failed to fetch lead", details: error.message },
			{ status: 500 }
		);
	}
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const body = await req.json();

		const updateData: any = {};
		if (body.status !== undefined) updateData.status = body.status;
		if (body.tags !== undefined) updateData.tags = body.tags;
		if (body.firstName !== undefined) updateData.firstName = body.firstName;
		if (body.lastName !== undefined) updateData.lastName = body.lastName;
		if (body.email !== undefined) updateData.email = body.email;
		if (body.phone !== undefined) updateData.phone = body.phone;
		if (body.fullName !== undefined) updateData.fullName = body.fullName;

		await prisma.lead.update({
			where: { id },
			data: updateData,
		});

		const lead = await getMappedLead(id);
		return NextResponse.json(lead);
	} catch (error: any) {
		console.error("Error updating lead:", error);
		return NextResponse.json(
			{ error: "Failed to update lead", details: error.message },
			{ status: 500 }
		);
	}
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		
		const lead = await prisma.lead.findUnique({
			where: { id },
			select: { userId: true },
		});

		if (lead?.userId) {
			try {
				const client = await clerkClient();
				await client.users.deleteUser(lead.userId);
			} catch (err: any) {
				console.error("Error deleting user from Clerk:", err);
				throw new Error("Failed to delete user from authentication server: " + err.message);
			}

			try {
				await prisma.user.delete({
					where: { clerkId: lead.userId },
				});
			} catch (err) {
				console.error("Error deleting user from User table:", err);
			}
		}

		await prisma.lead.delete({
			where: { id },
		});
		
		return NextResponse.json({
			message: "Lead deleted successfully",
		});
	} catch (error: any) {
		console.error("Error deleting lead:", error);
		return NextResponse.json(
			{ error: "Failed to delete lead", details: error.message },
			{ status: 500 }
		);
	}
}
