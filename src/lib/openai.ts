// src/lib/openai.ts

import { Configuration, OpenAIApi } from "openai";
import { Blog } from "../app/generated/prisma/client";

// Initialise OpenAI client – the key is stored in .env as OPENAI_API_KEY
const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(config);

/**
 * Generate a SEO‑friendly real‑estate blog using only the model's internal knowledge.
 * The prompt tells the model to act as Gulfshore Group’s expert and to output
 * a JSON structure that matches our Prisma Blog schema.
 */
export async function generateBlogFromMemory(topic: string): Promise<Blog> {
  const systemPrompt = `You are an experienced real‑estate content writer for Gulfshore Group, a luxury agency covering Southwest Florida (Naples, Fort Myers, Cape Coral, etc.).
Write a complete SEO‑friendly blog post about the given topic. Return the result as a JSON object with the following fields exactly:
- title (string)
- slug (string, URL‑friendly, lowercase, hyphens)
- description (short 2‑3 sentence summary)
- content (full HTML string, use <h2>, <p>, <ul>, <li> tags as needed)
- coverImage (set this to empty string "")
- category (choose from "market", "buyer_guide", "seller_guide", "general")
- metaTitle (string, ≤ 60 chars)
- metaDescription (string, ≤ 160 chars)
- metaKeywords (JSON array of keywords)
- author (set to "Gulfshore Group")
- published (false – draft)
You may invent any data needed; rely only on your internal knowledge, no external API calls.
Remember to escape any double quotes inside JSON strings.
Topic: "${topic}"`;

  const response = await openai.createChatCompletion({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const raw = response.data.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("OpenAI returned empty content");
  }

  // Parse the JSON returned by the model.
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Failed to extract JSON from OpenAI response");
    parsed = JSON.parse(match[0]);
  }

  // Build a Blog object compatible with Prisma.
  const blog: Blog = {
    id: parsed.id ?? undefined,
    title: parsed.title,
    slug: parsed.slug,
    description: parsed.description,
    content: parsed.content,
    coverImage: parsed.coverImage,
    category: parsed.category,
    metaTitle: parsed.metaTitle,
    metaDescription: parsed.metaDescription,
    metaKeywords: parsed.metaKeywords,
    author: parsed.author,
    published: parsed.published,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Blog;

  return blog;
}

/**
 * Helper to pick a random topic for the cron job.
 */
export function pickRandomTopic(): string {
  const topics = [
    "Current Naples market trends and price outlook",
    "Top 5 things first‑time home buyers should know in Florida",
    "How to stage your waterfront property for a quick sale",
    "Understanding property taxes in Collier County",
    "Benefits of living in a gated community in Southwest Florida",
    "Guide to buying a vacation home in Fort Myers",
    "Seller’s checklist for a successful home sale",
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * Generate a real estate FAQ using internal knowledge.
 */
export async function generateFAQ(topic: string) {
  const systemPrompt = `You are a knowledgeable real‑estate FAQ writer for Gulfshore Group.
Write ONE FAQ (question + answer) about the given topic. Return a JSON object with exactly:
{
  "question": "The question string",
  "answer": "The detailed answer string",
  "category": "Buying" // or "Selling" or "General"
}
Only use your internal knowledge, no external API calls.
Topic: "${topic}"`;

  const response = await openai.createChatCompletion({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.6,
    max_tokens: 500,
  });

  const raw = response.data.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("OpenAI returned empty content for FAQ");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Failed to extract JSON from OpenAI FAQ response");
    parsed = JSON.parse(match[0]);
  }

  return {
    question: parsed.question,
    answer: parsed.answer,
    category: parsed.category || "General",
  };
}

/**
 * Helper to pick a random FAQ topic for the cron job.
 */
export function pickRandomFAQTopic(): string {
  const topics = [
    "Mortgage pre-approval process in Florida",
    "Property tax rates in Collier County",
    "Closing timeline for waterfront homes",
    "Differences between condos and single-family homes in Naples",
    "How to handle home inspections when buying",
    "Selling a home with an existing mortgage",
    "HOA fees and regulations in Florida communities",
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}

/**
 * Generate multiple real estate FAQs in a single API call to save time and cost.
 */
export async function generateMultipleFAQs(count: number) {
  const systemPrompt = `You are a knowledgeable real‑estate FAQ writer for Gulfshore Group.
Generate exactly ${count} completely different FAQs (questions and answers) about Southwest Florida real estate (Naples, Fort Myers, etc.).
Return a JSON array of objects, where each object has exactly:
{
  "question": "The question string",
  "answer": "The detailed answer string",
  "category": "Buying" // or "Selling" or "General"
}
Only use your internal knowledge, no external API calls. Ensure the output is a valid JSON array.`;

  const response = await openai.createChatCompletion({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }],
    temperature: 0.7,
    max_tokens: 2500,
  });

  const raw = response.data.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    throw new Error("OpenAI returned empty content for FAQ batch");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Failed to extract JSON array from OpenAI FAQ batch response");
    parsed = JSON.parse(match[0]);
  }

  if (!Array.isArray(parsed)) {
    throw new Error("OpenAI did not return a JSON array for FAQs");
  }

  return parsed.map((faq: any) => ({
    question: faq.question || "Untitled Question",
    answer: faq.answer || "No answer provided.",
    category: faq.category || "General",
  }));
}

export default openai;
