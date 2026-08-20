"use client";
import Link from "next/link";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@/components/ui/carousel";
import PropertyCard from "../cards/property/property-card";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

export default function PropertySection() {
	const [properties, setProperties] = useState<any[]>();

	useEffect(() => {
		const fetchData = async () => {
			const data = await axios.get(
				"https://gulfshoregroup.com/api/properties",
				{
					params: {
						order: "desc",
						sort: "CreatedDate",
						limit: "7",
					},
				}
			);
			setProperties(data.data.data);
		};
		fetchData();
	}, []);
	if (properties && properties.length === 0) {
		return null;
	}

	return (
		<>
			<div className="lg:mx-8 lg:w-[95vw] w-full">
				<Carousel
					opts={{
						align: "start",
						loop: true,
					}}>
					<CarouselContent>
						{properties?.map((property: any) => (
							<CarouselItem className="my-1" key={property.MLSNumber}>
								<PropertyCard {...property} />
							</CarouselItem>
						))}
					</CarouselContent>

					<div className="hidden lg:block lg:inline-flex">
						<CarouselPrevious />
						<CarouselNext />
					</div>
				</Carousel>
			</div>
			<div className="w-full mt-4  flex justify-center">
				<Link href={"/listings"}>
					<div className="bg-(--primary-color) text-center w-fit flex rounded-xl justify-center items-center py-2 px-3">
						<p className=" text-white poppins text-sm font-medium">
							{" "}
							View More
						</p>
						<ChevronRight className="text-white" />
					</div>
				</Link>
			</div>
		</>
	);
}

// grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 items-center justify-center py-3 px-1 gap-1
