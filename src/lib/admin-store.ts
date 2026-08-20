import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/data/admin-credentials.json");

export function getAdminCredentials() {
	// 1. Check environment variables first (production-safe)
	const envEmail = process.env.ADMIN_EMAIL;
	const envPassword = process.env.ADMIN_PASSWORD;
	if (envEmail && envPassword) {
		return { email: envEmail, password: envPassword };
	}

	// 2. Fallback to JSON file (local dev)
	try {
		if (fs.existsSync(filePath)) {
			const data = fs.readFileSync(filePath, "utf8");
			const parsed = JSON.parse(data);
			if (parsed.email && parsed.password) return parsed;
		}
	} catch (e) {
		console.error("Error reading admin credentials:", e);
	}

	// 3. Ultimate fallback defaults
	return { email: "admin@gulfshore.com", password: "admin" };
}

export function saveAdminCredentials(creds: { email: string; password?: string }) {
	try {
		const current = getAdminCredentials();
		const updated = {
			email: creds.email,
			password: creds.password !== undefined ? creds.password : current.password
		};
		const dir = path.dirname(filePath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");
		return true;
	} catch (e) {
		console.error("Error saving admin credentials:", e);
		return false;
	}
}
