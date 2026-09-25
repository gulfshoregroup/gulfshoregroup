import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    if (!slug) {
      return NextResponse.json({ error: "Missing slug" }, { status: 400 });
    }

    const shortLink = await prisma.shortLink.findUnique({
      where: { slug },
    });

    if (!shortLink) {
      // Fallback or 404
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Optionally increment clicks
    prisma.shortLink.update({
      where: { id: shortLink.id },
      data: { clicks: { increment: 1 } },
    }).catch(console.error);

    return NextResponse.redirect(shortLink.url);
  } catch (error) {
    console.error("ShortLink redirect error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
