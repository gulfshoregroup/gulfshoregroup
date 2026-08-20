import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-crypto";
import { cookies } from "next/headers";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { email, password } = body;

		if (!email || !password) {
			return NextResponse.json(
				{ success: false, error: "Email and password are required" },
				{ status: 400 }
			);
		}

		// 1. Fetch user by email
		const user = await prisma.user.findFirst({
			where: { email: email.toLowerCase().trim() },
		});

		if (!user) {
			return NextResponse.json(
				{ success: false, error: "Invalid email or password" },
				{ status: 401 }
			);
		}

		// 2. Extract password hash from metadata
		const metadata = user.metadata as any;
		const passwordHash = metadata?.passwordHash;

		if (!passwordHash) {
			return NextResponse.json(
				{ success: false, error: "Invalid account configuration. Please contact support." },
				{ status: 400 }
			);
		}

		// 3. Verify password
		const isValid = verifyPassword(password, passwordHash);
		if (!isValid) {
			return NextResponse.json(
				{ success: false, error: "Invalid email or password" },
				{ status: 401 }
			);
		}

		// 4. Set session cookies
		const cookieStore = await cookies();
		cookieStore.set("mock_signed_in", "true", { path: "/", maxAge: 31536000, httpOnly: false });
		cookieStore.set("mock_user_email", user.email, { path: "/", maxAge: 31536000 });
		cookieStore.set("mock_user_id", user.clerkId, { path: "/", maxAge: 31536000 });

		return NextResponse.json({
			success: true,
			user: {
				id: user.id,
				clerkId: user.clerkId,
				email: user.email,
				name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
			},
		});
	} catch (err: any) {
		console.error("Signin API error:", err);
		return NextResponse.json(
			{ success: false, error: "Internal server error during login" },
			{ status: 500 }
		);
	}
}
