import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params;
  const code = params.code;

  if (!code) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const shortLink = await prisma.shortLink.findUnique({
      where: { code },
    });

    if (shortLink && shortLink.url) {
      console.log(`[ShortLink] Found code=${code}, redirecting to ${shortLink.url}`);
      return NextResponse.redirect(shortLink.url);
    }

    console.warn(`[ShortLink] Code not found in DB: ${code}`);
  } catch (error) {
    console.error(`[ShortLink] Error fetching code=${code}:`, error);
  }

  // Fallback if not found or error
  return NextResponse.redirect(new URL("/", req.url));
}
