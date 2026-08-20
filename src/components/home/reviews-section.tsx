"use client";
import Autoplay from "embla-carousel-autoplay";
import { LucideStar, Star } from "lucide-react";
import Image from "next/image";
import ReadMore from "../property/readmore";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "../ui/carousel";

export default function ClientReviews() {
	const Reviews = [
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
	return (
		<section className="mb-8 w-11/12 mx-auto">
			<div className="mx-auto px-4 text-start">
				<div className="flex flex-col text-start items-start justify-start mx-auto">
					<h2 className="text-2xl pt-10 text-start font-medium">
						Proven Track of Satisfied Clients
					</h2>
				</div>
				<Carousel
					opts={{ align: "center", loop: true }}
					plugins={[
						Autoplay({
							delay: 2000,
							jump: false,
						}),
					]}
					className="w-full p-2">
					<CarouselContent className="p-2">
						{Reviews.map((review, index) => {
							return (
								<CarouselItem
									key={index}
									className="md:basis-1/2 lg:basis-1/3 p-2">
									<div className="h-full flex flex-col gap-3 p-5 rounded-lg shadow border-gray-50 bg-white">
										<ReadMore
											maxLength={100}
											className="text-gray-800">
											{review.text}
										</ReadMore>
										<div className="flex justify-between items-center">
											<p className="text-sm poppins font-semibold text-gray-700">
												{review.name}
											</p>
											<div className="inline-flex items-center px-2 gap-1 py-1 rounded-full">
												<LucideStar
													color="amber-600"
													className="text-amber-600 fill-amber-600"
													size={19}
												/>
												<LucideStar
													color="amber-600"
													className="text-amber-600 fill-amber-600"
													size={19}
												/>
												<LucideStar
													color="amber-600"
													className="text-amber-600 fill-amber-600"
													size={19}
												/>
												<LucideStar
													color="amber-600"
													className="text-amber-600 fill-amber-600"
													size={19}
												/>
												<LucideStar
													color="amber-600"
													className="text-amber-600 fill-amber-600"
													size={19}
												/>
											</div>
										</div>
									</div>
								</CarouselItem>
							);
						})}
					</CarouselContent>
				</Carousel>
			</div>
		</section>
	);
}
