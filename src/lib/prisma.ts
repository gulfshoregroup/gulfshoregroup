import dns from "node:dns";
if (dns && typeof dns.setDefaultResultOrder === "function") {
	try {
		dns.setDefaultResultOrder("ipv4first");
	} catch (e) {}
}
import { PrismaClient } from "../app/generated/prisma/client";

const globalForPrisma = global as unknown as {
	prisma: PrismaClient;
};

function createPrismaClient() {
	// In local dev, use MariaDB adapter with hardcoded local config
	if (process.env.NEXT_PUBLIC_ENV === "DEV") {
		const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
		const adapter = new PrismaMariaDb({
			host: "127.0.0.1",
			port: 3307,
			user: "root",
			password: "",
			database: "gulfshoregroup",
			connectTimeout: 30000,
			connectionLimit: 20,
			acquireTimeout: 30000,
			socketTimeout: 60000,
		} as any);
		return new PrismaClient({ adapter });
	}

	// In production, Prisma v7 requires an adapter - use DATABASE_URL env var
	const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
	const dbUrlStr = process.env.DATABASE_URL;
	if (!dbUrlStr) {
		throw new Error("DATABASE_URL environment variable is missing!");
	}
	let url: URL;
	try {
		url = new URL(dbUrlStr);
	} catch (e: any) {
		throw new Error(`Invalid DATABASE_URL config: ${e.message}`);
	}
	const adapter = new PrismaMariaDb({
		host: url.hostname,
		port: url.port ? parseInt(url.port, 10) : 3306,
		user: url.username,
		password: url.password,
		database: url.pathname ? url.pathname.slice(1) : "railway",
		connectTimeout: 15000,  // 15s — was 90s
		connectionLimit: 10,    // 10 — was 40 (Railway free tier has limits)
		acquireTimeout: 20000,  // 20s — was 90s
		socketTimeout: 60000,   // 60s
		waitForConnections: true,
	} as any);
	return new PrismaClient({ adapter });
}

// Always cache the Prisma client globally — in production too.
// Without this, every request creates a new connection pool → pool exhaustion → 90s timeout.
if (!globalForPrisma.prisma) {
	globalForPrisma.prisma = createPrismaClient();
}

const prisma = globalForPrisma.prisma;

export default prisma;
export { prisma };
