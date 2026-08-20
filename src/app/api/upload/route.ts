import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const file = formData.get("file") as File | null;

		if (!file) {
			return NextResponse.json({ error: "No file received." }, { status: 400 });
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Get original extension
		const ext = path.extname(file.name) || ".jpg";
		const uniqueFilename = `${crypto.randomUUID()}${ext}`;
		
		// Define upload directory and path
		const uploadDir = path.join(process.cwd(), "public/uploads/properties");
		const filepath = path.join(uploadDir, uniqueFilename);

		// Ensure directory exists
		await mkdir(uploadDir, { recursive: true });

		// Write file
		await writeFile(filepath, buffer);

		// Return the public URL
		const fileUrl = `/uploads/properties/${uniqueFilename}`;

		return NextResponse.json({ success: true, url: fileUrl }, { status: 201 });
	} catch (error: any) {
		console.error("Error uploading file:", error);
		return NextResponse.json({ success: false, error: "Failed to upload file" }, { status: 500 });
	}
}
