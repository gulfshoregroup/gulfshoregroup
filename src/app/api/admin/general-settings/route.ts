import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/data/general-settings.json");

function getGeneralSettings() {
	try {
		if (fs.existsSync(filePath)) {
			const data = fs.readFileSync(filePath, "utf8");
			return JSON.parse(data);
		}
	} catch (e) {
		console.error("Error reading general settings:", e);
	}
	return {
		siteName: "Gulfshore Group",
		contactEmail: "admin@gulfshore.com",
		siteUrl: "https://gulfshoregroup.com"
	};
}

export async function GET() {
	const settings = getGeneralSettings();
	return NextResponse.json(settings);
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { siteName, contactEmail, siteUrl } = body;

		const updated = {
			siteName: siteName || "Gulfshore Group",
			contactEmail: contactEmail || "admin@gulfshore.com",
			siteUrl: siteUrl || "https://gulfshoregroup.com"
		};

		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");

		return NextResponse.json({ success: true, settings: updated });
	} catch (error) {
		console.error("Error saving general settings:", error);
		return NextResponse.json({ success: false, error: "Failed to save settings" }, { status: 500 });
	}
}
