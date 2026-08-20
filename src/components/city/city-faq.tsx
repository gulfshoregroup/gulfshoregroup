"use client";
import React from "react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import capitalizeWords from "@/hooks/capitalize-letter";

export default function CityFAQ({ city }: { city?: string | null }) {
	const displayCity = city ? capitalizeWords(city.replaceAll("-", " ")) : "Naples";

	const defaultFaqs = [
		{
			question: `Why are homebuyers moving to and investing in {displayCity} real estate?`,
			answer: `{displayCity} attracts discerning homebuyers and relocators due to its tax-friendly Florida living, world-class Gulf coast beaches, championship golf communities, and luxury coastal lifestyle. Whether seeking a primary residence, vacation condo, or waterfront estate, buyers consistently choose {displayCity} for long-term value and exceptional quality of life.`,
		},
		{
			question: `What surrounding areas and communities near {displayCity}, FL are popular for homebuyers?`,
			answer: `Beyond premier {displayCity} neighborhoods like Pelican Bay, Olde Naples, and Port Royal, homebuyers frequently explore nearby coastal and planned communities including Bonita Springs, Estero, Marco Island, Ave Maria, Babcock Ranch, and Fort Myers. Each area offers distinct living styles ranging from beachfront condominiums and boating canals to master-planned family and active-adult developments.`,
		},
		{
			question: `Is it a good time to buy a home in {displayCity} and surrounding areas?`,
			answer: `Yes, investing in {displayCity} real estate presents strong long-term opportunities. With steady demand for premium single-family homes, beachfront condos, and golf communities across Southwest Florida, buyers benefit from a stable luxury market, rich inventory, and competitive property values tailored to coastal luxury living.`,
		},
		{
			question: `What is the difference between bundled golf communities and equity golf communities in {displayCity}?`,
			answer: `In bundled golf communities across {displayCity} and Southwest Florida, full golf membership is included with the purchase of the home and conveyed with deeded rights, typically with lower upfront fees. Equity or non-bundled golf communities require a separate initiation fee and annual dues, offering exclusive member caps and tailored club amenities.`,
		},
		{
			question: `Are home prices and property value trends favorable in {displayCity}?`,
			answer: `{displayCity} real estate maintains resilient property values supported by strong lifestyle demand and premier Southwest Florida amenities. Working with experienced local real estate professionals ensures you identify strategically priced listings, exclusive developments, and optimal investment opportunities across {displayCity} and nearby markets.`,
		},
		{
			question: `Are waterfront homes in {displayCity} and surrounding areas equipped with direct Gulf access?`,
			answer: `Many waterfront properties in {displayCity}, Bonita Springs, Marco Island, and Cape Coral offer direct deep-water Gulf access via private boat docks and canals. When evaluating waterfront homes, it is important to check whether the canal access includes fixed bridges or sailboat restrictions depending on your vessel height.`,
		},
		{
			question: `What should buyers know about HOA fees, CDD fees, and community associations in Southwest Florida?`,
			answer: `Most master-planned communities and condominiums in {displayCity} and surrounding areas feature Homeowners Associations (HOAs) or Master Associations that cover resort amenities, landscaping, security, and exterior maintenance. Some developments also include Community Development District (CDD) assessments paid annually alongside property taxes for infrastructure financing.`,
		},
		{
			question: `What are the property tax benefits and homestead exemption for Florida homeowners?`,
			answer: `Florida has no state income tax, making {displayCity} a top financial haven. Primary residents who qualify for the Florida Homestead Exemption receive up to a $50,000 property tax exemption and benefit from the Save Our Homes assessment cap, which limits annual assessed property value increases to a maximum of 3%.`,
		},
		{
			question: `What should buyers look for regarding flood zones, hurricane protection, and insurance?`,
			answer: `When buying coastal real estate in {displayCity} and surrounding areas, buyers should review the FEMA flood zone classification (such as X, AE, or VE zones), elevation certificates, and impact-resistant features like hurricane-rated impact glass windows or reinforced roofing. Newer construction homes built to updated Florida building codes often benefit from favorable insurance premiums.`,
		},
		{
			question: `Can buyers purchase short-term vacation rental properties or seasonal condos in {displayCity}?`,
			answer: `Yes, {displayCity} and surrounding coastal areas are highly sought after for seasonal rental investments. However, each condominium building or HOA development enforces specific leasing restrictions (e.g., minimum 30-day rentals, maximum number of leases per year). Always review community governing documents before purchasing an investment rental property.`,
		},
		{
			question: `How can I find the best homes for sale in {displayCity} and surrounding areas?`,
			answer: `Our comprehensive real estate search platform allows you to browse all active homes for sale in {displayCity} and surrounding Southwest Florida communities. You can filter by price, bedrooms, property type, and specific amenities like private pools, waterfront canals, or Gulf access to find your ideal home.`,
		},
	];

	const [apiFaqs, setApiFaqs] = React.useState<any[]>([]);
	const [expanded, setExpanded] = React.useState(false);

	React.useEffect(() => {
		async function loadFaqs() {
			try {
				const res = await fetch("/api/v2/faqs?category=City&limit=11");
				const json = await res.json();
				if (json.success && Array.isArray(json.data) && json.data.length > 0) {
					// Only keep active FAQs
					const activeOnly = json.data.filter((item: any) => item.isActive !== false);
					if (activeOnly.length > 0) {
						setApiFaqs(activeOnly);
					}
				}
			} catch (e) {
				console.error("Failed to load FAQs from API, falling back to default", e);
			}
		}
		loadFaqs();
	}, []);

	const rawFaqs = apiFaqs.length > 0 ? apiFaqs : defaultFaqs;
	const faqs = rawFaqs.map((f: any) => ({
		question: (f.question || "").replaceAll("{displayCity}", displayCity),
		answer: (f.answer || "").replaceAll("{displayCity}", displayCity),
	}));

	const displayedFaqs = expanded ? faqs : faqs.slice(0, 5);

	const faqSchema = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: faqs.map((faq) => ({
			"@type": "Question",
			name: faq.question,
			acceptedAnswer: {
				"@type": "Answer",
				text: faq.answer,
			},
		})),
	};

	return (
		<div className="w-11/12 mx-auto my-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
			/>
			<h2 className="text-2xl font-semibold mb-6 text-gray-900">
				Frequently Asked Questions About {displayCity} Real Estate and Surrounding Areas
			</h2>
			<Accordion type="single" collapsible className="w-full">
				{displayedFaqs.map((faq, index) => (
					<AccordionItem key={index} value={`item-${index}`}>
						<AccordionTrigger className="text-left font-medium text-gray-800 hover:text-(--primary-color)">
							{faq.question}
						</AccordionTrigger>
						<AccordionContent className="text-gray-600 leading-relaxed text-base">
							{faq.answer}
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
			{faqs.length > 5 && (
				<div className="flex justify-center mt-6">
					<button
						onClick={() => setExpanded(!expanded)}
						className="px-6 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-(--primary-color) hover:border-(--primary-color) transition-all cursor-pointer"
					>
						{expanded ? "Show Less" : "Show More"}
					</button>
				</div>
			)}
		</div>
	);
}
