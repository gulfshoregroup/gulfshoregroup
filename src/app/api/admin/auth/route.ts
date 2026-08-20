import { NextResponse } from "next/server";
import { getAdminCredentials, saveAdminCredentials } from "@/lib/admin-store";
import { cookies } from "next/headers";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { action, email, password, newEmail, newPassword } = body;

		const creds = getAdminCredentials();

		if (action === "login") {
			if (email === creds.email && password === creds.password) {
				return NextResponse.json({ success: true, email: creds.email });
			}
			return NextResponse.json({ success: false, error: "Invalid email or password" });
		}

		if (action === "change-credentials") {
			const cookieStore = await cookies();
			const mockCookie = cookieStore.get("mock_signed_in");
			const mockEmail = cookieStore.get("mock_user_email");
			const isSignedIn = mockCookie ? mockCookie.value !== "false" : false;
			const currentEmail = mockEmail ? mockEmail.value : "";

			if (!isSignedIn || currentEmail !== creds.email) {
				return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
			}

			if (password !== creds.password) {
				return NextResponse.json({ success: false, error: "Incorrect current password" });
			}

			if (!newEmail) {
				return NextResponse.json({ success: false, error: "New email is required" });
			}

			saveAdminCredentials({
				email: newEmail,
				password: newPassword || creds.password
			});

			return NextResponse.json({ success: true });
		}

		return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.error("Auth API error:", error);
		return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
	}
}
