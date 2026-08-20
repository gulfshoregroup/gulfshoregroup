import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
	try {
		// Fetch Home Valuation contact requests and seller leads
		const [valuationRequests, sellerLeads] = await Promise.all([
			prisma.contactRequest.findMany({
				where: { refType: "Home_Valuation" },
				orderBy: { createdAt: "desc" },
			}),
			prisma.lead.findMany({
				where: {
					OR: [
						{ source: "Home_Valuation" },
						{ tags: { path: "$", array_contains: "Seller" } },
					],
				},
				include: { inquiryHistory: true },
				orderBy: { createdAt: "desc" },
			}),
		]);

		const contactRequestEmails = new Set(
			valuationRequests.map((r) => r.email.toLowerCase().trim())
		);

		const formattedValuations: any[] = [];

		// 1. Add Valuation Contact Requests
		valuationRequests.forEach((req) => {
			formattedValuations.push({
				id: req.id,
				propertyAddress: req.ref && req.ref !== "null" && req.ref !== "N/A" ? req.ref : "Address Provided In Details",
				sellerName: req.name || "Unknown Seller",
				sellerEmail: req.email,
				sellerPhone: req.phone || "",
				status: req.status || "New Request",
				message: req.message || "Home Valuation Estimate Request",
				createdAt: new Date(req.createdAt).toLocaleDateString("en-US", { timeZone: "America/New_York" }),
			});
		});

		// 2. Add Seller Leads not already included in Contact Requests
		sellerLeads.forEach((lead) => {
			const cleanEmail = lead.email.toLowerCase().trim();
			if (!contactRequestEmails.has(cleanEmail)) {
				const valuationInquiry = lead.inquiryHistory.find(
					(i) => i.type === "Home_Valuation"
				);

				let propAddr = "Home Valuation Requested";
				let msgText = valuationInquiry?.message || "Home Valuation Request submitted";

				if (valuationInquiry?.message) {
					if (valuationInquiry.message.includes("Property Address: ")) {
						propAddr = valuationInquiry.message.split("Property Address: ")[1]?.split("\n")[0] || propAddr;
					}
				}

				formattedValuations.push({
					id: lead.id,
					propertyAddress: propAddr,
					sellerName: lead.fullName || `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Unknown Seller",
					sellerEmail: lead.email,
					sellerPhone: lead.phone || "",
					status: lead.status === "New" ? "New Request" : lead.status || "New Request",
					message: msgText,
					createdAt: new Date(lead.createdAt).toLocaleDateString("en-US", { timeZone: "America/New_York" }),
				});
			}
		});

		return NextResponse.json({ success: true, valuations: formattedValuations });
	} catch (error: any) {
		console.error("Error fetching admin home valuations:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}

