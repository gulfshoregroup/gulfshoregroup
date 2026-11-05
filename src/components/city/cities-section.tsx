"use client";

import { Card } from "../ui/card";
import Image from "next/image";
import Link from "next/link";
import capitalizeWords from "@/hooks/capitalize-letter";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "../ui/carousel";

const DEFAULT_FEATURED_CITIES = [
	{ id: 1, name: "Naples", slug: "naples", defaultImage: null, images: null, _count: { communities: 371, properties: 4978 } },
	{ id: 8, name: "BONITA SPRINGS", slug: "bonita-springs", defaultImage: null, images: null, _count: { communities: 105, properties: 902 } },
	{ id: 12, name: "MARCO ISLAND", slug: "marco-island", defaultImage: null, images: null, _count: { communities: 11, properties: 483 } },
	{ id: 11, name: "ESTERO", slug: "estero", defaultImage: null, images: null, _count: { communities: 51, properties: 516 } },
	{ id: 3, name: "FORT MYERS", slug: "fort-myers", defaultImage: null, images: null, _count: { communities: 378, properties: 3157 } },
	{ id: 6, name: "CAPE CORAL", slug: "cape-coral", defaultImage: null, images: null, _count: { communities: 112, properties: 4703 } },
	{ id: 20, name: "AVE MARIA", slug: "ave-maria", defaultImage: null, images: null, _count: { communities: 2, properties: 222 } },
	{ id: 16, name: "SANIBEL", slug: "sanibel", defaultImage: null, images: null, _count: { communities: 52, properties: 278 } },
	{ id: 21, name: "CAPTIVA", slug: "captiva", defaultImage: null, images: null, _count: { communities: 15, properties: 83 } },
	{ id: 22, name: "FORT MYERS BEACH", slug: "fort-myers-beach", defaultImage: null, images: null, _count: { communities: 85, properties: 632 } },
	{ id: 19, name: "MIROMAR LAKES", slug: "miromar-lakes", defaultImage: null, images: null, _count: { communities: 1, properties: 40 } },
	{ id: 9, name: "Babcock Ranch", slug: "babcock-ranch", defaultImage: null, images: null, _count: { communities: 0, properties: 36 } },
	{ id: 5, name: "LEHIGH ACRES", slug: "lehigh-acres", defaultImage: null, images: null, _count: { communities: 50, properties: 4521 } },
	{ id: 36, name: "IMMOKALEE", slug: "immokalee", defaultImage: null, images: null, _count: { communities: 5, properties: 27 } },
];

export default function CitiesSection() {
	return (
		<div className="w-11/12 mx-auto">
			<Carousel
				opts={{
					align: "start",
					loop: true,
				}}>
				<CarouselContent className="my-2">
					{DEFAULT_FEATURED_CITIES.map((city, index) => {
						const cityHref = `/Florida-Real-Estate-Search/${capitalizeWords(city.name).replaceAll(" ", "-")}`;
						return (
							<CarouselItem key={index} className=" basis-auto">
								<Link href={cityHref} className="block">
									<Card
										className="h-64 w-52 md:w-56 group relative overflow-hidden hover:cursor-pointer rounded-2xl border-0 shadow-md shrink-0">
										<div className="relative h-full w-full">
											<Image
												loading="lazy"
												quality={75}
												src={city.defaultImage || (Array.isArray(city.images) ? city.images[0] : null) || "/map-bg.webp"}
												width={240}
												height={320}
												className="h-full w-full object-cover group-hover:scale-110 transition duration-500 ease-in-out"
												alt={`/Florida-Real-Estate-Search/${city.name}`}
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 text-center">
												<span className="font-bold text-white text-lg md:text-xl tracking-wide drop-shadow-sm uppercase">
													{city.name}
												</span>
												<span className="text-xs md:text-sm font-semibold text-gray-200 mt-1">
													{(city._count?.properties ?? city._count?.communities ?? 0)} Listings
												</span>
											</div>
										</div>
									</Card>
								</Link>
							</CarouselItem>
						);
					})}
				</CarouselContent>
				<CarouselPrevious className="w-9 h-9 left-1 md:-left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md border-0" />
				<CarouselNext className="w-9 h-9 right-1 md:-right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md border-0" />
			</Carousel>
		</div>
	);
}
