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

  // 2. Generate 10 FAQs in one OpenAI Call
  let faqs;
  try {
    faqs = await generateMultipleFAQs(10);
  } catch (err: any) {
    console.error("[AI FAQ Batch] generation error:", err);
    return new NextResponse(
      JSON.stringify({ error: "OpenAI FAQ batch generation failed", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Save New FAQs as Drafts (Inactive)
  try {
    // Insert new ones as Drafts
    const createdFaqs = await Promise.all(
      faqs.map((faq: any) =>
        prisma.faq.create({
          data: {
            question: faq.question,
            answer: faq.answer,
            category: "City", // Always assign to City so it shows up on website
            isActive: false, // Save as Draft for review
          },
        })
      )
    );

    return new NextResponse(
      JSON.stringify({
        message: "Old FAQs deleted and 10 new FAQs generated and published successfully",
        count: createdFaqs.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (dbErr: any) {
    console.error("[AI FAQ Batch] DB error:", dbErr);
    return new NextResponse(
      JSON.stringify({ error: "Database operation failed", details: dbErr.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
