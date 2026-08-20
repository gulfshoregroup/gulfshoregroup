import "dotenv/config";
import prisma from "./src/lib/prisma";

const sampleBlogs = [
	{
		title: "Southwest Florida Luxury Real Estate Market Trends 2026",
		slug: "southwest-florida-luxury-real-estate-market-trends-2026",
		description:
			"An in-depth analysis of waterfront property demand, pricing forecasts, and investment opportunities in Naples, Marco Island, and Bonita Springs.",
		content: `
			<h2>The Resilient Demand for Coastal Luxury</h2>
			<p>Southwest Florida continues to be one of the premier luxury real estate markets in the United States. Driven by high net worth individuals seeking tax-friendly states, year-round sunshine, and pristine coastal living, market fundamentals remain exceptionally strong.</p>
			
			<h3>Key Highlights for 2026 Buyers and Sellers:</h3>
			<ul>
				<li><strong>Waterfront Premium:</strong> Gulf-access homes and beachfront condos in Naples (Port Royal, Old Naples, Pelican Bay) command strong values due to limited inventory.</li>
				<li><strong>Golf & Country Club Communities:</strong> High demand for bundled golf developments in Estero and Bonita Springs with modern clubhouse upgrades.</li>
				<li><strong>New Construction Shift:</strong> Buyers increasingly prefer turn-key, newly constructed homes with impact glass, metal roofs, and smart home automation.</li>
			</ul>

			<h2>What This Means for Investors</h2>
			<p>Whether looking for a primary residence or a secondary luxury vacation home, holding property in SWFL has historically yielded strong appreciation and steady rental demand. Contact Gulfshore Group to explore active and off-market listings today.</p>
		`,
		coverImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
		category: "market-trends",
		metaTitle: "Southwest Florida Luxury Real Estate Trends 2026 | Gulfshore Group",
		metaDescription: "Explore 2026 market trends, property values, and luxury home forecasts in Naples and Southwest Florida.",
		metaKeywords: ["Southwest Florida Real Estate", "Naples Luxury Homes", "Market Report 2026", "Gulfshore Group"],
		author: "Dimitri Schwarz",
		published: true,
		publishedAt: new Date("2026-07-20T10:00:00Z"),
	},
	{
		title: "Top Waterfront Communities in Naples & Marco Island",
		slug: "top-waterfront-communities-naples-marco-island",
		description:
			"Discover the most exclusive waterfront neighborhoods featuring deepwater docks, direct Gulf access, and private beach access.",
		content: `
			<h2>Living the Coastal Lifestyle in SWFL</h2>
			<p>For boaters, yachtsmen, and beach lovers, Naples and Marco Island offer unmatched waterfront options. Here is a curated guide to the top communities in the region:</p>
			
			<h3>1. Port Royal (Naples)</h3>
			<p>Universally recognized as one of the world's most prestigious waterfront communities. Deepwater canals accommodate large yachts with direct, no-bridge access to the Gulf of Mexico.</p>

			<h3>2. Hideaway Beach (Marco Island)</h3>
			<p>A private, gated beachfront community offering single-family luxury homes and condos surrounded by mangroves and Gulf waters.</p>

			<h3>3. Aqualane Shores & Royal Harbor</h3>
			<p>Located just south of Fifth Avenue South, offering deepwater boating access just minutes from Naples' world-class dining and boutique shopping.</p>
		`,
		coverImage: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
		category: "neighborhood-guides",
		metaTitle: "Top Waterfront Communities in Naples & Marco Island | Gulfshore Group",
		metaDescription: "Discover luxury waterfront communities in Naples and Marco Island with Gulf access and private docks.",
		metaKeywords: ["Naples Waterfront Homes", "Marco Island Boating", "Port Royal Naples", "Gulfshore Group"],
		author: "Gulfshore Group Team",
		published: true,
		publishedAt: new Date("2026-07-22T14:30:00Z"),
	},
	{
		title: "Home Buyer's Guide to Ave Maria & Bonita Springs",
		slug: "home-buyers-guide-ave-maria-bonita-springs",
		description:
			"Everything you need to know about purchasing a home in rapidly growing Master-Planned communities in Southwest Florida.",
		content: `
			<h2>Why Buyers are Choosing Ave Maria and Bonita Springs</h2>
			<p>Ave Maria and Bonita Springs represent two of the fastest-growing regions in Southwest Florida, offering incredible value, top-rated schools, and exceptional community amenities.</p>

			<h3>Ave Maria: Master-Planned Excellence</h3>
			<p>Featuring walkable town centers, water parks, sports complexes, and new home construction options for families, retirees, and first-time buyers alike.</p>

			<h3>Bonita Springs: Between Naples & Fort Myers</h3>
			<p>Offering luxury golf courses, Barefoot Beach access, and proximity to Southwest Florida International Airport (RSW).</p>
		`,
		coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
		category: "buyer-tips",
		metaTitle: "Ave Maria & Bonita Springs Home Buyer Guide | Gulfshore Group",
		metaDescription: "Learn about living in Ave Maria and Bonita Springs, Florida. Community features, real estate pricing, and amenities.",
		metaKeywords: ["Ave Maria Real Estate", "Bonita Springs Homes", "Florida Relocation Guide"],
		author: "Dimitri Schwarz",
		published: true,
		publishedAt: new Date("2026-07-24T09:15:00Z"),
	},
	{
		title: "Navigating HOA Fees and Coastal Insurance in Florida",
		slug: "navigating-hoa-fees-and-coastal-insurance-in-florida",
		description:
			"Essential guidance on home association fees, hurricane protection, and property insurance when buying coastal property.",
		content: `
			<h2>Understanding HOA & Master Association Structure</h2>
			<p>Many communities in Southwest Florida feature HOAs that cover landscaping, irrigation, security, and resort amenities. Understanding what is included in your monthly or quarterly dues helps you budget effectively.</p>

			<h3>Key Takeaways for Buyers:</h3>
			<ul>
				<li>Verify if fees cover master association dues, bundled golf, or cable/internet.</li>
				<li>Check for windstorm insurance mitigation credits (impact windows, roof age, hurricane shutters).</li>
				<li>Work with a local agent who understands community reserve studies and budget health.</li>
			</ul>
		`,
		coverImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80",
		category: "buyer-tips",
		metaTitle: "Florida HOA Fees & Home Insurance Guide | Gulfshore Group",
		metaDescription: "Important tips on Florida home insurance, HOA fees, and property buyer guidelines in Southwest Florida.",
		metaKeywords: ["Florida HOA Fees", "Home Insurance SWFL", "Gulfshore Group Buyer Tips"],
		author: "Gulfshore Group Team",
		published: true,
		publishedAt: new Date("2026-07-25T08:00:00Z"),
	},
];

async function seed() {
	console.log("Seeding Real Estate Blog articles into database...");

	for (const blogData of sampleBlogs) {
		try {
			const blog = await prisma.blog.upsert({
				where: { slug: blogData.slug },
				update: {
					title: blogData.title,
					description: blogData.description,
					content: blogData.content,
					coverImage: blogData.coverImage,
					category: blogData.category,
					metaTitle: blogData.metaTitle,
					metaDescription: blogData.metaDescription,
					metaKeywords: blogData.metaKeywords,
					author: blogData.author,
					published: blogData.published,
					publishedAt: blogData.publishedAt,
				},
				create: blogData,
			});
			console.log(`✓ Seeded blog: "${blog.title}" (${blog.slug})`);
		} catch (error: any) {
			console.error(`✗ Error seeding blog "${blogData.title}":`, error.message);
		}
	}

	console.log("Blog seeding completed successfully!");
}

seed()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
