"use client";
import React from "react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import PropertyCard from "@/components/cards/property/property-card";
import { Property } from "@/app/generated/prisma/client";

export default function SimilarPropertiesCarousel({
	properties,
	development,
}: {
	properties: Property[];
	development: string;
}) {
	if (!properties || properties.length === 0) {
		return null;
	}

	return (
		<section className="mt-4 mb-8 w-11/12 mx-auto relative group">
			<h2 className="lg:text-2xl font-bold px-1 text-gray-900 mb-6">
				Explore More Properties in {development}
			</h2>
			<div className="px-4 md:px-8">
				<Carousel
					opts={{
						align: "start",
						loop: false,
					}}
					className="w-full"
				>
					<CarouselContent className="-ml-2 md:-ml-4">
						{properties.map((property, index) => (
							<CarouselItem
								key={index}
								className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4"
							>
								<div className="h-full py-2">
									<PropertyCard {...(property as any)} />
								</div>
							</CarouselItem>
						))}
					</CarouselContent>
					<div>
						<CarouselPrevious className="absolute hidden md:flex w-8 h-8 md:w-10 md:h-10 !bg-accent text-white -left-1 md:-left-12 top-[76%] md:top-[76%] z-10 md:-translate-y-1/2 opacity-90 hover:opacity-100" />
						<CarouselNext className="absolute hidden md:flex w-8 h-8 md:w-10 md:h-10 !bg-accent text-white -right-1 md:-right-12 top-[76%] md:top-[76%] z-10 md:-translate-y-1/2 opacity-90 hover:opacity-100" />
					</div>
				</Carousel>
			</div>
		</section>
	);
}
