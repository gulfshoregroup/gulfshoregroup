import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-crypto";
import { cookies } from "next/headers";
import { sendSMS } from "@/lib/twilio";
import { sendAdminLeadAlertEmail } from "@/lib/email/admin-lead-alert";
import { sendWelcomeEmail } from "@/lib/email/welcome-email";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { firstName, lastName, email, phone, password } = body;

		if (!email) {
			return NextResponse.json(
				{ success: false, error: "Email is required" },
				{ status: 400 }
			);
		}

		if (!password || password.length < 8) {
			return NextResponse.json(
				{ success: false, error: "Password must be at least 8 characters long" },
				{ status: 400 }
			);
		}

		const normalizedEmail = email.toLowerCase().trim();

		// 1. Check if user already exists
		const existingUser = await prisma.user.findFirst({
			where: { email: normalizedEmail },
		});

		if (existingUser) {
			return NextResponse.json(
				{ success: false, error: "An account with this email already exists." },
				{ status: 400 }
			);
		}

		// 2. Hash the password
		const pwdHash = hashPassword(password);

		// 3. Generate a unique clerkId (simulating Clerk userId format)
		const clerkId = `user_${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`;

		// 4. Create User record
		const user = await prisma.user.create({
			data: {
				clerkId,
				email: normalizedEmail,
				firstName: firstName || "",
				lastName: lastName || "",
				name: `${firstName || ""} ${lastName || ""}`.trim(),
				metadata: { passwordHash: pwdHash },
			},
		});

		// 5. Create or update Lead record
		const lead = await prisma.lead.upsert({
			where: { email: normalizedEmail },
			update: {
				userId: clerkId,
				firstName: firstName || "",
				lastName: lastName || "",
				phone: phone || null,
				lastContactedAt: new Date(),
			},
			create: {
				userId: clerkId,
				firstName: firstName || "",
				lastName: lastName || "",
				email: normalizedEmail,
				phone: phone || null,
				source: "Signup",
				status: "New",
				lastContactedAt: new Date(),
			},
		});

		// 6. Set session cookies
		const cookieStore = await cookies();
		cookieStore.set("mock_signed_in", "true", { path: "/", maxAge: 31536000, httpOnly: false });
		cookieStore.set("mock_user_email", normalizedEmail, { path: "/", maxAge: 31536000 });
		cookieStore.set("mock_user_id", clerkId, { path: "/", maxAge: 31536000 });

		const mappedLead = {
			...lead,
			_id: lead.id,
		};

		// 7. Fire SMS & Email Notifications asynchronously
		(async () => {
			try {
				if (phone) {
					await sendSMS(
						phone,
						`Welcome to Gulfshore Group! Your VIP MLS account is active. Discover luxury Florida real estate today at https://gulfshoregroup.com`
					);
				}
			} catch (err) {
				console.error("Signup SMS trigger failed:", err);
			}

			try {
				await sendAdminLeadAlertEmail({
					action: "signup",
					leadName: `${firstName || ""} ${lastName || ""}`.trim() || "New VIP User",
					leadEmail: normalizedEmail,
					timestamp: new Date(),
					message: `New VIP Modal signup via portal (${phone || "No phone"})`,
				});
			} catch (err) {
				console.error("Signup Admin Email trigger failed:", err);
			}

			try {
				await sendWelcomeEmail({
					to: normalizedEmail,
					recipientName: firstName || "VIP Client",
				});
			} catch (err) {
				console.error("Signup User Welcome Email trigger failed:", err);
			}
		})();

		return NextResponse.json({
			success: true,
			lead: mappedLead,
			user: {
				id: user.id,
				clerkId: user.clerkId,
				email: user.email,
			},
		});
	} catch (err: any) {
		console.error("Signup API error:", err);
		return NextResponse.json(
			{ success: false, error: err.message || "Error creating user account" },
			{ status: 500 }
		);
	}
}
