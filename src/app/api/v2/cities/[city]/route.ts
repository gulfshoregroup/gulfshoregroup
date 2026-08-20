import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ city: string }> }
) {
	try {
		const { city } = await params;
		const cityName = city.trim().toUpperCase().replaceAll("-", " ");
		const res = await prisma.city.findFirst({
			where: {
				name: {
					equals: cityName,
				},
			},
		});

		const mappedData = res ? {
			...res,
			_id: res.id,
			City: res.name,
			Images: res.images || [],
			infoText: res.description || "",
			defaultImage: res.defaultImage || "",
		} : null;

		return NextResponse.json({ success: true, data: mappedData });
	} catch (error) {
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
