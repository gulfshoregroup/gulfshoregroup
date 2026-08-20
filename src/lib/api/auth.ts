import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import type { Lead } from "@/app/generated/prisma/client";
import { ApiError } from "@/lib/api/errors";

export async function requireClerkUserId(): Promise<string> {
	const { userId } = await auth();
	if (!userId) {
		throw new ApiError(401, "Unauthorized", "UNAUTHORIZED");
	}
	return userId;
}

/**
 * Resolves the Prisma Lead row for the authenticated Clerk user.
 * Creates a lead record on first authenticated API call if the webhook has not run yet.
 */
export async function requireLead(): Promise<Lead> {
	try {
		const clerkUserId = await requireClerkUserId();

		// 1. Check if a lead with this clerkUserId already exists
		const existingByClerkId = await prisma.lead.findFirst({
			where: { userId: clerkUserId },
		});

		if (existingByClerkId) {
			return existingByClerkId;
		}

		// 2. Get user info from Clerk
		const user = await currentUser();
		const email =
			user?.emailAddresses?.[0]?.emailAddress ??
			user?.primaryEmailAddress?.emailAddress;

		if (email) {
			// Find existing lead by email (e.g. created via Contact Form)
			const existingByEmail = await prisma.lead.findFirst({
				where: { email: { equals: email } },
			});

			if (existingByEmail) {
				// Link this existing lead with the clerkUserId
				return await prisma.lead.update({
					where: { id: existingByEmail.id },
					data: { userId: clerkUserId },
				});
			}
		}

		// 3. Create a new lead if no existing lead was found
		return await prisma.lead.create({
			data: {
				userId: clerkUserId,
				email: email || `${clerkUserId}@placeholder.com`,
				firstName: user?.firstName ?? undefined,
				lastName: user?.lastName ?? undefined,
				fullName:
					[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
					undefined,
				source: "Signup",
				status: "New",
			},
		});
	} catch (error) {
		// Fallback to Guest User Lead if Clerk is disabled/unauthenticated
		const guestEmail = "guest@gulfshoregroup.com";
		const guestLead = await prisma.lead.findUnique({
			where: { email: guestEmail },
		});
		if (guestLead) {
			return guestLead;
		}
		return await prisma.lead.create({
			data: {
				email: guestEmail,
				firstName: "Guest",
				lastName: "User",
				fullName: "Guest User",
				source: "Signup",
				status: "New",
				userId: "guest-user-id",
			},
		});
	}
}
