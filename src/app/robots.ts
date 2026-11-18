import { MetadataRoute } from "next";

// Private / non-content paths. Kept out of search and AI indexes.
const PRIVATE = [
	"/admin/",
	"/api/",
	"/user/",
	"/favorites",
	"/sign-agreement/",
	"/sso-callback/",
	"/email-preview",
	"/sync-pending",
	"/sync-sold",
	"/sync-test",
	"/search/",
	"/*?*utm_",
];

// AI search / answer-engine crawlers. Explicitly allowed so ChatGPT Search,
// Perplexity, Claude, Google AI Overviews / Gemini, Bing Copilot, Apple
// Intelligence etc. can read and cite gulfshoregroup.com.
const AI_BOTS = [
	"GPTBot",
	"OAI-SearchBot",
	"ChatGPT-User",
	"PerplexityBot",
	"Perplexity-User",
	"ClaudeBot",
	"Claude-SearchBot",
	"Claude-User",
	"Google-Extended",
	"Applebot",
	"Applebot-Extended",
	"bingbot",
	"DuckAssistBot",
	"Amazonbot",
	"meta-externalagent",
	"MistralAI-User",
	"cohere-ai",
];

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{ userAgent: "*", allow: "/", disallow: PRIVATE },
			{ userAgent: AI_BOTS, allow: "/", disallow: PRIVATE },
		],
		sitemap: "https://gulfshoregroup.com/sitemap.xml",
		host: "https://gulfshoregroup.com",
	};
}
