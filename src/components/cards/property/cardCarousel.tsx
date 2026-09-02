"use client";
import { Property } from "@/app/generated/prisma/client";
import ListingLabels from "@/components/property/listingLabels";
import SocialShare from "@/components/property/share-card";
import { WishListButton } from "@/components/property/wishlistButton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Landmark } from "lucide-react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import UrlMaker from "@/hooks/url-maker";
import Image from "next/image";
import { useState } from "react";

export default function CardCarousel({
	property,
}: {
	property: Property;
}) {
	const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

	const media = property.images as any;
	let images: string[] = [];
	const isOffMarket = ["Withdrawn", "Canceled", "Expired"].includes(property.StandardStatus || "");

	if (isOffMarket) {
		const lat = property.Latitude || 26.142;
		const lng = property.Longitude || -81.7948;
		const mapApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
		images = [`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=19&size=600x400&maptype=satellite&key=${mapApiKey}`];
	} else if (Array.isArray(media) && media.length > 0) {
		images = media
			.map((item: any) => {
				// Handle plain URL strings
				if (typeof item === "string" && item.trim() !== "") return item;
				// Handle objects with MediaURL (accept Photo category or missing category)
				if (typeof item?.MediaURL === "string" && item.MediaURL.trim() !== "") {
					if (!item.MediaCategory || item.MediaCategory === "Photo") return item.MediaURL;
				}
				return null;
			})
			.filter(Boolean) as string[];
	}
	const imageArray = images;

	return (
		<div className="p-0 bg-gray-300 w-full h-full rounded-t-2xl">
			<div className="relative overflow-visible w-full h-full rounded-t-2xl">
				{imageArray.length ? (
					<Carousel
						className="w-full h-full"
						opts={{
							loop: true,
						}}>
						<CarouselContent className="ml-0">
							{imageArray.map((img: string, index: number) => (
								<CarouselItem key={index} className="pl-0">
									<AspectRatio
										ratio={16 / 9}
										className="w-full">
										{imageErrors[index] ? (
											<div className="w-full h-full bg-gradient-to-br from-[#F5F2EB] to-[#EBE6DC] flex flex-col items-center justify-center gap-2 border border-[#E8E4DC] rounded-t-2xl">
												<Landmark size={36} className="text-[#B89A6A] stroke-[1.25]" />
												<span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[#8C8270]">
													No Image Available
												</span>
											</div>
										) : (
											<Image
												src={img}
												alt={`${property.FullAddress}-${index}`}
												fill={true}
												sizes="(max-width: 768px) 100vw, 456px"
												loading={index === 0 ? "eager" : "lazy"}
												priority={index === 0}
												unoptimized
												onError={() => setImageErrors(prev => ({ ...prev, [index]: true }))}
												className="object-cover group-hover:scale-105 transition duration-700 ease-in-out"
											/>
										)}
									</AspectRatio>
								</CarouselItem>
							))}
						</CarouselContent>

						<div
							className="absolute inset-0 pointer-events-none"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}>
							<CarouselPrevious
								className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-auto cursor-pointer !bg-white text-black hover:!bg-white border-0 shadow-md h-9 w-9 flex opacity-100 transition-opacity duration-300"
							/>
							<CarouselNext
								className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-auto cursor-pointer !bg-white text-black hover:!bg-white border-0 shadow-md h-9 w-9 flex opacity-100 transition-opacity duration-300"
							/>
						</div>
					</Carousel>
				) : (
					<AspectRatio ratio={16 / 9}>
						<div className="w-full h-full bg-gradient-to-br from-[#F5F2EB] to-[#EBE6DC] flex flex-col items-center justify-center gap-2 border border-[#E8E4DC] rounded-t-2xl">
							<Landmark size={36} className="text-[#B89A6A] stroke-[1.25]" />
							<span className="text-[10px] tracking-[0.15em] uppercase font-semibold text-[#8C8270]">
								No Image Available
							</span>
						</div>
					</AspectRatio>
				)}

				{/* Status Labels */}
				<div className="absolute top-3 max-w-3/5 left-3 flex gap-2">
					<ListingLabels
						CreatedDate={
							property.OnMarketTimestamp ||
							property.OnMarketDate ||
							""
						}
						
						spa={property.SpaYN || false}
						pool={property.PoolPrivateYN || false}
						waterFront={property.WaterfrontYN || false}
					/>
				</div>

				{/* Action Buttons */}
				<div
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
					}}
					className="absolute z-20 top-3 right-3 flex gap-2">
					<div className="flex gap-2 opacity-100 transition-opacity duration-300">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="bg-white/90 backdrop-blur-sm text-center rounded-full flex items-center justify-center w-10 h-10 p-2 hover:bg-white hover:scale-110 transition-all duration-200 shadow-md">
										<SocialShare
											propertyUrl={UrlMaker(
												property.City,
												property.Community || "",
												property.FullAddress,
												property.MLSNumber
											)}
										/>
									</div>
								</TooltipTrigger>
								<TooltipContent className="bg-gray-900 text-white border-0">
									<p>Share Property</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>

						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<div className="hover:scale-110 transition-all duration-200">
										<WishListButton
											propertyId={property.id}
											isWishlisted={(property as any).isWishlisted}
										/>
									</div>
								</TooltipTrigger>
								<TooltipContent className="bg-gray-900 text-white border-0">
									<p>Save Property</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>
			</div>
		</div>
	);
}
