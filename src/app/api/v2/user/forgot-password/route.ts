import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { email } = body;

		if (!email) {
			return NextResponse.json(
				{ success: false, error: "Email is required" },
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

		// 2. Generate 6-digit OTP code
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry

		// 3. Update user metadata with OTP and expiry
		const currentMetadata = (user.metadata as any) || {};
		const updatedMetadata = {
			...currentMetadata,
			resetOtp: otp,
			resetOtpExpiry: expiry.toISOString(),
		};

		await prisma.user.update({
			where: { id: user.id },
			data: {
				metadata: updatedMetadata,
			},
		});

		// 4. Send email using Resend
		let emailSent = false;
		let emailError = "";

		if (resend) {
			try {
				const fromEmail = process.env.RESEND_FROM_EMAIL || "Gulfshore Group <noreply@updates.gulfshoregroup.com>";
				const result = await resend.emails.send({
					from: fromEmail,
					to: [user.email],
					subject: "Reset your Gulfshore Group password",
					html: `
						<div style="background-color: #F4F4F5; margin: 0; padding: 40px 0; font-family: 'Poppins', Arial, sans-serif;">
							<div style="max-width: 640px; margin: 0 auto; background-color: #FFFFFF; border-radius: 4px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08);">
								<div style="background: #1A0A0A; padding: 40px 40px; text-align: center; border-bottom: 3px solid #C9A96E;">
									<p style="font-size: 24px; letter-spacing: 0.2em; text-transform: uppercase; color: #FFFFFF; margin: 0 0 4px; font-weight: 400; margin-top:0;">GULFSHORE</p>
									<p style="font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase; color: #C9A96E; margin: 0; font-weight: 600;">Real Estate Group</p>
								</div>
								<div style="padding: 48px 40px; text-align: center;">
									<h1 style="font-size: 22px; font-weight: 400; color: #1A0A0A; margin: 0 0 12px; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.05em;">Password Reset</h1>
									<p style="font-size: 14px; color: #666666; margin: 0 0 24px;">Verify your identity to reset your password.</p>
									<div style="margin: 0 auto 24px; max-width: 60px; border-top: 1px solid #C9A96E;"></div>
									
									<div style="text-align: center;">
										<p style="font-size: 14px; color: #666666; margin-bottom: 24px;">Your verification code is:</p>
										<div style="background-color: #FAF7F2; padding: 24px; border: 1px solid #E8DDD8; border-radius: 4px; margin: 0 auto 24px; max-width: 300px;">
											<span style="font-size: 32px; font-weight: bold; letter-spacing: 12px; color: #d90429; margin-left: 12px;">${otp}</span>
										</div>
										<p style="font-size: 12px; color: #999999;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
									</div>
								</div>
							</div>
						</div>
					`
				});

				if (result.error) {
					console.error("Resend API error:", result.error);
					emailError = result.error.message;
				} else {
					emailSent = true;
					if (result.data?.id) {
						try {
							await prisma.communicationLog.create({
								data: {
									type: "Email",
									to: user.email,
									subject: "Reset your Gulfshore Group password",
									status: "sent",
									providerId: result.data.id,
								}
							});
						} catch (logErr) {
							console.error("Failed to log forgot password email:", logErr);
						}
					}
				}
			} catch (e: any) {
				console.error("Resend send failed:", e);
				emailError = e.message;
			}
		}

		// For testing ease / fallback, if Resend is not configured, we return the OTP in mock response (or log it)
		// We only expose OTP in response if RESEND_API_KEY is not set (so developers can test locally)
		const responsePayload: any = { success: true };
		if (!resend) {
			responsePayload.mockOtp = otp;
			responsePayload.message = "Resend API key not configured. Mock OTP generated for development.";
		} else if (!emailSent) {
			responsePayload.mockOtp = otp;
			responsePayload.message = `Failed to send email: ${emailError}. Mock OTP generated for safety.`;
		} else {
			responsePayload.message = "Verification code sent to email.";
		}

		return NextResponse.json(responsePayload);
	} catch (err: any) {
		console.error("Forgot password error:", err);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
