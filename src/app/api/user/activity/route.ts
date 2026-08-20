import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { type, data } = body;

		const { userId } = await auth();
		if (!userId) {
			return NextResponse.json({
				success: false,
				message: "User not logged in",
			});
		}

		const user = await prisma.user.findUnique({
			where: { clerkId: userId },
		});
		if (!user) {
			return NextResponse.json(
				{ message: "User not found" },
				{ status: 404 }
			);
		}

		if (type === "search") {
			const existingSearch = await prisma.userSearchQuery.findFirst({
				where: {
					userId: user.id,
					searchQuery: {
						equals: data,
					},
				},
			});

			if (existingSearch) {
				await prisma.userSearchQuery.update({
					where: { id: existingSearch.id },
					data: {
						searchCount: { increment: 1 },
						lastSearched: new Date(),
					},
				});
			} else {
				// create a new search entry
				await prisma.userSearchQuery.create({
					data: {
						userId: user.id,
						searchQuery: data,
						searchCount: 1,
						lastSearched: new Date(),
					},
				});

				// enforce max 30 searches → delete oldest if exceeded
				const totalSearches = await prisma.userSearchQuery.count({
					where: { userId: user.id },
				});

				if (totalSearches > 30) {
					const oldest = await prisma.userSearchQuery.findFirst({
						where: { userId: user.id },
						orderBy: { createdAt: "asc" },
					});

					if (oldest) {
						await prisma.userSearchQuery.delete({
							where: { id: oldest.id },
						});
					}
				}
			}
		}

		if (type === "property") {
			const existingView = await prisma.userViewedProperty.findFirst({
				where: {
					userId: user.id,
					propertyId: data.id,
				},
			});

			if (existingView) {
				await prisma.userViewedProperty.update({
					where: { id: existingView.id },
					data: {
						viewCount: { increment: 1 },
						lastViewed: new Date(),
					},
				});
			} else {
				await prisma.userViewedProperty.create({
					data: {
						userId: user.id,
						propertyId: data.id,
						viewCount: 1,
						lastViewed: new Date(),
					},
				});
			}
		}

		return NextResponse.json({ success: true });
	} catch (error: any) {
		console.error("Error saving user activity:", error);
		return NextResponse.json(
			{ error: error.message },
			{ status: 500 }
		);
	}
}
