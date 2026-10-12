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

		// 1. Check if user or lead already exists
		const existingUser = await prisma.user.findFirst({
			where: { email: normalizedEmail },
		});
		const existingLead = await prisma.lead.findFirst({
			where: { email: normalizedEmail },
		});

		const userPhone = existingLead?.phone || (existingUser?.metadata as any)?.phone;
		const hasValidPhone = Boolean(
			userPhone && userPhone.replace(/\D/g, "").length >= 10
		);

		const clerkId =
			existingUser?.clerkId ||
			existingLead?.userId ||
			`user_${Math.random().toString(36).substr(2, 9)}${Date.now().toString(36)}`;

		const cookieStore = await cookies();
		cookieStore.set("mock_signed_in", "true", { path: "/", maxAge: 31536000, httpOnly: false });
		cookieStore.set("mock_user_email", normalizedEmail, { path: "/", maxAge: 31536000 });
		cookieStore.set("mock_user_id", clerkId, { path: "/", maxAge: 31536000 });
		cookieStore.set("mock_auth_provider", "google", { path: "/", maxAge: 31536000 });

		if (hasValidPhone) {
			// Existing user who ALREADY has a phone number in DB
			cookieStore.set("mock_user_phone", userPhone, { path: "/", maxAge: 31536000 });

			return NextResponse.json({
				success: true,
				isNewUser: false,
				needsPhone: false,
				hasPhone: true,
				user: {
					id: existingUser?.id || existingLead?.id,
					clerkId,
					email: normalizedEmail,
					name: existingUser?.name || existingLead?.fullName || `${firstName} ${lastName}`.trim(),
				},
			});
		} else {
			// User does NOT have a phone number in DB yet!
			// DO NOT create lead with phone: null. Prompt for phone number first!
			cookieStore.set("mock_user_phone", "", { path: "/", maxAge: 31536000 });

			return NextResponse.json({
				success: true,
				isNewUser: !existingUser && !existingLead,
				needsPhone: true,
				hasPhone: false,
				user: {
					id: existingUser?.id || existingLead?.id,
					clerkId,
					email: normalizedEmail,
					firstName,
					lastName,
					name: `${firstName} ${lastName}`.trim() || normalizedEmail.split("@")[0],
				},
			});
		}
	} catch (err: any) {
		console.error("Google Auth API error:", err);
		return NextResponse.json(
			{ success: false, error: err.message || "Error during Google authentication" },
			{ status: 500 }
		);
	}
}
