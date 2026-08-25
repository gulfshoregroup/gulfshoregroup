import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateMultipleFAQs } from "@/lib/openai";

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

  // 2. Run OpenAI Generation & DB Save in background to avoid cron-job timeout
  (async () => {
    try {
      console.log("[AI FAQ Batch] Starting background generation...");
      const faqs = await generateMultipleFAQs(10);
      
      const createdFaqs = await Promise.all(
        faqs.map((faq: any) =>
          prisma.faq.create({
            data: {
              question: faq.question,
              answer: faq.answer,
              category: "City",
              isActive: false, // Save as Draft for review
            },
          })
        )
      );
      console.log(`[AI FAQ Batch] Successfully generated and saved ${createdFaqs.length} FAQs`);
    } catch (err: any) {
      console.error("[AI FAQ Batch Background Error]:", err?.message || err);
    }
  })();

  // 3. Return immediately
  return new NextResponse(
    JSON.stringify({
      message: "FAQ batch generation started in background",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
