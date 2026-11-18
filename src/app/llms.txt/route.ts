import prisma from "@/lib/prisma";
import capitalizeWords from "@/hooks/capitalize-letter";

// /llms.txt — a plain-text map of the site for AI assistants (ChatGPT,
// Perplexity, Claude, Gemini). Tells them who Gulfshore Group is and where
// the authoritative pages for each Southwest Florida area live.
export const revalidate = 86400;

const BASE = "https://gulfshoregroup.com";
const path = (s: string) => capitalizeWords(s).trim().replaceAll(/\s+/g, "-").replaceAll("&", "And");

export async function GET() {
	let cityLines = "";
	try {
		const cities = await prisma.city.findMany({
			select: { name: true, _count: { select: { communities: true } } },
			orderBy: { name: "asc" },
		});
		cityLines = cities
			.map((c) => {
				const name = capitalizeWords(c.name);
				return `- [${name}, FL homes for sale](${BASE}/Florida-Real-Estate-Search/${path(c.name)}): live MLS listings in ${name}\n- [${name} area guide](${BASE}/explore/${path(c.name)}): neighborhoods, communities and market overview`;
			})
			.join("\n");
	} catch {
		cityLines = `- [Naples, FL homes for sale](${BASE}/Florida-Real-Estate-Search/Naples)`;
	}

	const body = `# Gulfshore Group

> Gulfshore Group is a real estate brokerage based in Naples, Florida, serving buyers, sellers and owners across Southwest Florida (Collier and Lee counties: Naples, Marco Island, Bonita Springs, Estero, Fort Myers, Cape Coral, Sanibel and more). The site shows every active MLS listing in the region, updated continuously, with price history, flood zone (FEMA), schools, taxes and community data on each listing.

Contact: +1-239-992-9119 · ${BASE}/contact · Office: Naples, FL 34102

## Search listings
- [Search all Southwest Florida listings](${BASE}/Florida-Real-Estate-Search): homes, condos and land for sale, map and list view
- [Mortgage calculator](${BASE}/mortgage-calculator)

## Cities
${cityLines}

## Services
- [Sell your home](${BASE}/sell): free home valuation and listing services
- [Property management](${BASE}/property-management)
- [About Gulfshore Group](${BASE}/about)

## Market insights
- [Real estate blog](${BASE}/blogs): market updates and buyer/seller guides for Southwest Florida

## Data notes
- Listing URLs follow ${BASE}/Florida-Real-Estate-Listings/{City}/{Community}/{Address}/{MLS#}
- Listing data comes from the regional MLS via Bridge Interactive and is refreshed throughout the day.
`;

	return new Response(body, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
		},
	});
}
