import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ community: string }> }
) {
	try {
		const { community } = await params;
		const communityName = community.trim().toUpperCase();
		const res = await prisma.community.findFirst({
			where: {
				OR: [
					{ name: { equals: communityName.replaceAll("-", " ") } },
					{ slug: { equals: communityName } },
				],
			},
		});

		const mappedData = res ? {
			...res,
			_id: res.id,
			Community: res.name,
		} : null;

		return NextResponse.json({ success: true, data: mappedData });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
