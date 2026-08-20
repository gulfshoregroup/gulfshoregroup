import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-crypto";
import { cookies } from "next/headers";
import { sendAdminLeadAlertEmail } from "@/lib/email/admin-lead-alert";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { credential, access_token } = body;

		if (!credential && !access_token) {
			return NextResponse.json(
				{ success: false, error: "Google credential or access token is required" },
				{ status: 400 }
			);
		}

		let payload: any = {};

		if (credential) {
			// Verify the Google ID token
			const googleVerificationUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
			const verifyResponse = await fetch(googleVerificationUrl);
			payload = await verifyResponse.json();
		} else if (access_token) {
			// Fetch user info using access token
			const userInfoUrl = `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`;
			const userInfoResponse = await fetch(userInfoUrl);
			payload = await userInfoResponse.json();
		}

		if (payload.error || !payload.email) {
			return NextResponse.json(
				{ success: false, error: "Invalid Google token" },
				{ status: 401 }
			);
		}

		// Ensure the ID token was issued for our Google Client ID (only applicable for credential)
		if (credential) {
			const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
			if (clientId && payload.aud !== clientId) {
				return NextResponse.json(
					{ success: false, error: "Google token audience mismatch" },
					{ status: 401 }
				);
			}
		}

		const normalizedEmail = payload.email.toLowerCase().trim();
		const firstName = payload.given_name || "";
		const lastName = payload.family_name || "";
		const emailVerified = payload.email_verified === "true" || payload.email_verified === true;

		// 1. Check if user already exists
		let user = await prisma.user.findFirst({
			where: { email: normalizedEmail },
		});

		let clerkId = user?.clerkId;

		if (!user) {
			// Generate a random strong password for Google users
			const randomPwd = Math.random().toString(36).slice(-10) + Date.now().toString(36);
			const pwdHash = hashPassword(randomPwd);

			// 3. Generate a unique clerkId
			clerkId = `user_${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`;

			// 4. Create User record
			user = await prisma.user.create({
				data: {
					clerkId,
					email: normalizedEmail,
					firstName,
					lastName,
					name: `${firstName} ${lastName}`.trim(),
					metadata: { passwordHash: pwdHash, googleSignIn: true, emailVerified },
				},
			});

			// 5. Create or update Lead record
			await prisma.lead.upsert({
				where: { email: normalizedEmail },
				update: {
					userId: clerkId,
					firstName,
					lastName,
					lastContactedAt: new Date(),
				},
				create: {
					userId: clerkId,
					firstName,
					lastName,
					email: normalizedEmail,
					source: "Signup",
					status: "New",
					lastContactedAt: new Date(),
				},
			});

			// Fire Admin Notification
			(async () => {
				try {
					await sendAdminLeadAlertEmail({
						action: "signup",
						leadName: `${firstName} ${lastName}`.trim() || "New Google Auth User",
						leadEmail: normalizedEmail,
						timestamp: new Date(),
						message: `New user signed up via Continue with Google.`,
					});
				} catch (err) {
					console.error("Signup Admin Email trigger failed:", err);
				}
			})();
		}

		// 6. Set session cookies
		const cookieStore = await cookies();
		cookieStore.set("mock_signed_in", "true", { path: "/", maxAge: 31536000, httpOnly: false });
		cookieStore.set("mock_user_email", normalizedEmail, { path: "/", maxAge: 31536000 });
		if (clerkId) {
			cookieStore.set("mock_user_id", clerkId, { path: "/", maxAge: 31536000 });
		}

		return NextResponse.json({
			success: true,
			user: {
				id: user.id,
				clerkId: user.clerkId,
				email: user.email,
				name: user.name,
			},
		});
	} catch (err: any) {
		console.error("Google Auth API error:", err);
		return NextResponse.json(
			{ success: false, error: err.message || "Error during Google authentication" },
			{ status: 500 }
		);
	}
}
