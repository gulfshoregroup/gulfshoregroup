"use client";

import type React from "react";
import ReviewCard from "./review-card";

interface Review {
	name: string;
	text: string;
}

const sampleReviews: Review[] = [
	{
		name: "Bob J.",
		text: "It was all due to his well organized effort of carting us from place to place and then being smart enough to spot a great deal for us in a building we really wanted to be in. Dimitri laid out a large number of condos for us to look at in different areas based on our requests. We found one building we really liked but needed to think about it. On top of it all we got it at a great price so we remodeled the entire place. It's modern and brand new on the inside. Within a few weeks he identified a new listing in the building and we bought it on the spot.",
	},
	{
		name: "Michael A.",
		text: "Living in Canada and purchasing in Florida could have been challenging but he made it so easy! From the first telephone conversation to taking the time on our trip down to show us all the communities and amenities, we were thoroughly impressed. His approach is professional, informative and caring. We have had an excellent experience working with Dimitri. Could not believe the amount of time and effort they spent with us.",
	},
	{
		name: "Mary Z.",
		text: "Dimitri was wonderful to work with and went above and beyond to help us find the property with the specific attributes and environment we were searching for in our home. He effectively introduced us to the SW Florida lifestyle.",
	},
	{
		name: "Jerry B.",
		text: "Dimitri found us just the right neighborhood and even got us a great deal on a house full of furniture. All of this from 1500 miles away. He moved us up the property ladder by helping us buy a vacation home then sell it and later purchase a larger one. I can't imagine anyone doing it better than him.",
	},
	{
		name: "David C.",
		text: "At no point in those five months did his dedication to selling our property disappoint us. He is a skilled listener and negotiator, with very in-depth knowledge of the local markets. We listed two properties with him at the same time and while he sold one within a week, one took five months to sell. He was just as aggressive and excited about selling the second property as he was the first. Without doubt, we would seek him out immediately for any upcoming real estate transaction in the future.",
	},
];

export default function ReviewsSection() {
	// Duplicate reviews for seamless infinite loop
	const extendedReviews = [...sampleReviews, ...sampleReviews];

	return (
		<section className="w-full py-8 px-4 bg-background">
			<div className="max-w-7xl mx-auto">
				{/* Reviews Carousel */}
				<div className="relative w-full overflow-hidden">
					{/* Gradient overlays for smooth edges */}
					<div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-background to-transparent z-10 pointer-events-none" />
					<div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-background to-transparent z-10 pointer-events-none" />

					{/* Scrolling container */}
					<div
						className="flex gap-6 animate-scroll"
						style={
							{
								"--scroll-duration": "30s",
							} as React.CSSProperties & {
								"--scroll-duration": string;
							}
						}>
						{extendedReviews.map((review, index) => (
							<div
								key={`review-${index}`}
								className="shrink-0 w-full md:w-96">
								<ReviewCard review={review} />
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
