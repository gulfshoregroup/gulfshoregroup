"use client";

import dynamic from "next/dynamic";
import React, {
	useEffect,
	useState,
	useTransition,
	Suspense,
} from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import axios from "axios";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PropertySkeletonCard from "@/components/cards/property/propertySkeletonCard";
import capitalizeWords from "@/hooks/capitalize-letter";
import paramsToLink from "@/hooks/paramsToLink";
import { Property } from "@/app/generated/prisma/client";

// Dynamically import heavy components to defer their load
const PropertyCard = dynamic(
	() => import("@/components/cards/property/property-card"),
	{
		ssr: false,
		loading: () => <PropertySkeletonCard />,
	}
);
const Carousel = dynamic(
	() => import("@/components/ui/carousel").then((m) => m.Carousel),
	{
		ssr: false,
	}
);
const CarouselContent = dynamic(
	() =>
		import("@/components/ui/carousel").then((m) => m.CarouselContent),
	{
		ssr: false,
	}
);
const CarouselItem = dynamic(
	() =>
		import("@/components/ui/carousel").then((m) => m.CarouselItem),
	{
		ssr: false,
	}
);
const CarouselNext = dynamic(
	() =>
		import("@/components/ui/carousel").then((m) => m.CarouselNext),
	{
		ssr: false,
	}
);
const CarouselPrevious = dynamic(
	() =>
		import("@/components/ui/carousel").then(
			(m) => m.CarouselPrevious
		),
	{
		ssr: false,
	}
);

interface PropertySectionProps {
	queryParams: Record<string, any>;
	props?: React.ReactNode;
}

export default function PropertySection({
	queryParams,
	props,
}: PropertySectionProps) {
	const [properties, setProperties] = useState<Property[]>([]);
	const [loading, setLoading] = useState(true);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const cityPath = queryParams?.city
		? capitalizeWords(queryParams.city).replaceAll(" ", "-")
		: "";
	const communityRaw = queryParams?.development || queryParams?.developmentName || queryParams?.community || "";
	const communityPath = communityRaw
		? capitalizeWords(communityRaw).replaceAll(" ", "-")
		: "";

	useEffect(() => {
		startTransition(() => {
			const fetchData = async () => {
				try {
					setLoading(true);
					const baseUrl = typeof window === "undefined" ? (process.env.NEXT_PUBLIC_SERVER_URL || "https://gulfshoregroup.com") : "";
					const response = await axios.get(
						`${baseUrl}/api/v2/properties`,
						{
							params: { ...queryParams },
						}
					);
					setProperties(response.data.data);
				} catch (err: any) {
					console.error("Error fetching properties:", err);
					setError("Failed to load properties.");
				} finally {
					setLoading(false);
				}
			};

			fetchData();
		});
	}, []);

	// Fallback skeleton while loading
	if (loading)
		return (
			<ScrollArea className="w-full max-w-11/12 lg:max-w-4/5 mx-auto bg-background mt-10 whitespace-nowrap rounded-md">
				<div className="mb-5 mx-2 flex-row gap-3 ml-4 pr-2 flex w-full">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="max-w-96 min-w-80 md:min-w-96">
							<PropertySkeletonCard />
						</div>
					))}
					<ScrollBar orientation="horizontal" />
				</div>
			</ScrollArea>
		);

	if (error || properties.length === 0) return null;

	const finalUrl = paramsToLink({
		params: {
			city: cityPath,
			community: communityPath,
			type: queryParams?.propertyType || "",
			sort: queryParams?.sort || "",
			order: queryParams?.order || "",
		},
	});

	return (
		<div className="w-full max-w-11/12 lg:max-w-4/5 mx-auto px-6 md:px-10">
			{props && <div>{props}</div>}

			<Suspense
				fallback={
					<div className="flex justify-center py-6">
						<PropertySkeletonCard />
					</div>
				}>
				<Carousel opts={{ align: "start" }}>
					<CarouselContent className="my-2">
						{properties.map((property: Property) => (
							<CarouselItem
								key={property.MLSNumber}
								className="md:basis-1/2 lg:basis-1/2 xl:basis-1/3">
								<PropertyCard {...property} />
							</CarouselItem>
						))}

						<Link
							target="_blank"
							href={finalUrl || "/Florida-Real-Estate-Search"}>
							<CarouselItem
								key="more"
								className="md:basis-1/2 h-full lg:basis-1/3">
								<div className="group bg-linear-to-br from-white to-gray-50 border border-gray-200 rounded-3xl min-w-64 h-full p-8 relative overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer">
									<div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-bl from-red-50 to-transparent rounded-full -translate-y-8 translate-x-8 opacity-60"></div>
									<div className="absolute bottom-0 left-0 w-24 h-24 bg-linear-to-tr from-red-50 to-transparent rounded-full translate-y-8 -translate-x-8 opacity-40"></div>
									<div className="absolute top-6 left-6 text-[#d90429] opacity-60 animate-pulse">
										<Sparkles size={16} />
									</div>
									<div className="absolute bottom-8 right-8 text-[#d90429] opacity-40 animate-pulse delay-300">
										<Sparkles size={12} />
									</div>
									<div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-6">
										<div className="w-16 h-16 bg-linear-to-br from-[#d90429] to-[#b8032a] rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
											<ArrowRight className="text-white w-8 h-8 transform group-hover:translate-x-1 transition-transform duration-300" />
										</div>
										<div className="space-y-2">
											<h3 className="text-xl font-bold text-gray-800 group-hover:text-[#d90429] transition-colors duration-300">
												Explore More
											</h3>
											<p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">
												Discover amazing properties
											</p>
										</div>
										<button className="bg-[#d90429] hover:bg-[#b8032a] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 group-hover:gap-3">
											View More
											<ArrowRight
												size={16}
												className="transform group-hover:translate-x-1 transition-transform duration-300"
											/>
										</button>
									</div>
									<div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-[#d90429]/20 transition-all duration-300"></div>
								</div>
							</CarouselItem>
						</Link>
					</CarouselContent>

					<CarouselPrevious className="hidden md:flex w-8 h-8 md:w-10 md:h-10 bg-white text-[#1C1712] hover:bg-gray-50 hover:text-black border border-[#E8E4DC] shadow-sm left-0 md:-left-16 top-[46%] md:top-[46%] md:-translate-y-1/2 z-10 opacity-90 hover:opacity-100 transition-colors" />
					<CarouselNext className="hidden md:flex w-8 h-8 md:w-10 md:h-10 bg-white text-[#1C1712] hover:bg-gray-50 hover:text-black border border-[#E8E4DC] shadow-sm right-0 md:-right-16 top-[46%] md:top-[46%] md:-translate-y-1/2 z-10 opacity-90 hover:opacity-100 transition-colors" />
				</Carousel>
			</Suspense>
		</div>
	);
}
