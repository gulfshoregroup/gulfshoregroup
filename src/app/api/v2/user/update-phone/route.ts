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

		// Determine candidate user ID, verifying that it is NOT in use by any other lead or a guest ID
		let candidateUserId: string | null = null;

		if (existingLead?.userId) {
			candidateUserId = existingLead.userId;
		} else if (existingUser?.clerkId) {
			const isLeadTaken = await prisma.lead.findFirst({
				where: {
					userId: existingUser.clerkId,
					...(existingLead ? { id: { not: (existingLead as any).id } } : {}),
				},
			});
			if (!isLeadTaken) {
				candidateUserId = existingUser.clerkId;
			}
		} else if (cookieUserId && cookieUserId !== "guest-user-id") {
			const isLeadTaken = await prisma.lead.findFirst({
				where: {
					userId: cookieUserId,
					...(existingLead ? { id: { not: (existingLead as any).id } } : {}),
				},
			});
			if (!isLeadTaken) {
				candidateUserId = cookieUserId;
			}
		}

		// If no valid unique candidateUserId, generate a guaranteed unique ID
		if (!candidateUserId) {
			candidateUserId = `user_${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36)}`;
		}

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
			// Ensure candidateUserId isn't colliding in User table either
			const userTaken = await prisma.user.findFirst({
				where: { clerkId: candidateUserId },
			});
			const userClerkId = userTaken
				? `user_${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36)}`
				: candidateUserId;

			existingUser = await prisma.user.create({
				data: {
					clerkId: userClerkId,
					email: targetEmail,
					firstName: resolvedFirstName,
					lastName: resolvedLastName,
					name: resolvedFullName,
					metadata: { googleSignIn: true, phone },
				},
			});
			candidateUserId = userClerkId;
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

		// 2. Update or Create Lead safely
		if (existingLead) {
			if (existingLead.phone && existingLead.phone.trim().length >= 10) {
				hadPhoneAlready = true;
			}

			// If existingLead doesn't have a userId, assign candidateUserId (verifying uniqueness)
			let updateUserId = existingLead.userId;
			if (!updateUserId) {
				const isTaken = await prisma.lead.findFirst({
					where: { userId: candidateUserId, id: { not: existingLead.id } },
				});
				updateUserId = isTaken
					? `user_${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36)}`
					: candidateUserId;
			}

			existingLead = await prisma.lead.update({
				where: { id: existingLead.id },
				data: {
					phone,
					userId: updateUserId,
					fullName: resolvedFullName,
					lastContactedAt: new Date(),
				},
			});
			candidateUserId = updateUserId;
		} else {
			// Double check if lead already exists by email before creating
			const checkLead = await prisma.lead.findFirst({
				where: { email: targetEmail },
			});

			if (checkLead) {
				if (checkLead.phone && checkLead.phone.trim().length >= 10) {
					hadPhoneAlready = true;
				}
				existingLead = await prisma.lead.update({
					where: { id: checkLead.id },
					data: {
						phone,
						fullName: resolvedFullName,
						lastContactedAt: new Date(),
					},
				});
				if (checkLead.userId) {
					candidateUserId = checkLead.userId;
				}
			} else {
				// Final check: ensure candidateUserId is NOT taken by any lead
				const leadUserIdTaken = await prisma.lead.findFirst({
					where: { userId: candidateUserId },
				});
				if (leadUserIdTaken) {
					candidateUserId = `user_${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36)}`;
				}

				try {
					existingLead = await prisma.lead.create({
						data: {
							userId: candidateUserId,
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
				} catch (createErr: any) {
					// Fallback handler if concurrent requests or race condition triggered unique constraint
					if (createErr.code === "P2002" || createErr.message?.includes("Unique constraint")) {
						const retryLead = await prisma.lead.findFirst({
							where: { email: targetEmail },
						});
						if (retryLead) {
							existingLead = await prisma.lead.update({
								where: { id: retryLead.id },
								data: {
									phone,
									fullName: resolvedFullName,
									lastContactedAt: new Date(),
								},
							});
						} else {
							// Collision was on userId, generate a guaranteed fresh unique one
							candidateUserId = `user_${Math.random().toString(36).substring(2, 9)}${Date.now().toString(36)}`;
							existingLead = await prisma.lead.create({
								data: {
									userId: candidateUserId,
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
					} else {
						throw createErr;
					}
				}
			}
		}

		// 3. Set persistent cookies
		cookieStore.set("mock_signed_in", "true", { path: "/", maxAge: 31536000, httpOnly: false });
		cookieStore.set("mock_user_email", targetEmail, { path: "/", maxAge: 31536000 });
		cookieStore.set("mock_user_id", candidateUserId, { path: "/", maxAge: 31536000 });
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
