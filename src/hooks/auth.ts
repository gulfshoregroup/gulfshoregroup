import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAdminCredentials } from "@/lib/admin-store";

export default async function VerifyAdmin() {
	const cookieStore = await cookies();
	const signedIn = cookieStore.get("mock_signed_in");
	const userEmail = cookieStore.get("mock_user_email");

	const isSignedIn = signedIn?.value === "true";
	const email = userEmail?.value || "";

	if (!isSignedIn || !email) {
		return redirect("/admin/sign-in");
	}

	// Verify email matches stored admin credentials
	const creds = getAdminCredentials();
	if (email !== creds.email) {
		return redirect("/admin/sign-in");
	}

	return null;
}
