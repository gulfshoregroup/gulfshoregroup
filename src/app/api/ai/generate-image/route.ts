import { NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai";
import { v2 as cloudinary } from 'cloudinary';

// Configure OpenAI
const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
	try {
		const { title, description } = await req.json();

		if (!title) {
			return NextResponse.json(
				{ error: "Blog title is required to generate an image." },
				{ status: 400 }
			);
		}

		// 1. Create a detailed prompt for DALL-E
		const prompt = `A professional, high-quality, photorealistic cover image for a real estate blog post titled "${title}". The image should be visually appealing, modern, and related to real estate, property, or Florida lifestyle. ${
			description ? `Context: ${description.substring(0, 100)}` : ""
		} No text or words in the image.`;

		// 2. Generate Image with OpenAI
		const response = await openai.createImage({
			prompt,
			n: 1,
			size: "1024x1024",
		});

		const imageUrl = response.data.data[0].url;

		if (!imageUrl) {
			throw new Error("Failed to generate image from OpenAI.");
		}

		// 3. Upload to Cloudinary to make it permanent
		const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
			folder: "gulfshore/blogs",
			resource_type: "image",
		});

		return NextResponse.json({ url: uploadResponse.secure_url });
	} catch (error: any) {
		console.error("AI Image Generation Error:", error.response?.data || error.message);
		return NextResponse.json(
			{ error: "Failed to generate or save image." },
			{ status: 500 }
		);
	}
}
