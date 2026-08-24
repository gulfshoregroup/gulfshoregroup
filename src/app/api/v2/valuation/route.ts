import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
	try {
		let userId: string | null = null;
		try {
			const authSession = await auth();
			userId = authSession.userId;
		} catch (authErr) {
			console.log("Not logged in or Clerk auth skipped:", authErr);
		}

		const body = await req.json();
		const {
			firstName,
			lastName,
			email,
			phone,
			address,
			city,
			state,
			zip,
			beds,
			baths,
			sqft,
			yearBuilt,
			garage,
			pool,
			hoa,
			waterfront,
			lotSize,
			renovations,
			timeline,
			images = [],
			comments = "",
		} = body;

		if (!email || typeof email !== "string" || !email.includes("@")) {
			return NextResponse.json(
				{ success: false, error: "Valid email address is required" },
				{ status: 400 }
			);
		}

		const cleanEmail = email.toLowerCase().trim();
		const cleanFirstName = firstName?.trim() || "";
		const cleanLastName = lastName?.trim() || "";
		const cleanPhone = phone || null;

		// 1. Fetch existing lead to preserve any existing tags
		const existingLead = await prisma.lead.findUnique({
			where: { email: cleanEmail },
			select: { id: true, tags: true },
		});

		let mergedTags: string[] = ["Seller"];
		if (existingLead && existingLead.tags) {
			try {
				const currentTags = typeof existingLead.tags === "string"
					? JSON.parse(existingLead.tags)
					: (existingLead.tags as string[]);
				if (Array.isArray(currentTags)) {
					mergedTags = Array.from(new Set([...currentTags, "Seller"]));
				}
			} catch (e) {
				console.error("Error parsing existing lead tags:", e);
			}
		}

		// 2. Upsert Lead in MySQL
		const lead = await prisma.lead.upsert({
			where: { email: cleanEmail },
			update: {
				firstName: cleanFirstName || undefined,
				lastName: cleanLastName || undefined,
				phone: cleanPhone || undefined,
				tags: mergedTags,
			},
			create: {
				firstName: cleanFirstName,
				lastName: cleanLastName,
				email: cleanEmail,
				phone: cleanPhone,
				source: "Home_Valuation",
				status: "New",
				tags: mergedTags,
			},
		});

		// 3. Format detailed message for CRM
		const formattedAddress = `${address || ""}, ${city || ""}, ${state || ""} ${zip || ""}`.trim();
		const message = `Home Valuation Request Details:
------------------------------------------
Property Address: ${formattedAddress}
Bedrooms: ${beds || "N/A"}
Bathrooms: ${baths || "N/A"}
Living Area: ${sqft ? Number(sqft).toLocaleString() + " SqFt" : "N/A"}
Year Built: ${yearBuilt || "N/A"}
Timeline: ${timeline || "Just Curious"}
Garage: ${garage || "N/A"}
Pool: ${pool || "N/A"}
HOA: ${hoa || "N/A"}
Waterfront: ${waterfront || "N/A"}
Lot Size: ${lotSize || "N/A"}
Recent Renovations: ${renovations || "None"}
Additional Comments: ${comments || "None"}
Photos Uploaded: ${images.length > 0 ? images.join(", ") : "No photos uploaded."}`;

		// 4. Create Inquiry linked to the Lead (using standard Prisma transaction for safety)
		const inquiry = await prisma.inquiry.create({
			data: {
				leadId: lead.id,
				type: "Home_Valuation",
				message: message,
			},
		});

		// 5. Create ContactRequest for Admin Notifications List
		const contactReq = await prisma.contactRequest.create({
			data: {
				user: userId || "",
				name: `${cleanFirstName} ${cleanLastName}`.trim() || "Seller Lead",
				email: cleanEmail,
				phone: cleanPhone,
				message: message,
				status: "New Request",
				ref: "/sell",
				refType: "Seller-Valuation",
			},
		});

		// 6. Send Email Notifications via Resend
		const resendApiKey = process.env.RESEND_API_KEY;
		const fromEmail = process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@gulfshoregroup.com>";
		const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_ALERT_EMAIL || "mailbox@gulfshoregroup.com";
		const resolvedName = `${cleanFirstName} ${cleanLastName}`.trim() || "Valued Client";

		if (resendApiKey) {
			try {
				const { Resend } = await import("resend");
				const resendClient = new Resend(resendApiKey);

				// 6a. User Confirmation Email
				if (cleanEmail) {
					try {
						await resendClient.emails.send({
							from: fromEmail,
							to: [cleanEmail],
							subject: `Home Valuation Request Received - Gulfshore Group`,
							html: `
								<div style="font-family: Arial, sans-serif; padding: 20px;">
									<h2>Home Valuation Request Received</h2>
									<p>Dear ${resolvedName},</p>
									<p>Thank you for reaching out! We have successfully received your request for a home valuation for your property at <strong>${formattedAddress}</strong>.</p>
									<p>Our expert agents are currently reviewing your property details and will be in touch with a comprehensive market analysis shortly.</p>
								</div>
							`,
						});
					} catch (userErr) {
						console.error("[Valuation API] User email failed:", userErr);
					}
				}

				// 6b. Admin Notification Email
				if (adminEmail) {
					try {
						await resendClient.emails.send({
							from: fromEmail,
							to: [adminEmail],
							subject: `[New Seller Lead] Home Valuation Request from ${resolvedName}`,
							html: `
								<div style="font-family: Arial, sans-serif; padding: 20px;">
									<h2>New Home Valuation Request (Seller Lead)</h2>
									<p><strong>Name:</strong> ${resolvedName}</p>
									<p><strong>Email:</strong> ${cleanEmail}</p>
									<p><strong>Phone:</strong> ${cleanPhone || "Not provided"}</p>
									<hr/>
									<p style="white-space: pre-wrap;">${message}</p>
								</div>
							`,
						});
					} catch (adminErr) {
						console.error("[Valuation API] Admin email failed:", adminErr);
					}
				}
			} catch (emailInitErr) {
				console.error("[Valuation API] Email service error:", emailInitErr);
			}
		}

		return NextResponse.json({
			success: true,
			leadId: lead.id,
			inquiryId: inquiry.id,
			contactRequestId: contactReq.id,
		});
	} catch (err: any) {
		console.error("Error saving valuation request:", err);
		return NextResponse.json(
			{ success: false, error: err.message || "Failed to process valuation request" },
			{ status: 500 }
		);
	}
}
