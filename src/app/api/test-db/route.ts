export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";

const BASE_URL = process.env.BRIDGE_BASE_URL || "https://api.bridgedataoutput.com/api/v2";
const API_KEY = process.env.BRIDGE_API_KEY || "cac17d1ac3cbf00980257de8c5902ea7";
const SOURCE = process.env.BRIDGE_SOURCE || "nabor";

export async function GET(req: NextRequest) {
	const mlsId = "226028288";
	const url = `${BASE_URL}/${SOURCE}/listings?access_token=${API_KEY}&ListingId.eq=${mlsId}&limit=1`;
	
	try {
		const res = await fetch(url);
		const data = await res.json();
		const listings = data.bundle || [];
		
		if (listings.length === 0) {
			return NextResponse.json({ error: "Not found in Bridge" });
		}
		
		const raw = listings[0];
		const found: Record<string, string> = {};
		
		for (const [k, v] of Object.entries(raw)) {
			if (String(v) === "38600040005" || String(v).includes("38600040005")) {
				found["Parcel_Field_" + k] = k;
			}
			if (String(v) === "00-Vacant Residential" || String(v).includes("Vacant Residential") || String(v).includes("00-")) {
				found["LandUse_Field_" + k] = k;
			}
		}
		
		return NextResponse.json({ found, allKeys: Object.keys(raw) });
	} catch(e: any) {
		return NextResponse.json({ error: e.message });
	}
}
