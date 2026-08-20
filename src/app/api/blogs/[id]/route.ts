import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: any, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		
		// Attempt to find by ID first
		let blog = await prisma.blog.findUnique({
			where: { id },
		});

		// Fallback to finding by slug
		if (!blog) {
			blog = await prisma.blog.findUnique({
				where: { slug: id },
			});
		}

		if (!blog) {
			return NextResponse.json(
				{ success: false, message: "Blog not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({ success: true, data: blog });
	} catch (error: any) {
		console.error("Error fetching blog:", error);
		return NextResponse.json(
			{ success: false, message: "Server error", error: error.message },
			{ status: 500 }
		);
	}
}

export async function PUT(req: any, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		let title, slugVal, description, content, category, metaTitle, metaDescription, metaKeywords, coverImage, published;

		const contentType = req.headers.get("content-type") || "";
		if (contentType.includes("application/json")) {
			const body = await req.json();
			title = body.title;
			slugVal = body.slug;
			description = body.description;
			content = body.content;
			category = body.category;
			metaTitle = body.metaTitle;
			metaDescription = body.metaDescription;
			metaKeywords = Array.isArray(body.metaKeywords) ? body.metaKeywords : (body.metaKeywords ? body.metaKeywords.split(",") : undefined);
			coverImage = body.coverImage;
			published = body.published;
		} else {
			const formData = await req.formData();
			title = formData.get("title")?.toString();
			slugVal = formData.get("slug")?.toString();
			description = formData.get("description")?.toString();
			content = formData.get("content")?.toString();
			category = formData.get("category")?.toString();
			metaTitle = formData.get("metaTitle")?.toString();
			metaDescription = formData.get("metaDescription")?.toString();
			const metaKeywordsRaw = formData.get("metaKeywords")?.toString();
			metaKeywords = metaKeywordsRaw ? metaKeywordsRaw.split(",") : undefined;
			coverImage = formData.get("coverImage")?.toString();
			const pubVal = formData.get("published")?.toString();
			published = pubVal !== undefined ? pubVal !== "false" : undefined;
		}

		const updateData: any = {};
		if (title !== undefined) updateData.title = title;
		if (slugVal !== undefined) updateData.slug = slugVal;
		if (description !== undefined) updateData.description = description;
		if (content !== undefined) updateData.content = content;
		if (category !== undefined) updateData.category = category;
		if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
		if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
		if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;
		if (coverImage !== undefined) updateData.coverImage = coverImage;
		if (published !== undefined) updateData.published = published;

		// Perform find by ID or slug to locate the blog first
		let blogRecord = await prisma.blog.findUnique({
			where: { id },
		});
		if (!blogRecord) {
			blogRecord = await prisma.blog.findUnique({
				where: { slug: id },
			});
		}

		if (!blogRecord) {
			return NextResponse.json(
				{ success: false, message: "Blog not found" },
				{ status: 404 }
			);
		}

		if (published === true && !blogRecord.publishedAt) {
			updateData.publishedAt = new Date();
		}

		const updatedBlog = await prisma.blog.update({
			where: { id: blogRecord.id },
			data: updateData,
		});

		return NextResponse.json({ success: true, data: updatedBlog });
	} catch (error: any) {
		console.error("Error updating blog:", error);
		return NextResponse.json(
			{ success: false, message: "Error updating blog", error: error.message },
			{ status: 500 }
		);
	}
}

export async function DELETE(req: any, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;

		let blogRecord = await prisma.blog.findUnique({
			where: { id },
		});
		if (!blogRecord) {
			blogRecord = await prisma.blog.findUnique({
				where: { slug: id },
			});
		}

		if (!blogRecord) {
			return NextResponse.json(
				{ success: false, message: "Blog not found" },
				{ status: 404 }
			);
		}

		await prisma.blog.delete({
			where: { id: blogRecord.id },
		});

		return NextResponse.json({ success: true, message: "Blog deleted successfully" });
	} catch (error: any) {
		console.error("Error deleting blog:", error);
		return NextResponse.json(
			{ success: false, message: "Error deleting blog", error: error.message },
			{ status: 500 }
		);
	}
}
