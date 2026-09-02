import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	try {
		const bbox = req.nextUrl.searchParams.get("bbox");
		if (!bbox) {
			return new NextResponse("Missing bbox", { status: 400 });
		}

		const url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/export?bbox=${bbox}&bboxSR=3857&layers=show:28&size=256,256&imageSR=3857&format=png32&transparent=true&f=image`;

		const response = await fetch(url, {
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
				"Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
			},
		});

		if (!response.ok) {
			throw new Error(`FEMA responded with ${response.status}`);
		}

		const buffer = await response.arrayBuffer();

		return new NextResponse(buffer, {
			headers: {
				"Content-Type": response.headers.get("Content-Type") || "image/png",
				"Cache-Control": "public, max-age=86400",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (error: any) {
		console.error("FEMA Proxy Error:", error);
		const transparentPng = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
			"base64"
		);
		return new NextResponse(transparentPng, {
			headers: {
				"Content-Type": "image/png",
				"Access-Control-Allow-Origin": "*",
			},
		});
	}
}
