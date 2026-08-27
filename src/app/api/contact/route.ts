import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
	try {
		const { userId } = await auth();

		const body = await request.json();
		const {
			name,
			firstName,
			lastName,
			email,
			message,
			phone,
			ref,
			refType,
			userRole = "Buyer",
			propertyAddress,
			MLSNumber,
		} = body;

		const resolvedName =
			name || `${firstName || ""} ${lastName || ""}`.trim() || "Unknown User";
		const resolvedFirstName = firstName || name?.split(" ")[0] || "";
		const resolvedLastName =
			lastName || name?.split(" ").slice(1).join(" ") || "";
		const resolvedRefType =
			userRole === "Seller"
				? "Seller-Inquiry"
				: userRole === "Buyer"
				? "Buyer-Inquiry"
				: refType || "Contact-Form";
		const tagToApply = userRole === "Seller" ? "Seller" : "Buyer";

		// Deduplicate: check if identical request (same email & message) was submitted within the last 5 minutes
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		const existingRecentReq = await prisma.contactRequest.findFirst({
			where: {
				email,
				message: message || "",
				createdAt: { gte: fiveMinutesAgo },
			},
		});

		if (existingRecentReq) {
			return NextResponse.json({
				message:
					"We’re already processing your earlier request. We’ll update you soon.",
				success: true,
				data: existingRecentReq,
			});
		}

		// 1. Fetch existing lead to preserve tags
		const existingLead = await prisma.lead.findUnique({
			where: { email },
			select: { id: true, tags: true },
		});

		let mergedTags: string[] = [tagToApply];
		if (existingLead && existingLead.tags) {
			try {
				const currentTags =
					typeof existingLead.tags === "string"
						? JSON.parse(existingLead.tags)
						: (existingLead.tags as string[]);
				if (Array.isArray(currentTags)) {
					mergedTags = Array.from(new Set([...currentTags, tagToApply]));
				}
			} catch (e) {
				console.error("Error parsing tags:", e);
			}
		}

		// 2. Create or update Lead in SQL
		const lead = await prisma.lead.upsert({
			where: { email },
			update: {
				firstName: resolvedFirstName,
				lastName: resolvedLastName,
				phone: phone || undefined,
				tags: mergedTags,
			},
			create: {
				firstName: resolvedFirstName,
				lastName: resolvedLastName,
				email,
				phone: phone || undefined,
				status: "New",
				source: "Contact_Form",
				tags: mergedTags,
			},
		});

		// Map to valid Prisma InquiryType enum (Contact_Form, Tour_Request, General, Home_Valuation)
		let inquiryTypeEnum:
			| "Contact_Form"
			| "Tour_Request"
			| "General"
			| "Home_Valuation" = "Contact_Form";
		if (userRole === "Seller" || refType === "Home_Valuation") {
			inquiryTypeEnum = "Home_Valuation";
		} else if (refType === "Tour_Request") {
			inquiryTypeEnum = "Tour_Request";
		} else {
			inquiryTypeEnum = "Contact_Form";
		}

		// 3. Create Inquiry in SQL linked to the Lead
		await prisma.inquiry.create({
			data: {
				leadId: lead.id,
				type: inquiryTypeEnum,
				message: message || "",
			},
		});

		// 4. Create ContactRequest in SQL
		const newReq = await prisma.contactRequest.create({
			data: {
				user: userId || "",
				name: resolvedName,
				email,
				message: message || "",
				phone,
				status: "New Request",
				ref,
				refType: resolvedRefType,
			},
		});

		// 5. Send Email Notifications via Resend
		const resendApiKey = process.env.RESEND_API_KEY;
		const fromEmail =
			process.env.FROM_EMAIL ||
			process.env.RESEND_FROM_EMAIL ||
			"Gulfshore Group <noreply@gulfshoregroup.com>";
		const adminEmail =
			process.env.ADMIN_EMAIL ||
			process.env.ADMIN_ALERT_EMAIL ||
			"mailbox@gulfshoregroup.com";

		if (resendApiKey) {
			try {
				const { Resend } = await import("resend");
				const resendClient = new Resend(resendApiKey);

				// 5a. User Confirmation Email
				if (email) {
					try {
						await resendClient.emails.send({
							from: fromEmail,
							to: [email],
							subject: `Thank you for reaching out to Gulfshore Group, ${resolvedFirstName || resolvedName}!`,
							html: `
								<div style="background-color: #F4F4F5; margin: 0; padding: 40px 0; font-family: 'Poppins', Arial, sans-serif;">
									<div style="max-width: 640px; margin: 0 auto; background-color: #FFFFFF; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
										<div style="background: #1A0A0A; padding: 40px 40px; text-align: center; border-bottom: 3px solid #C9A96E;">
											<p style="font-size: 24px; letter-spacing: 0.2em; text-transform: uppercase; color: #FFFFFF; margin: 0 0 4px; font-weight: 400; margin-top:0;">GULFSHORE</p>
											<p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #C9A96E; margin: 0; font-weight: 600;">Real Estate Group</p>
										</div>
										<div style="padding: 48px 40px; text-align: center;">
											<h1 style="font-size: 22px; font-weight: 400; color: #1A0A0A; margin: 0 0 12px; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.05em;">Inquiry Received</h1>
											<p style="font-size: 14px; color: #666666; margin: 0 0 24px;">Thank you for reaching out to us.</p>
											<div style="margin: 0 auto 24px; max-width: 60px; border-top: 1px solid #C9A96E;"></div>
											
											<div style="text-align: left; font-size: 15px; color: #1A0A0A; line-height: 1.6;">
												<p>Dear ${resolvedFirstName || resolvedName},</p>
												<p>We have successfully received your message and our team will get back to you shortly.</p>
												<p style="margin-bottom: 32px;">For immediate assistance, please feel free to reply to this email or call us directly.</p>
											</div>
											
											<div style="background-color: #FAF7F2; padding: 24px; border: 1px solid #E8DDD8; border-radius: 4px; text-align: left;">
												<h3 style="font-size: 13px; color: #666666; margin-top: 0; text-transform: uppercase; letter-spacing: 0.1em;">Your Message</h3>
												<p style="font-size: 14px; color: #1A0A0A; margin-bottom: 0;"><em>"${message || 'No additional message provided.'}"</em></p>
											</div>
										</div>
									</div>
								</div>
							`,
						});
					} catch (userEmailErr) {
						console.error("[Contact API] User confirmation email failed:", userEmailErr);
					}
				}

				// 5b. Admin Notification Email
				try {
					const { sendAdminLeadAlertEmail } = await import("@/lib/email/admin-lead-alert");
					await sendAdminLeadAlertEmail({
						action: "inquiry",
						leadName: resolvedName,
						leadEmail: email,
						timestamp: new Date(),
						message: message || "No message content provided.",
						property: propertyAddress ? {
							FullAddress: propertyAddress,
							MLSNumber: MLSNumber || "N/A",
							ListPrice: 0 // ListPrice is unknown in this route
						} as any : undefined,
						filters: {
							role: userRole,
							phone: phone || "Not provided",
							sourcePage: ref || "Unknown"
						}
					});
				} catch (adminEmailErr) {
					console.error("[Contact API] Admin notification email failed:", adminEmailErr);
				}
			} catch (emailInitErr) {
				console.error("[Contact API] Email service error:", emailInitErr);
			}
		} else {
			console.warn("[Contact API] RESEND_API_KEY environment variable is not configured. Email skipped.");
		}

		return NextResponse.json({ success: true, data: newReq });
	} catch (error: any) {
		console.error("Error saving contact request:", error);
		return NextResponse.json(
			{ error: error.message },
			{ status: 500 }
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const skip = (page - 1) * limit;

		const [requests, totalRequests] = await Promise.all([
			prisma.contactRequest.findMany({
				orderBy: {
					createdAt: "desc",
				},
				skip,
				take: limit,
			}),
			prisma.contactRequest.count(),
		]);

		// Map to match Mongoose shape
		const mappedRequests = requests.map((r) => ({
			...r,
			_id: r.id,
		}));

		const totalPages = Math.ceil(totalRequests / limit);

		const res = {
			totalRequests,
			requests: mappedRequests,
			page,
			totalPages,
		};

		return NextResponse.json({ success: true, data: res });
	} catch (error: any) {
		console.error("Error fetching contact requests:", error);
		return NextResponse.json(
			{ success: false, error: "Internal Server Error", details: error.message },
			{ status: 500 }
		);
	}
}
