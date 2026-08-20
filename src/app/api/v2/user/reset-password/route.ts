import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-crypto";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { email, otp, newPassword } = body;

		if (!email || !otp || !newPassword) {
			return NextResponse.json(
				{ success: false, error: "Email, OTP code, and new password are required" },
				{ status: 400 }
			);
		}

		// 1. Fetch user by email
		const user = await prisma.user.findFirst({
			where: { email: email.toLowerCase().trim() },
		});

		if (!user) {
			return NextResponse.json(
				{ success: false, error: "User not found with this email" },
				{ status: 404 }
			);
		}

		// 2. Verify OTP code and expiry
		const metadata = (user.metadata as any) || {};
		const storedOtp = metadata.resetOtp;
		const storedExpiryStr = metadata.resetOtpExpiry;

		if (!storedOtp || !storedExpiryStr) {
			return NextResponse.json(
				{ success: false, error: "No password reset request found. Please request a new code." },
				{ status: 400 }
			);
		}

		const expiry = new Date(storedExpiryStr);
		if (Date.now() > expiry.getTime()) {
			return NextResponse.json(
				{ success: false, error: "Verification code has expired. Please request a new one." },
				{ status: 400 }
			);
		}

		if (otp.trim() !== storedOtp) {
			return NextResponse.json(
				{ success: false, error: "Invalid verification code. Please try again." },
				{ status: 400 }
			);
		}

		// 3. Hash new password
		const newHash = hashPassword(newPassword);

		// 4. Update user metadata (remove OTP fields and update passwordHash)
		const { resetOtp, resetOtpExpiry, ...cleanMetadata } = metadata;
		const updatedMetadata = {
			...cleanMetadata,
			passwordHash: newHash,
		};

		await prisma.user.update({
			where: { id: user.id },
			data: {
				metadata: updatedMetadata,
			},
		});

		return NextResponse.json({
			success: true,
			message: "Password reset successful",
		});
	} catch (err: any) {
		console.error("Password reset error:", err);
		return NextResponse.json(
			{ success: false, error: "Internal server error during password reset" },
			{ status: 500 }
		);
	}
}
