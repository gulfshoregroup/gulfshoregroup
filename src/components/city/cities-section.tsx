"use client";
import { Card } from "../ui/card";
import Image from "next/image";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import capitalizeWords from "@/hooks/capitalize-letter";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { useRouter } from "next/navigation";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "../ui/carousel";
import axios from "axios";
import Cities from "@/types/cities";

export default function CitiesSection() {
	const [cities, setCities] = useState<any[]>([]);
	const router = useRouter();
	useEffect(() => {
		const fetchCities = async () => {
			try {
				console.log("Fetching cities...");
				const cities = await axios.get(
					`/api/v2/cities?type=featured&t=${Date.now()}`
				);
				if (!cities.data || !Array.isArray(cities.data.data)) {
					console.log("No city data found or not an array");
					return [];
				} else {
					const allowedSWFL = [
						"naples",
						"bonita springs",
						"marco island",
						"estero",
						"fort myers",
						"cape coral",
						"ave maria",
						"sanibel",
						"captiva",
						"fort myers beach",
						"miromar lakes",
					];
					const filtered = cities.data.data.filter((c: any) =>
						c?.name &&
						allowedSWFL.includes(c.name.trim().toLowerCase()) &&
						(c._count?.properties ?? c._count?.communities ?? 1) > 0
					);
					console.log("Filtered cities count:", filtered.length);
					setCities(filtered);
				}
			} catch (error) {
				console.error("Error fetching cities:", error);
				return [];
			}
		};
		fetchCities();
	}, []);

	if (!cities || cities.length === 0) {
		return (
			<section className="w-dvw pl-4 md:pl-12">
				<ScrollArea className="w-full whitespace-nowrap rounded-md">
					<div className=" space-x-2 p-4 flex">
						{Array.from({ length: 7 }).map((_, index) => (
							<Skeleton
								key={index}
								className="h-56 w-44 md:w-48 rounded-2xl shrink-0"
							/>
						))}
					</div>
					<ScrollBar orientation="horizontal" />
				</ScrollArea>
			</section>
		);
	}

	return (
		<>
			<div className="w-11/12 mx-auto">
				<Carousel
					opts={{
						align: "start",
						loop: true,
					}}>
					<CarouselContent className="my-2">
						{" "}
						{cities.map((city: any, index: number) => {
							return (
								<CarouselItem key={index} className=" basis-auto">
									<Card
										onClick={() => {
											router.replace(
												`/Florida-Real-Estate-Search/${capitalizeWords(
													city.name
												).replaceAll(" ", "-")}`
											);
										}}
										key={index}
										className="h-64 w-52 md:w-56 group relative overflow-hidden hover:cursor-pointer rounded-2xl border-0 shadow-md shrink-0">
										<div className="relative h-full w-full">
											<Image
												unoptimized
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
								</CarouselItem>
							);
						})}
					</CarouselContent>
					<CarouselPrevious className="w-9 h-9 left-1 md:-left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md border-0" />
					<CarouselNext className="w-9 h-9 right-1 md:-right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md border-0" />
				</Carousel>
			</div>
		</>
	);
}
