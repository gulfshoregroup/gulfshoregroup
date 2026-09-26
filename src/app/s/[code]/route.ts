import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const shortLink = await prisma.shortLink.findUnique({
      where: { code },
    });

    if (shortLink && shortLink.url) {
      return NextResponse.redirect(shortLink.url);
    }
  } catch (error) {
    console.error("[ShortLink] Error fetching code:", code, error);
  }

  // Fallback if not found or error
  return NextResponse.redirect(new URL("/", req.url));
}
