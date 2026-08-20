import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const filePath = path.join(process.cwd(), "src/data/notification-settings.json");

function getNotificationSettings() {
	try {
		if (fs.existsSync(filePath)) {
			const data = fs.readFileSync(filePath, "utf8");
			return JSON.parse(data);
		}
	} catch (e) {
		console.error("Error reading notification settings:", e);
	}
	return {
		pushEnabled: true,
		emailEnabled: true
	};
}

export async function GET() {
	const settings = getNotificationSettings();
	return NextResponse.json(settings);
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { pushEnabled, emailEnabled } = body;

		const updated = {
			pushEnabled: typeof pushEnabled === "boolean" ? pushEnabled : true,
			emailEnabled: typeof emailEnabled === "boolean" ? emailEnabled : true
		};

		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");

		return NextResponse.json({ success: true, settings: updated });
	} catch (error) {
		console.error("Error saving notification settings:", error);
		return NextResponse.json({ success: false, error: "Failed to save notification settings" }, { status: 500 });
	}
}
