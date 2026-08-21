import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const maxDuration = 300; // 5 minutes max duration for serverless functions

export async function POST(req: Request) {
	try {
		const { communityId, isGolfCommunity } = await req.json();

		if (!communityId) {
			return NextResponse.json({ error: "Community ID is required" }, { status: 400 });
		}

		// Update the golf community status in the DB
		const community = await prisma.community.update({
			where: { id: parseInt(communityId) },
			data: { isGolfCommunity: isGolfCommunity },
			include: { city: true }
		});

		if (!community) {
			return NextResponse.json({ error: "Community not found" }, { status: 404 });
		}

		// Prompt construction
		let systemPrompt = `You are an expert luxury real estate content writer for Gulfshore Group in Southwest Florida.
Your task is to write a highly detailed, comprehensive, and SEO-friendly article (minimum 1200 words) for ${community.name} located in ${community.city.name}, Florida.

You must deeply cover the following 5 points in your description:
1. What the community/business is about (History, architecture, overarching vibe)
2. Who it is for (Target demographic, lifestyle appeal)
3. Main activities/services (Recreation, dining, events)
4. Key benefits (Location advantages, luxury living, security)
5. Specific details/examples (Notable neighborhoods, famous nearby attractions, precise distances to key Naples/SWFL landmarks)

Output your response as a valid JSON object with the following keys:
- "infoText": A beautifully formatted HTML description of the community based on the above requirements (aim for at least 1200 words). Use <h2>, <h3>, <p>, <ul>, and <li> tags extensively for readability. Make sure headings and important features are bolded. Do not wrap in markdown code blocks. Do not add <html> or <body> tags, just the inner content.
- "title": An SEO-optimized meta title (max 60 characters).
- "metaDescription": An SEO-optimized meta description (max 160 characters).
- "keywords": A comma-separated list of highly relevant SEO keywords.`;

		if (isGolfCommunity) {
			systemPrompt += `\n- "golfCourses": An array of objects, where each object represents a golf course in this community. Each object MUST have the following string keys: "name" (e.g. "South Course"), "architect" (e.g. "Tom Fazio"), "holes" (e.g. "18"), "par" (e.g. "72"), "opened" (e.g. "2002"), "yards" (e.g. "7100"), "rating" (e.g. "74.5"), "slope" (e.g. "138"). If you don't know a specific statistic, leave it as an empty string "".\n\nCRITICAL INSTRUCTION: This is a Golf Community. In the "infoText", you MUST explicitly list the specific names of the golf courses it has. For EACH course, you MUST state exactly how many holes it has (e.g., 18-hole, 36-hole), the course architect/designer (e.g., Tom Fazio), the par rating, and the year it opened (if available). Format these specific golf course details prominently, such as using a dedicated HTML <ul> or a table so it stands out. Additionally, include membership options, initiation fees, and club amenities. Be highly specific about the golf offerings in ${community.name}.`;
		} else {
			systemPrompt += `\n\nThis is a beautiful non-golf community. Focus deeply on the natural beauty, waterfront access (if applicable), community amenities, and neighborhood charm in the "infoText".`;
		}

		const completion = await openai.createChatCompletion({
			model: "gpt-4o", // using gpt-4o for better reasoning and knowledge base
			messages: [
				{
					role: "system",
					content: systemPrompt
				},
				{
					role: "user",
					content: `Please generate the SEO data and HTML description for the community of ${community.name} in ${community.city.name}, FL.`
				}
			],
			temperature: 0.7,
		});

		const rawContent = completion.data.choices?.[0]?.message?.content || "{}";
		// Clean up markdown wrapping if the AI accidentally adds it
		const cleanJsonStr = rawContent.replace(/^```json/i, "").replace(/```$/i, "").trim();
		
		let parsedData;
		try {
			parsedData = JSON.parse(cleanJsonStr);
		} catch (e) {
			console.error("Failed to parse JSON from AI:", cleanJsonStr);
			return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
		}

		const descriptionPayload = JSON.stringify({
			infoText: parsedData.infoText || "",
			title: parsedData.title || "",
			metaDescription: parsedData.metaDescription || "",
			keywords: parsedData.keywords || "",
			...(parsedData.golfCourses ? { golfCourses: parsedData.golfCourses } : {})
		});

		// Save the generated JSON to the community description
		const updatedCommunity = await prisma.community.update({
			where: { id: community.id },
			data: { description: descriptionPayload }
		});

		return NextResponse.json({ success: true, community: updatedCommunity, parsedData });
	} catch (error: any) {
		console.error("Error generating community AI description:", error);
		return NextResponse.json({ error: "Failed to generate AI description", details: error.message }, { status: 500 });
	}
}
