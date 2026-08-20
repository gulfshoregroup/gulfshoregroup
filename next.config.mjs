import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */

const nextConfig = {
	typescript: {
		ignoreBuildErrors: true, // ⚠ Use only if you're sure type errors can be ignored
	},

	images: {
		formats: ["image/avif", "image/webp"], // modern formats first
		remotePatterns: [
			{
				protocol: "https",
				hostname: "res.cloudinary.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "*.cloudinary.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "gulfshoregroup.com",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "dvvjkgh94f2v6.cloudfront.net",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "images.unsplash.com",
				pathname: "/**",
			},
		],
		minimumCacheTTL: 60 * 60 * 24 * 30, // cache for 30 days
	},

	poweredByHeader: false,
	compress: true,

	turbopack: {
		root: __dirname,
		...(process.env.NEXT_PUBLIC_USE_REAL_CLERK !== "true" ? {
			resolveAlias: {
				"@clerk/nextjs/server": "./src/lib/mock-clerk-server.ts",
				"@clerk/nextjs": "./src/lib/mock-clerk.tsx",
			},
		} : {}),
	},

	webpack: (config) => {
		if (process.env.NEXT_PUBLIC_USE_REAL_CLERK !== "true") {
			config.resolve.alias["@clerk/nextjs/server$"] = join(__dirname, "src/lib/mock-clerk-server.ts");
			config.resolve.alias["@clerk/nextjs$"] = join(__dirname, "src/lib/mock-clerk.tsx");
		}
		return config;
	},
};

export default nextConfig;
