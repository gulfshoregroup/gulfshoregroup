import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export const maxDuration = 300; // 5 minutes max duration for serverless functions (Vercel)

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const secret = searchParams.get("secret");

		if (secret !== process.env.CRON_SECRET) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const pageId = process.env.FACEBOOK_PAGE_ID;
		const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;

		if (!pageId || !accessToken) {
			return NextResponse.json({ error: "Missing Facebook credentials" }, { status: 500 });
		}

		// 2. Process each post in the background
		(async () => {
			let addedCount = 0;
			let pageCount = 0;
			let nextUrl: string | null = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=id,message,full_picture,permalink_url,created_time&access_token=${accessToken}&limit=100`;

			console.log(`[FB Fetch Background] Starting dynamic fetch...`);

			while (nextUrl && pageCount < 10) { // Max 10 pages per run (1000 posts) to prevent timeout
				try {
					console.log(`[FB Fetch Background] Fetching page ${pageCount + 1}...`);
					const fbResponse = await fetch(nextUrl);
					const fbData = await fbResponse.json();

					if (fbData.error) {
						console.error("[FB Fetch Background] Facebook API Error:", fbData.error);
						break;
					}

					const posts = fbData.data || [];
					if (posts.length === 0) break;

					let processedAnyNew = false;

					for (const post of posts) {
						if (!post.message) continue; // Skip posts without text

						// Check if already processed
						const existingBlog = await prisma.blog.findUnique({
							where: { fbPostId: post.id }
						});

						if (existingBlog) continue; // Skip already added

						processedAnyNew = true; // We found at least one new post on this page

						try {
							// 3. Rewrite using OpenAI
							const completion = await openai.createChatCompletion({
								model: "gpt-4o-mini", // fallback to gpt-4o-mini to be safer/cheaper
								messages: [
									{
										role: "system",
										content: "You are an expert Florida Real Estate Blogger. Your job is to take raw social media posts and turn them into highly engaging, SEO-friendly professional blog posts. The output should have a catchy Title, an engaging intro, body paragraphs, and a brief conclusion. Output in raw HTML format, but do not wrap it in ```html markdown blocks. Only return the raw HTML starting with <h1> for the title."
									},
									{
										role: "user",
										content: `Please rewrite this Facebook post into a blog post:\n\n${post.message}`
									}
								],
								temperature: 0.7,
							});

							const rewrittenContent = completion.data.choices?.[0]?.message?.content || "";
							
							// Extract H1 title if present
							let title = "Real Estate Update";
							const titleMatch = rewrittenContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
							if (titleMatch && titleMatch[1]) {
								title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
							} else {
								// Fallback to first line or generated title
								const firstLineMatch = rewrittenContent.match(/<p[^>]*>(.*?)<\/p>/i);
								if (firstLineMatch && firstLineMatch[1]) {
									title = firstLineMatch[1].substring(0, 50) + "...";
								}
							}

							// Generate slug from title
							const slug = title
								.toLowerCase()
								.replace(/[^a-z0-9]+/g, '-')
								.replace(/(^-|-$)+/g, '');

							// Extract description from content
							const descriptionMatch = rewrittenContent.match(/<p[^>]*>(.*?)<\/p>/i);
							const description = descriptionMatch && descriptionMatch[1] 
								? descriptionMatch[1].substring(0, 150) + "..." 
								: "A new blog post from our social media update.";

							// 4. Save to Database
							await prisma.blog.create({
								data: {
									fbPostId: post.id,
									title: title,
									slug: slug + "-" + post.id.substring(0, 5), // Ensure unique slug
									description: description,
									content: rewrittenContent,
									coverImage: post.full_picture || null,
									originalFbLink: post.permalink_url || `https://facebook.com/${post.id}`,
									category: "facebook",
									metaTitle: title,
									metaDescription: description,
									published: true,
									publishedAt: new Date(post.created_time || Date.now()),
									createdAt: new Date(post.created_time || Date.now())
								}
							});

							addedCount++;

						} catch (err) {
							console.error(`Error processing post ${post.id}:`, err);
							// Continue with next post
						}
					}

					// If we scanned an entire page of 100 posts and ALL of them were already in the DB,
					// we can safely stop paginating because we've caught up to the old history!
					if (!processedAnyNew) {
						console.log(`[FB Fetch Background] All posts on page ${pageCount + 1} were already in the database. Stopping pagination to save resources.`);
						break;
					}

					// Get next page URL
					nextUrl = fbData.paging?.next || null;
					pageCount++;

				} catch (err) {
					console.error("[FB Fetch Background] Error during pagination:", err);
					break;
				}
			}

			console.log(`[FB Fetch Background] Finished processing. Added ${addedCount} new blogs across ${pageCount} pages.`);
		})();

		return NextResponse.json({
			success: true,
			message: `Started processing Facebook posts with dynamic pagination in the background.`
		});

	} catch (err: any) {
		console.error("Cron Error:", err);
		return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
	}
}
