import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getIsSignedInServer() {
	try {
		const cookieStore = await cookies();
		const mockCookie = cookieStore.get("mock_signed_in");
		return mockCookie ? mockCookie.value !== "false" : false;
	} catch (e) {
		return false;
	}
}

async function getMockEmailServer() {
	try {
		const cookieStore = await cookies();
		const mockEmail = cookieStore.get("mock_user_email");
		return mockEmail && mockEmail.value !== "false" ? decodeURIComponent(mockEmail.value) : "";
	} catch (e) {
		return "";
	}
}

async function getMockUserIdServer() {
	try {
		const cookieStore = await cookies();
		const mockUserId = cookieStore.get("mock_user_id");
		return mockUserId && mockUserId.value !== "false" ? mockUserId.value : null;
	} catch (e) {
		return null;
	}
}

export function clerkMiddleware(callback?: any) {
	return async (req: any, event: any) => {
		const signedIn = await getIsSignedInServer();
		const userId = await getMockUserIdServer();
		const mockAuth = async () => ({ 
			userId: signedIn ? userId : null 
		});
		if (callback && typeof callback === "function") {
			return await callback(mockAuth, req, event);
		}
		return NextResponse.next();
	};
}

export function createRouteMatcher(routes: string[]) {
	return (req: any) => {
		const pathname = req.nextUrl?.pathname || "";
		return routes.some(route => pathname.startsWith(route));
	};
}

export async function auth() {
	const signedIn = await getIsSignedInServer();
	const userId = await getMockUserIdServer();
	return { 
		userId: signedIn ? userId : null 
	};
}

export async function currentUser() {
	const signedIn = await getIsSignedInServer();
	if (!signedIn) return null;
	
	const userId = await getMockUserIdServer();
	if (!userId) return null;

	try {
		const user = await prisma.user.findUnique({
			where: { clerkId: userId }
		});

		if (!user) return null;

		const isEmailAdmin = user.email.toLowerCase().includes("admin@gulfshore.com");

		return {
			id: user.clerkId,
			fullName: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User",
			firstName: user.firstName,
			lastName: user.lastName,
			primaryEmailAddress: { emailAddress: user.email },
			emailAddresses: [{ emailAddress: user.email }],
			publicMetadata: { role: isEmailAdmin ? "admin" : "user" }
		};
	} catch (e) {
		console.error("Mock Clerk Server currentUser error:", e);
		return null;
	}
}

export const clerkClient = async () => ({
	users: {
		deleteUser: async (id: string) => {
			console.log("Mock clerk user deleted:", id);
		}
	}
});

export async function verifyToken(token: string, options: any) {
    if (token === "dummy-token") {
        const userId = await getMockUserIdServer();
        return { sub: userId || "user_dummy_123" };
    }
    throw new Error("Invalid mock token");
}
