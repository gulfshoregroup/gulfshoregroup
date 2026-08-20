"use client";
import React, { useState, useCallback, useEffect } from "react";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselPrevious,
	CarouselNext,
	CarouselApi,
} from "../ui/carousel";
import Image from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { Maximize2, X, ArrowLeft, ArrowRight, Landmark } from "lucide-react";
import { Button } from "../ui/button";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

const SliderComponent = ({
	images,
	address,
}: {
	images: any;
	address: string;
}) => {
	const [fullscreenData, setFullscreenData] = useState<{ url: string; index: number } | null>(null);

	const imageArray: string[] = images || [];

	const openFullscreen = (image: string, index: number) => {
		setFullscreenData({ url: image, index });
		document.body.style.overflow = "hidden";
	};

	const closeFullscreen = () => {
		setFullscreenData(null);
		document.body.style.overflow = "auto";
	};
	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!api) {
			return;
		}

		setCount(api.scrollSnapList().length);
		setCurrent(api.selectedScrollSnap() + 1);

		api.on("select", () => {
			setCurrent(api.selectedScrollSnap() + 1);
		});
	}, [api]);

	if (!imageArray.length) {
		return (
			<div className="w-full h-96 bg-gradient-to-br from-[#F5F2EB] to-[#EBE6DC] flex flex-col items-center justify-center gap-2 border border-[#E8E4DC] rounded-xl my-4">
				<Landmark size={48} className="text-[#B89A6A] stroke-[1.25]" />
				<span className="text-xs tracking-[0.15em] uppercase font-semibold text-[#8C8270]">
					No Image Available
				</span>
			</div>
		);
	}
	return (
		<div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-5">
			{/* Main Carousel */}
			<div className="relative w-full lg:w-1/2 h-1/2">
				<Carousel
					opts={{ align: "center", loop: true }}
					plugins={[Autoplay({ delay: 3000 })]}>
					<CarouselContent>
						{imageArray.map((image, index) => (
							<CarouselItem key={index} className="w-full h-1/2">
								<div className="relative">
									<Image
										src={image}
										alt={address + "-" + (index + 1)}
										width={800}
										height={800}
										loading={index === 0 ? "eager" : "lazy"}
										placeholder="blur"
										blurDataURL={image}
										className="rounded-xl h-[calc(100vh/2)] w-full mx-auto object-cover"
									/>
									<Button
										onClick={() => openFullscreen(image, index)}
										className="absolute bottom-4 right-4 bg-black/50 hover:bg-black/70 rounded-full p-2 h-10 w-10"
										aria-label="View fullscreen">
										<Maximize2 className="h-5 w-5 text-white" />
									</Button>
								</div>
							</CarouselItem>
						))}
					</CarouselContent>
					<CarouselPrevious className="absolute lg-svg  bg-black/30 top-1/2 left-4 md:left-4 transform -translate-y-1/2" />
					<CarouselNext className="absolute lg-svg top-1/2 bg-black/30 right-4 md:right-4 transform -translate-y-1/2" />
				</Carousel>
			</div>

			{/* Thumbnail Gallery */}
			{imageArray.length > 1 && (
				<div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-2 gap-2 w-full lg:w-1/2">
					{imageArray.slice(0, 4).map((image, index) => (
						<div
							key={index}
							className="relative cursor-pointer"
							onClick={() => openFullscreen(image, index)}>
							<Image
								src={image}
								alt={address + "-" + (index + 1)}
								width={550}
								height={550}
								loading="lazy"
								className="rounded-lg object-cover h-24 sm:h-32 lg:h-[calc(100vh/4)] w-full"
							/>
							{/* Overlay for more images */}
							{index === 3 && imageArray.length > 4 && (
								<div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
									<span className="text-white text-lg font-bold">
										+{imageArray.length - 4}
									</span>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			{/* Fullscreen Modal */}
			{fullscreenData && (
				<div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center h-full w-full justify-center z-50">
					<div className="relative w-full h-full max-w-7xl mx-auto px-4">
						{/* Close Button */}
						<Button
							onClick={closeFullscreen}
							className="absolute top-4 right-4 bg-gray-700 hover:bg-white/20 z-50 rounded-full p-2 h-10 w-10 backdrop-blur-sm transition-all duration-300"
							aria-label="Close fullscreen">
							<X className="h-5 w-5 text-white" />
						</Button>

						<div className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-full z-50 px-3 py-1.5">
							<span className="text-white text-sm font-semibold">
								{current} / {count}
							</span>
						</div>

						<div className="h-full flex items-center justify-center">
							<div className="relative h-full max-w-[98dvw] w-full max-h-[90dvh] flex items-center justify-center">
								<Carousel
									setApi={setApi}
									className="max-w-[98dvw] w-full max-h-[90dvh]"
									opts={{ align: "center", loop: true, startIndex: fullscreenData.index }}>
									<CarouselContent>
										{imageArray.map((image, index) => (
											<CarouselItem key={index}>
												<Image
													src={image}
													alt={address + "-" + (index + 1)}
													width={2560}
													height={1440}
													className="rounded-xl h-full max-w-[98dvw] w-full max-h-[90dvh] mx-auto object-contain"
												/>
											</CarouselItem>
										))}
									</CarouselContent>

									<CarouselPrevious className="absolute top-1/2 left-4 transform -translate-y-1/2" />

									<CarouselNext className="absolute top-1/2 right-4 transform -translate-y-1/2" />
								</Carousel>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SliderComponent;
