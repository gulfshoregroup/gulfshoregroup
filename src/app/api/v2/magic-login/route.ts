import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const leadId = searchParams.get("leadId");
  const redirectUrl = searchParams.get("redirect_url") || "/";

  if (!leadId) {
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }

  try {
    const client = await clerkClient();
    let clerkUserId = lead.userId;

    // If the lead doesn't have a Clerk account, create one or link existing
    if (!clerkUserId) {
      // Check if user already exists in Clerk
      const existingUsers = await client.users.getUserList({
        emailAddress: [lead.email],
      });

      if (existingUsers.data && existingUsers.data.length > 0) {
        clerkUserId = existingUsers.data[0].id;
      } else {
        const newUser = await client.users.createUser({
          emailAddress: [lead.email],
          firstName: lead.firstName || undefined,
          lastName: lead.lastName || undefined,
          skipPasswordRequirement: true, // Allow passwordless creation
        });
        clerkUserId = newUser.id;
      }

      // Link the Clerk user to the Prisma Lead
      await prisma.lead.update({
        where: { id: lead.id },
        data: { userId: clerkUserId },
      });

      // Also create a Prisma User record to keep data synced (if it doesn't exist)
      const existingDbUser = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
      });

      if (!existingDbUser) {
        await prisma.user.create({
          data: {
            clerkId: clerkUserId,
            email: lead.email,
            firstName: lead.firstName || "",
            lastName: lead.lastName || "",
            name: lead.fullName || lead.firstName || "",
          }
        });
      }
    }

    const tokenResponse = await client.signInTokens.createSignInToken({
      userId: clerkUserId,
      expiresInSeconds: 60 * 5, // 5 minutes
    });
    
    const signInUrl = new URL(tokenResponse.url);
    const fullRedirectUrl = new URL(redirectUrl, req.url).toString();
    signInUrl.searchParams.set("redirect_url", fullRedirectUrl);
    signInUrl.searchParams.set("redirectUrl", fullRedirectUrl);
    
    return NextResponse.redirect(signInUrl);
  } catch (error) {
    console.error("Magic login error:", error);
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  }
}
