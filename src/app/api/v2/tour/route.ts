import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const {
			firstName,
			lastName,
			email,
			phone,
			message,
			propertyAddress,
			MLSNumber,
			date,
			propertyId,
		} = body;

		if (!email || !phone)
			return NextResponse.json(
				{ success: false, error: "Missing required fields" },
				{ status: 400 }
			);

		const resolvedName = `${firstName || ""} ${lastName || ""}`.trim() || "Unknown User";
		const resolvedFirstName = firstName || "";
		const resolvedLastName = lastName || "";

		// 1. Create or update Lead in SQL
		const sqlLead = await prisma.lead.upsert({
			where: { email },
			update: {
				firstName: resolvedFirstName || undefined,
				lastName: resolvedLastName || undefined,
				fullName: resolvedName,
				phone: phone || undefined,
			},
			create: {
				firstName: resolvedFirstName,
				lastName: resolvedLastName,
				fullName: resolvedName,
				email,
				phone: phone || undefined,
				status: "New",
				source: "Tour_Request",
			},
		});


		const targetPropertyId = propertyId || MLSNumber || "";
		const formattedMessage = message || (propertyAddress ? `Scheduled a tour for property ${propertyAddress}` : "");

		// 2. Create Inquiry in SQL linked to the Lead
		await prisma.inquiry.create({
			data: {
				leadId: sqlLead.id,
				type: "Tour_Request",
				message: formattedMessage,
				propertyId: targetPropertyId || undefined,
			},
		});

		let parsedDate = new Date();
		if (date) {
			const d = new Date(date);
			if (!isNaN(d.getTime())) {
				parsedDate = d;
			}
		}

		// 3. Create ScheduleTour in SQL
		const sqlTour = await prisma.scheduleTour.create({
			data: {
				email,
				name: resolvedName,
				date: parsedDate,
				phone,
				message: formattedMessage,
				status: "Pending",
				propertyId: targetPropertyId,
			},
		});

		// 4. Send Email Notifications via Resend
		const resendApiKey = process.env.RESEND_API_KEY;
		const fromEmail = process.env.FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@gulfshoregroup.com>";
		const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_ALERT_EMAIL || "mailbox@gulfshoregroup.com";

		if (resendApiKey) {
			try {
				const { Resend } = await import("resend");
				const resendClient = new Resend(resendApiKey);

				// 4a. User Confirmation Email
				if (email) {
					try {
						await resendClient.emails.send({
							from: fromEmail,
							to: [email],
							subject: `Tour Request Received - Gulfshore Group`,
							html: `
								<div style="font-family: Arial, sans-serif; padding: 20px;">
									<h2>Tour Request Received</h2>
									<p>Dear ${resolvedName},</p>
									<p>Thank you for your interest! We have received your request to tour the property${propertyAddress ? ` at ${propertyAddress}` : ""}.</p>
									<p>Our team will contact you shortly to confirm the exact date and time.</p>
								</div>
							`,
						});
					} catch (userErr) {
						console.error("[Tour API] User email failed:", userErr);
					}
				}

				// 4b. Admin Notification Email
				if (adminEmail) {
					try {
						await resendClient.emails.send({
							from: fromEmail,
							to: [adminEmail],
							subject: `[New Tour Request] Property Tour from ${resolvedName}`,
							html: `
								<div style="font-family: Arial, sans-serif; padding: 20px;">
									<h2>New Property Tour Request</h2>
									<p><strong>Name:</strong> ${resolvedName}</p>
									<p><strong>Email:</strong> ${email}</p>
									<p><strong>Phone:</strong> ${phone || "Not provided"}</p>
									<p><strong>Property:</strong> ${propertyAddress || propertyId || "Not specified"}</p>
									<p><strong>Requested Date:</strong> ${parsedDate.toLocaleString()}</p>
									<p><strong>Message:</strong> ${message || "No message"}</p>
								</div>
							`,
						});
					} catch (adminErr) {
						console.error("[Tour API] Admin email failed:", adminErr);
					}
				}
			} catch (emailInitErr) {
				console.error("[Tour API] Email service error:", emailInitErr);
			}
		}

		return NextResponse.json({ success: true, lead: sqlLead, tour: sqlTour });
	} catch (err: any) {
		console.error(err);
		return NextResponse.json(
			{ success: false, error: err.message },
			{ status: 500 }
		);
	}
}
