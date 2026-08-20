import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { mapProperty } from "@/lib/mapProperty";

const BASE_URL =
	process.env.BRIDGE_BASE_URL ||
	"https://api.bridgedataoutput.com/api/v2";
const API_KEY =
	process.env.BRIDGE_API_KEY || "cac17d1ac3cbf00980257de8c5902ea7";
const SOURCE = process.env.BRIDGE_SOURCE || "nabor";

// GET /api/v2/sync/single?mls=226025738
export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const mlsId = searchParams.get("mls");

	if (!mlsId) {
		return NextResponse.json({ success: false, error: "mls param required" }, { status: 400 });
	}

	const url =
		`${BASE_URL}/${SOURCE}/listings` +
		`?access_token=${API_KEY}` +
		`&ListingId.eq=${mlsId}` +
		`&limit=1`;

	const res = await fetch(url);
	if (!res.ok) {
		return NextResponse.json({ success: false, error: `Bridge API error: ${res.status}` }, { status: 500 });
	}

	const data = await res.json();
	const listings: any[] = data.bundle || [];

	if (listings.length === 0) {
		return NextResponse.json({ success: false, error: `MLS ${mlsId} not found in Bridge API` }, { status: 404 });
	}

	// Now fetch with media expand
	const mediaUrl =
		`${BASE_URL}/${SOURCE}/listings` +
		`?access_token=${API_KEY}` +
		`&ListingKey.eq=${listings[0].ListingKey}` +
		`&limit=1` +
		`&$expand=Media`;

	const mediaRes = await fetch(mediaUrl);
	const mediaData = await mediaRes.json();
	const item = mediaData.bundle?.[0] || listings[0];

	await prisma.property.upsert({
		where: { ListingId: item.ListingId },
		update: mapProperty(item),
		create: mapProperty(item),
	});

	return NextResponse.json({
		success: true,
		message: `Property ${mlsId} synced successfully`,
		address: item.UnparsedAddress || item.FullAddress,
		status: item.StandardStatus,
		imagesCount: Array.isArray(item.Media) ? item.Media.length : 0,
	});
}
