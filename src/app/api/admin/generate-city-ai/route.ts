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
		const { cityId } = await req.json();

		if (!cityId) {
			return NextResponse.json({ error: "City ID is required" }, { status: 400 });
		}

		const city = await prisma.city.findUnique({
			where: { id: parseInt(cityId) }
		});

		if (!city) {
			return NextResponse.json({ error: "City not found" }, { status: 404 });
		}

		// Prompt construction
		let systemPrompt = `You are an expert luxury real estate content writer for Gulfshore Group in Southwest Florida.
Your task is to write a highly detailed, comprehensive, and SEO-friendly article (minimum 1200 words) for the city of ${city.name}, Florida.

You must deeply cover the following 5 points in your description:
1. What the city/region is about (History, architecture, overarching vibe, lifestyle)
2. Who it is for (Target demographic, lifestyle appeal, families vs retirees)
3. Main activities/services (Recreation, dining, arts, events, golf, beaches)
4. Key benefits (Location advantages, luxury living, schools, climate)
5. Specific details/examples (Notable neighborhoods, famous attractions, precise distances to key SWFL landmarks like the airport or Gulf beaches)

Output your response as a valid JSON object with the following keys:
- "infoText": A beautifully formatted HTML description of the city based on the above requirements (aim for at least 1200 words). Use <h2>, <h3>, <p>, <ul>, and <li> tags extensively for readability. Make sure headings and important features are bolded. Do not wrap in markdown code blocks. Do not add <html> or <body> tags, just the inner content.
- "title": An SEO-optimized meta title (max 60 characters).
- "metaDescription": An SEO-optimized meta description (max 160 characters).
- "keywords": A comma-separated list of highly relevant SEO keywords.`;

		const completion = await openai.createChatCompletion({
			model: "gpt-4o", // using gpt-4o for better reasoning and knowledge base
			messages: [
				{
					role: "system",
					content: systemPrompt
				},
				{
					role: "user",
					content: `Please generate the SEO data and HTML description for the city of ${city.name}, FL.`
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
			keywords: parsedData.keywords || ""
		});

		// Save the generated JSON to the city description
		const updatedCity = await prisma.city.update({
			where: { id: city.id },
			data: { description: descriptionPayload }
		});

		return NextResponse.json({ success: true, city: updatedCity, parsedData });
	} catch (error: any) {
		console.error("Error generating city AI description:", error);
		return NextResponse.json({ error: "Failed to generate AI description", details: error.message }, { status: 500 });
	}
}
