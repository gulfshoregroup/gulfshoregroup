import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { sendSMS } from "@/lib/twilio";
import { sendAdminLeadAlertEmail } from "@/lib/email/admin-lead-alert";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { phone, email, fullName, firstName, lastName } = body;

		const cookieStore = await cookies();
		const cookieUserId = cookieStore.get("mock_user_id")?.value;
		const cookieEmail = cookieStore.get("mock_user_email")?.value;

		const targetEmail = (email || cookieEmail)?.toLowerCase()?.trim();

		if (!targetEmail) {
			return NextResponse.json(
				{ error: "Email is required to identify user" },
				{ status: 400 }
			);
		}

		if (!phone) {
			return NextResponse.json(
				{ error: "Phone number is required" },
				{ status: 400 }
			);
		}

		const cleanPhone = phone.replace(/\D/g, "");
		if (cleanPhone.length < 10) {
			return NextResponse.json(
				{ error: "Please enter a valid phone number (at least 10 digits)" },
				{ status: 400 }
			);
		}

		// Find existing lead and user
		let existingLead = await prisma.lead.findFirst({
			where: { email: targetEmail },
		});

		let existingUser = await prisma.user.findFirst({
			where: { email: targetEmail },
		});

		const resolvedClerkId =
			existingUser?.clerkId ||
			existingLead?.userId ||
			cookieUserId ||
			`user_${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`;

		const resolvedFirstName =
			firstName || existingLead?.firstName || existingUser?.firstName || "";
		const resolvedLastName =
			lastName || existingLead?.lastName || existingUser?.lastName || "";
		const resolvedFullName =
			fullName ||
			existingLead?.fullName ||
			existingUser?.name ||
			`${resolvedFirstName} ${resolvedLastName}`.trim() ||
			targetEmail.split("@")[0];

		let hadPhoneAlready = false;

		// 1. Update or Create User
		if (!existingUser) {
			existingUser = await prisma.user.create({
				data: {
					clerkId: resolvedClerkId,
					email: targetEmail,
					firstName: resolvedFirstName,
					lastName: resolvedLastName,
					name: resolvedFullName,
					metadata: { googleSignIn: true, phone },
				},
			});
		} else {
			await prisma.user.update({
				where: { id: existingUser.id },
				data: {
					metadata: {
						...((existingUser.metadata as any) || {}),
						phone,
					},
				},
			});
		}

		// 2. Update or Create Lead
		if (existingLead) {
			if (existingLead.phone && existingLead.phone.trim().length >= 10) {
				hadPhoneAlready = true;
			}
			existingLead = await prisma.lead.update({
				where: { id: existingLead.id },
				data: {
					phone,
					userId: existingLead.userId || resolvedClerkId,
					fullName: resolvedFullName,
					lastContactedAt: new Date(),
				},
			});
		} else {
			existingLead = await prisma.lead.create({
				data: {
					userId: resolvedClerkId,
					firstName: resolvedFirstName,
					lastName: resolvedLastName,
					fullName: resolvedFullName,
					email: targetEmail,
					phone,
					source: "Signup",
					status: "New",
					lastContactedAt: new Date(),
				},
			});
		}

		// 3. Set persistent cookies
		cookieStore.set("mock_signed_in", "true", { path: "/", maxAge: 31536000, httpOnly: false });
		cookieStore.set("mock_user_email", targetEmail, { path: "/", maxAge: 31536000 });
		cookieStore.set("mock_user_id", resolvedClerkId, { path: "/", maxAge: 31536000 });
		cookieStore.set("mock_user_phone", phone, { path: "/", maxAge: 31536000 });
		cookieStore.set("mock_auth_provider", "google", { path: "/", maxAge: 31536000 });

		// 4. Fire Welcome SMS ONLY IF they didn't have a phone before
		if (!hadPhoneAlready) {
			try {
				await sendSMS(
					phone,
					`Welcome to Gulfshore Group! Your VIP MLS account is active. Discover luxury Florida real estate today at https://gulfshoregroup.com`
				);
				console.log(`[update-phone] Sent Welcome SMS to newly updated phone: ${phone}`);
			} catch (smsError) {
				console.error("[update-phone] Failed to send welcome SMS:", smsError);
			}

			try {
				await sendAdminLeadAlertEmail({
					action: "signup",
					leadName: resolvedFullName,
					leadEmail: targetEmail,
					timestamp: new Date(),
					message: `Verified lead phone captured: ${resolvedFullName} (${targetEmail}) Phone: ${phone}`,
				});
			} catch (emailErr) {
				console.error("[update-phone] Admin lead email alert failed:", emailErr);
			}
		}

		return NextResponse.json({ success: true, phone });
	} catch (error: any) {
		console.error("Error updating phone:", error);
		return NextResponse.json(
			{ error: "Failed to update phone number", details: error.message },
			{ status: 500 }
		);
	}
}
