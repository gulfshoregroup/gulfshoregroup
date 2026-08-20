import { NextResponse } from "next/server";

export async function POST(req: Request) {
	try {
		const body = await req.json();
		console.log("=================== BROWSER CLIENT ERROR ===================");
		console.log("Message:", body.message);
		console.log("Stack:", body.stack);
		console.log("URL:", body.url);
		console.log("============================================================");
		return NextResponse.json({ success: true });
	} catch (e) {
		return NextResponse.json({ success: false });
	}
}
