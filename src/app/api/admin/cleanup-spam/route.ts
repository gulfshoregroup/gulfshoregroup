import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getAdminCredentials } from "@/lib/admin-store";

export const dynamic = "force-dynamic";

export async function POST() {
	const cookieStore = await cookies();
	const signedIn = cookieStore.get("mock_signed_in")?.value === "true";
	const userEmail = cookieStore.get("mock_user_email")?.value;
	const creds = getAdminCredentials();

	if (!signedIn || userEmail !== creds.email) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		// Identify spam criteria:
		// 1. Bit.ly links or URLs in name
		// 2. Turkish casino keywords ("bonusu", "tıkla", "kapip")
		// 3. Known spam domains or patterns
		const spamLeadFilter = {
			OR: [
				{ firstName: { contains: "bit.ly" } },
				{ lastName: { contains: "bit.ly" } },
				{ fullName: { contains: "bit.ly" } },
				{ firstName: { contains: "http" } },
				{ lastName: { contains: "http" } },
				{ fullName: { contains: "http" } },
				{ firstName: { contains: "bonus" } },
				{ fullName: { contains: "bonus" } },
				{ firstName: { contains: "tıkla" } },
				{ fullName: { contains: "tıkla" } },
				{ firstName: { contains: "kapip" } },
				{ fullName: { contains: "kapip" } },
				{ email: { contains: "necub.com" } },
			],
		};

		// 1. Find all matching spam leads
		const spamLeads = await prisma.lead.findMany({
			where: spamLeadFilter,
			select: {
				id: true,
				userId: true,
				email: true,
			},
		});

		const spamLeadIds = spamLeads.map((l) => l.id);
		const spamUserIds = spamLeads.map((l) => l.userId).filter(Boolean) as string[];
		const spamEmails = spamLeads.map((l) => l.email).filter(Boolean);

		// 2. Delete any matching contact requests
		if (spamEmails.length > 0) {
			await prisma.contactRequest.deleteMany({
				where: {
					email: { in: spamEmails },
				},
			}).catch((err) => console.error("Error deleting spam contact requests:", err));
		}

		// 3. Delete from User table
		const spamUserFilter = {
			OR: [
				...(spamUserIds.length > 0 ? [{ clerkId: { in: spamUserIds } }] : []),
				...(spamEmails.length > 0 ? [{ email: { in: spamEmails } }] : []),
				{ name: { contains: "bit.ly" } },
				{ firstName: { contains: "bit.ly" } },
				{ name: { contains: "http" } },
				{ firstName: { contains: "http" } },
				{ name: { contains: "bonus" } },
				{ firstName: { contains: "bonus" } },
				{ name: { contains: "tıkla" } },
				{ firstName: { contains: "tıkla" } },
				{ email: { contains: "necub.com" } },
			],
		};

		const userDeleteResult = await prisma.user.deleteMany({
			where: spamUserFilter,
		}).catch((err) => {
			console.error("Error deleting spam users:", err);
			return { count: 0 };
		});

		// 4. Delete from Lead table
		let leadDeleteCount = 0;
		if (spamLeadIds.length > 0) {
			const leadDeleteResult = await prisma.lead.deleteMany({
				where: {
					id: { in: spamLeadIds },
				},
			}).catch((err) => {
				console.error("Error deleting spam leads:", err);
				return { count: 0 };
			});
			leadDeleteCount = leadDeleteResult.count;
		}

		// Also delete any remaining leads matching the spam filter directly
		const directLeadDelete = await prisma.lead.deleteMany({
			where: spamLeadFilter,
		}).catch(() => ({ count: 0 }));

		const totalCleaned = Math.max(leadDeleteCount + directLeadDelete.count, userDeleteResult.count);

		return NextResponse.json({
			success: true,
			message: `Successfully cleaned up ${totalCleaned} spam accounts.`,
			totalCleaned,
			deletedLeads: leadDeleteCount + directLeadDelete.count,
			deletedUsers: userDeleteResult.count,
		});
	} catch (error: any) {
		console.error("Error in cleanup-spam route:", error);
		return NextResponse.json(
			{ success: false, error: error.message || "Failed to cleanup spam accounts" },
			{ status: 500 }
		);
	}
}
