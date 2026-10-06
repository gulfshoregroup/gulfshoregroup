import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// FEMA NFHL visible layers to include in the export.
// Layer 28 = Flood Hazard Zones (1% annual chance). Other commonly useful layers:
// 0  = Flood Hazard Zones
// 13 = Cross Section
// 14 = Limit of Moderate Wave Action (LiMWA)
// 28 = Flood Hazard Zones (simplified / primary)
// 29 = Floodway
const DEFAULT_LAYERS = "show:0,28,29";

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = req.nextUrl;
		const bbox = searchParams.get("bbox");
		const layers = searchParams.get("layers") || DEFAULT_LAYERS;

		if (!bbox) {
			return new NextResponse("Missing bbox", { status: 400 });
		}

		const exportEndpoints = [
			"https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/export",
			"https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/export",
		];

		let response: Response | null = null;
		let lastError = "";

		for (const endpoint of exportEndpoints) {
			try {
				const url = new URL(endpoint);
				url.searchParams.set("bbox", bbox);
				url.searchParams.set("bboxSR", "3857");
				url.searchParams.set("layers", layers);
				url.searchParams.set("size", "256,256");
				url.searchParams.set("imageSR", "3857");
				url.searchParams.set("format", "png32");
				url.searchParams.set("transparent", "true");
				url.searchParams.set("f", "image");

				const res = await fetch(url.toString(), {
					headers: {
						"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
						"Accept": "image/webp,image/apng,image/png,image/*,*/*;q=0.8",
					},
					signal: AbortSignal.timeout(10000),
				});

				if (res.ok) {
					response = res;
					break;
				} else {
					const text = await res.text().catch(() => "");
					lastError = `${endpoint} -> HTTP ${res.status}: ${text.slice(0, 100)}`;
				}
			} catch (e: any) {
				lastError = `${endpoint} -> ${e.message}`;
			}
		}

		if (!response) {
			throw new Error(`FEMA tile export failed on all endpoints: ${lastError}`);
		}

		const buffer = await response.arrayBuffer();
		const contentType = response.headers.get("Content-Type") || "image/png";

		return new NextResponse(buffer, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=86400",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (error: any) {
		console.error("[FEMA Proxy] Error fetching tile:", {
			message: error?.message,
			stack: error?.stack,
			bbox: req.nextUrl.searchParams.get("bbox"),
		});

		// Return a 1x1 transparent PNG so the map overlay doesn't break,
		// but set a short cache time so retries can succeed later.
		const transparentPng = Buffer.from(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==",
			"base64"
		);
		return new NextResponse(transparentPng, {
			headers: {
				"Content-Type": "image/png",
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=60",
			},
		});
	}
}
