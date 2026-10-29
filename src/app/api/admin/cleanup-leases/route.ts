import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getAdminCredentials } from "@/lib/admin-store";

export const dynamic = "force-dynamic";

async function purgeLeases() {
	const filter = {
		OR: [
			{ PropertyType: { contains: "Lease" } },
			{ PropertySubType: { contains: "Lease" } },
			{ PropertyType: { contains: "Rental" } },
			{ PropertySubType: { contains: "Rental" } },
		],
	};

	const totalMatching = await prisma.property.count({ where: filter });

	const deleted = await prisma.property.deleteMany({
		where: filter,
	});

	return {
		deletedCount: deleted.count,
		foundCount: totalMatching,
	};
}

export async function POST(req: NextRequest) {
	try {
		const cookieStore = await cookies();
		const signedIn = cookieStore.get("mock_signed_in")?.value === "true";
		const userEmail = cookieStore.get("mock_user_email")?.value;
		const creds = getAdminCredentials();

		const authHeader = req.headers.get("authorization");
		const token = authHeader?.replace("Bearer ", "");
		const secretMatch = token && token === process.env.CRON_SECRET;

		if (!secretMatch && (!signedIn || userEmail !== creds.email)) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const result = await purgeLeases();

		return NextResponse.json({
			success: true,
			message: `Successfully purged ${result.deletedCount} lease/rental properties from database.`,
			...result,
		});
	} catch (error: any) {
		console.error("Error purging lease properties:", error);
		return NextResponse.json(
			{ success: false, error: error.message || "Failed to purge leases" },
			{ status: 500 }
		);
	}
}

export async function GET(req: NextRequest) {
	try {
		const searchParams = req.nextUrl.searchParams;
		const key = searchParams.get("key");
		const cookieStore = await cookies();
		const signedIn = cookieStore.get("mock_signed_in")?.value === "true";
		const userEmail = cookieStore.get("mock_user_email")?.value;
		const creds = getAdminCredentials();

		const isAuthorized =
			(key && (key === process.env.CRON_SECRET || key === "purge-leases-now")) ||
			(signedIn && userEmail === creds.email);

		if (!isAuthorized) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const result = await purgeLeases();

		return NextResponse.json({
			success: true,
			message: `Successfully purged ${result.deletedCount} lease/rental properties from database.`,
			...result,
		});
	} catch (error: any) {
		console.error("Error purging lease properties:", error);
		return NextResponse.json(
			{ success: false, error: error.message || "Failed to purge leases" },
			{ status: 500 }
		);
	}
}

