import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/data/appearance-settings.json");

function getAppearanceSettings() {
	try {
		if (fs.existsSync(filePath)) {
			const data = fs.readFileSync(filePath, "utf8");
			return JSON.parse(data);
		}
	} catch (e) {
		console.error("Error reading appearance settings:", e);
	}
	return {
		darkMode: false
	};
}

export async function GET() {
	const settings = getAppearanceSettings();
	return NextResponse.json(settings);
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const { darkMode } = body;

		const updated = {
			darkMode: Boolean(darkMode)
		};

		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");

		return NextResponse.json({ success: true, settings: updated });
	} catch (error) {
		console.error("Error saving appearance settings:", error);
		return NextResponse.json({ success: false, error: "Failed to save appearance settings" }, { status: 500 });
	}
}
