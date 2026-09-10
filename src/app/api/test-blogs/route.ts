import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const blogs = await prisma.blog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { title: true, createdAt: true, publishedAt: true }
  });
  return NextResponse.json(blogs);
}
