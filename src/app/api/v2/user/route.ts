import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const searches = await prisma.savedSearch.findMany({
			where: {
				userId: "680c0e7a167f31811ab39db4",
			},
		});
		return NextResponse.json({ success: true, users: searches });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
