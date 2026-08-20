import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ✅ GET /api/blogs
// - ?slug=example-blog → fetch single blog
// - ?category=market-trends → filter by category
// - ?published=true → show only published blogs
export async function GET(request: any) {
	try {
		const { searchParams } = new URL(request.url);
		const slug = searchParams.get("slug");
		const category = searchParams.get("category");
		const published = searchParams.get("published");
		const limit = Number(searchParams.get("limit")) || 10;

		if (slug) {
			// fetch a single blog by slug
			const blog = await prisma.blog.findFirst({
				where: {
					slug,
					published: true,
				},
			});
			if (!blog)
				return NextResponse.json(
					{ error: "Blog not found" },
					{ status: 404 }
				);
			return NextResponse.json(blog, { status: 200 });
		}

		// build dynamic query for listing
		const where: any = {};
		if (category) where.category = category;
		if (published === "true") where.published = true;

		const blogs = await prisma.blog.findMany({
			where,
			orderBy: {
				publishedAt: "desc",
			},
			take: limit,
			select: {
				title: true,
				slug: true,
				description: true,
				coverImage: true,
				publishedAt: true,
				author: true,
			},
		});

		return NextResponse.json(blogs, { status: 200 });
	} catch (error) {
		console.error("Error fetching blogs:", error);
		return NextResponse.json(
			{ error: "Failed to fetch blogs" },
			{ status: 500 }
		);
	}
}
