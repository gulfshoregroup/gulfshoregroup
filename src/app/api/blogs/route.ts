import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
	try {
		const blogs = await prisma.blog.findMany({
			orderBy: {
				createdAt: "desc",
			},
		});
		const totalCount = await prisma.blog.count();
		return NextResponse.json({
			data: blogs,
			success: true,
			totalCount,
		});
	} catch (error: any) {
		console.error("Error fetching blogs:", error);
		return NextResponse.json(
			{ success: false, error: error.message },
			{ status: 500 }
		);
	}
}

export async function POST(req: any) {
	try {
		let title = "", slug = "", description = "", content = "", category = "others", metaTitle = "", metaDescription = "", metaKeywords: string[] = [], coverImage = "";

		const contentType = req.headers.get("content-type") || "";
		if (contentType.includes("application/json")) {
			const body = await req.json();
			title = body.title || "";
			slug = body.slug || "";
			description = body.description || "";
			content = body.content || "";
			category = body.category || "others";
			metaTitle = body.metaTitle || title;
			metaDescription = body.metaDescription || "";
			metaKeywords = Array.isArray(body.metaKeywords) ? body.metaKeywords : (body.metaKeywords ? body.metaKeywords.split(",") : []);
			coverImage = body.coverImage || "";
		} else {
			const formData = await req.formData();
			title = formData.get("title")?.toString() || "";
			slug = formData.get("slug")?.toString() || "";
			description = formData.get("description")?.toString() || "";
			content = formData.get("content")?.toString() || "";
			category = formData.get("category")?.toString() || "others";
			metaTitle = formData.get("metaTitle")?.toString() || title;
			metaDescription = formData.get("metaDescription")?.toString() || "";
			const metaKeywordsRaw = formData.get("metaKeywords")?.toString() || "";
			metaKeywords = metaKeywordsRaw ? metaKeywordsRaw.split(",") : [];
			coverImage = formData.get("coverImage")?.toString() || "";
		}

		const blog = await prisma.blog.create({
			data: {
				title,
				slug,
				description,
				content,
				category,
				metaTitle,
				metaDescription,
				metaKeywords: metaKeywords, // JSON array of strings
				coverImage,
				published: true,
				publishedAt: new Date(),
			},
		});

		return NextResponse.json({ success: true, data: blog }, { status: 201 });
	} catch (error: any) {
		console.error("Error creating blog:", error);
		return NextResponse.json(
			{ success: false, message: "Error creating blog", error: error.message },
			{ status: 500 }
		);
	}
}
