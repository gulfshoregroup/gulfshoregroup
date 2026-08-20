import { NextRequest, NextResponse } from "next/server";

export default function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	const origin = req.headers.get("origin") || "*";

	// CORS Preflight handling for API requests
	if (pathname.startsWith("/api")) {
		if (req.method === "OPTIONS") {
			return new NextResponse(null, {
				status: 200,
				headers: {
					"Access-Control-Allow-Origin": origin,
					"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, Authorization, x-requested-with",
					"Access-Control-Allow-Credentials": "true",
				},
			});
		}
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
