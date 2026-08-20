"use client";
import PropertyCard from "@/components/cards/property/property-card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
function RecentProperties({ data }: { data: any[] }) {
	if (!data.length) return null;

	return (
		<div>
			<div className="w-full max-w-11/12 mx-auto">
				<div className="flex flex-col text-start items-start pb-5 justify-start">
					<h2 className="lg:text-2xl text-xl pt-10 lg:pt-12 text-start font-medium">
						{"Recently Viewed Properties"}
					</h2>
					<p className="py-1 lg:text-base md:text-sm text-xs lg:font-medium font-semibold text-gray-700">
						Your recent activity
					</p>
				</div>

				<Carousel
					opts={{
						align: "start",
					}}>
					<CarouselContent className="my-2">
						{data?.map((item: any, i) => {
							const property = item.property;
							return (
								<CarouselItem
									className="md:basis-1/2 lg:basis-1/3 "
									key={property.MLSNumber}>
									<PropertyCard {...property} />
								</CarouselItem>
							);
						})}
					</CarouselContent>

					<CarouselPrevious className="flex w-10 h-10 md:w-12 md:h-12 bg-accent absolute -left-3 md:-left-12 top-[65%] md:top-1/2 z-10 opacity-80 hover:opacity-100 md:-translate-y-1/2" />
					<CarouselNext className="flex w-10 h-10 md:w-12 md:h-12 bg-accent absolute -right-3 md:-right-12 top-[65%] md:top-1/2 z-10 opacity-80 hover:opacity-100 md:-translate-y-1/2" />
				</Carousel>
			</div>
		</div>
	);
}

export default RecentProperties;
