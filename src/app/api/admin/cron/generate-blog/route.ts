import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateBlogFromMemory, pickRandomTopic } from "@/lib/openai";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: Request) {
  // 1. Verify Secret (Allow via Header or Query Param)
  const url = new URL(req.url);
  const secretParam = url.searchParams.get("secret");
  const authHeader = req.headers.get("authorization");
  
  const isValidAuth = 
    (authHeader === `Bearer ${CRON_SECRET}`) || 
    (secretParam === CRON_SECRET);

  if (!isValidAuth) {
    return new NextResponse(
      JSON.stringify({ error: "Invalid or missing CRON secret" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Choose 4 Unique Topics
  const topicSet = new Set<string>();
  while (topicSet.size < 4) {
    topicSet.add(pickRandomTopic());
  }
  const topics = Array.from(topicSet);

  // 3. Run OpenAI Generation & DB Save in background to avoid cron-job timeout
  (async () => {
    try {
      console.log("[AI Blog Batch] Starting background generation for topics:", topics);
      const blogPromises = topics.map(topic => generateBlogFromMemory(topic));
      const blogs = await Promise.all(blogPromises);

      // Array of valid luxury home images from images.unsplash.com
      const defaultImages = [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600607687931-cebf006362ce?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=1200&auto=format&fit=crop"
      ];

      // 4. Save to Database
      const createdBlogs = await Promise.all(
        blogs.map((blog, index) =>
          prisma.blog.create({
            data: {
              title: blog.title,
              slug: blog.slug + "-" + Math.random().toString(36).substring(2, 7), // Ensure unique slug
              description: blog.description,
              content: blog.content,
              coverImage: blog.coverImage || defaultImages[index % defaultImages.length], 
              category: blog.category,
              metaTitle: blog.metaTitle,
              metaDescription: blog.metaDescription,
              metaKeywords: blog.metaKeywords ? (blog.metaKeywords as any) : [],
              author: blog.author || "Gulfshore Group",
              published: false, // Save as Draft for review
              publishedAt: null,
            },
          })
        )
      );
      console.log(`[AI Blog Batch] Successfully generated and saved ${createdBlogs.length} Blogs`);
    } catch (err: any) {
      console.error("[AI Blog Batch Background Error]:", err?.message || err);
    }
  })();

  // 5. Return immediately
  return new NextResponse(
    JSON.stringify({
      message: "Blog batch generation started in background",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
