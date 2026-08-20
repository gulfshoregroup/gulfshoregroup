"use client";
import React, { Suspense, useState } from "react";
import ScheduleTourForm from "@/components/cards/models/scheduleTour";
import ContactForm from "@/components/cards/models/contactModal";
import { Clock, Mail, MessageCircle, PlayCircle } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@radix-ui/react-dialog";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { SignIn } from "@clerk/clerk-react";
import UrlMaker from "@/hooks/url-maker";

import { Skeleton } from "@/components/ui/skeleton";
import capitalizeWords from "@/hooks/capitalize-letter";
import { useTrackViewedProperty } from "@/hooks/trackUserActivity";
import { Property } from "@/app/generated/prisma/client";

const PropertyMap = dynamic(
	() => import("@/components/property/propertyMap"),
	{ ssr: false, loading: () => <Skeleton /> }
);
const WeatherWidget = dynamic(
	() => import("@/components/property/weatherWidget"),
	{ ssr: false, loading: () => <Skeleton /> }
);
const PropertySection = dynamic(
	() =>
		import("@/components/property/propertysection/propertySlider"),
	{ ssr: false, loading: () => <Skeleton /> }
);

const CitiesSection = dynamic(
	() => import("@/components/city/cities-section"),
	{ ssr: false, loading: () => <Skeleton /> }
);
import CountyTaxSection from "@/components/property/CountyTaxSection";
import SchoolInfoSection from "@/components/property/SchoolInfoSection";



export default function PropertyDetail(property: Property) {
	const { isLoaded, isSignedIn } = useUser();
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);
	useTrackViewedProperty(property.id);


	const handleSendEmail = () => {
		const subject = `Inquiry about ${property.MLSNumber}`;
		const body = `Hello,\n\nI am interested in ${
			property.FullAddress
		} (MLS Number: ${
			property.MLSNumber
		}). Link: https://gulfshoregroup.com/${UrlMaker(
			property.City,
			property.Community || "",
			property.FullAddress,
			property.MLSNumber
		)}  . Please provide more details.\n\nThanks!`;
		window.location.href = `mailto:mailbox@gulfshoregroup.com?subject=${encodeURIComponent(
			subject
		)}&body=${encodeURIComponent(body)}`;
	};

	// ✅ WhatsApp Button
	const handleWhatsApp = () => {
		const message = `Hello, I am interested in ${
			property.FullAddress
		} (MLS Number: ${
			property.MLSNumber
		}). Link: https://gulfshoregroup.com/${UrlMaker(
			property.City,
			property.Community || "",
			property.FullAddress,
			property.MLSNumber
		)}  . Please provide more details.`;
		window.open(
			`https://wa.me/+12399929119?text=${encodeURIComponent(
				message
			)}`,
			"_blank"
		);
	};

	const [isModalOpen, setIsModalOpen] = useState(false);
	const closeModal = () => {
		setIsModalOpen(false);
	};
	const [isContactModalOpen, setIsContactModalOpen] = useState(false);
	const closeContactModal = () => {
		setIsContactModalOpen(false);
	};

	const Latitude = parseFloat(property.Latitude?.toString() || "");
	const Longitude = parseFloat(property.Longitude?.toString() || "");

	const handleScheduleTour = () => {
		const isMockSignedIn = document.cookie.includes("mock_signed_in=true");
		if (isLoaded && !isSignedIn && !isMockSignedIn) {
			setShowLoginPrompt(true);
			return;
		}
		setIsModalOpen(true);
	};

	return (
		<>
			{showLoginPrompt && (
				<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
					<SignIn
						forceRedirectUrl={UrlMaker(
							property.City,
							property.Community || "",
							property.FullAddress,
							property.MLSNumber
						)}
					/>
				</div>
			)}
			<div className="mt-4 w-11/12 mx-auto">
				<div className="w-full my-6 rounded-xl">
					<Suspense
						fallback={
							<Skeleton className="h-[55vh] min-h-[450px] w-full rounded-xl" />
						}>
						<PropertyMap
							Latitude={Latitude}
							Longitude={Longitude}
							property={property}
						/>
					</Suspense>
				</div>

				<div className="grid lg:grid-cols-2 grid-cols-1 gap-6 my-6 items-stretch">
					<div className="flex flex-col gap-2 px-2">
						{!(property.raw as any)?.HighSchool &&
						!(property.raw as any)?.MiddleSchool &&
						!(property.raw as any)?.ElementarySchool ? null : (
							<h4 className="text-lg lg:text-xl font-medium text-gray-900 my-2">
								Nearby Schools
							</h4>
						)}
						{(property.raw as any)?.MiddleSchool && (
							<span>
								<strong>Middle School</strong> :{" "}
								{(property.raw as any)?.MiddleSchool}
							</span>
						)}
						{(property.raw as any)?.HighSchool && (
							<span>
								<strong>High School </strong>:{" "}
								{(property.raw as any)?.HighSchool}
							</span>
						)}
						{(property.raw as any)?.ElementarySchool && (
							<span>
								<strong>Elementary School</strong> :{" "}
								{(property.raw as any)?.ElementarySchool}
							</span>
						)}
					</div>

					<div>
						<Suspense>
							<WeatherWidget city={property.City} />
						</Suspense>
					</div>

					{/* County & Tax Information Card */}
					<CountyTaxSection property={property} />

					{/* School Information Card */}
					<SchoolInfoSection property={property} />
				</div>
				{!property.VirtualTourURLBranded &&
				!property.VirtualTourURLUnbranded ? null : (() => {
					const rawThumbnail = (property.raw as any)?.VirtualTourThumbnail;
					let thumbnailSrc = "/default-virtual-tour-thumbnail.jpg";
					if (rawThumbnail && typeof rawThumbnail === "string" && rawThumbnail.trim() !== "") {
						if (rawThumbnail.startsWith("http://") || rawThumbnail.startsWith("https://")) {
							thumbnailSrc = rawThumbnail;
						} else if (rawThumbnail.startsWith("/")) {
							thumbnailSrc = rawThumbnail;
						} else {
							thumbnailSrc = `/${rawThumbnail}`;
						}
					} else {
						let propertyImages = (property as any).images;
						if (typeof propertyImages === 'string') {
							try {
								propertyImages = JSON.parse(propertyImages);
							} catch (e) {
								propertyImages = null;
							}
						}
						
						const firstImage = (property as any).AllPixList?.[0] ||
							(Array.isArray(propertyImages) ? (typeof propertyImages[0] === "string" ? propertyImages[0] : propertyImages[0]?.MediaURL) : null) ||
							(Array.isArray((property.raw as any)?.Media) ? (property.raw as any)?.Media?.[0]?.MediaURL : null);
						if (firstImage && typeof firstImage === "string" && firstImage.trim() !== "") {
							if (firstImage.startsWith("http://") || firstImage.startsWith("https://")) {
								thumbnailSrc = firstImage;
							} else if (firstImage.startsWith("/")) {
								thumbnailSrc = firstImage;
							} else {
								thumbnailSrc = `/${firstImage}`;
							}
						}
					}

					return (
						<div className="mt-5 w-full">
							<h4 className="text-lg">Virtual Tour</h4>
							<Link
								target="_blank"
								href={
									property.VirtualTourURLBranded ||
									property.VirtualTourURLUnbranded ||
									"#"
								}>
								<div className="relative w-full rounded-lg my-4">
									<Image
										className="lg:h-[400px] h-1/2 w-full rounded-lg object-cover"
										src={thumbnailSrc}
										alt="Virtual Tour"
										width={1040}
										height={400}
										unoptimized
									/>
									<div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
										<PlayCircle size={50} color="white" />
									</div>
								</div>
							</Link>
						</div>
					);
				})()}
			</div>
			<div className="fixed bottom-0 right-0 left-0 md:left-auto md:right-5 md:bottom-5 text-center z-50 md:w-[360px]">
				<Card className="md:rounded-lg rounded-none w-full mx-0 py-0 shadow-md">
					<CardContent className="p-2 flex gap-2">
						<Dialog>
							<DialogTrigger className="px-4 py-2 flex-1 inline-flex items-center bg-primary justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 text-white cursor-pointer">
								<span className=" flex font-medium text-sm flex-row flex-nowrap gap-2 justify-center lg:font-bold  items-center text-center">
									<MessageCircle />
									Get In Touch
								</span>
							</DialogTrigger>
							<DialogContent className="w-[90vw] lg:w-full md:w-full rounded-md">
								<DialogTitle className="sr-only">Contact Options</DialogTitle>
								<div className="py-5 px-2 flex flex-col gap-2">
									<h2 className="py-2 font-medium text-base">
										Gulfshore Group
									</h2>
									<h3 className="py-4 font-medium lg:text-2xl text-lg">
										Want to know more about this property, contact us
										now :
									</h3>
									<div className="flex lg:flex-nowrap flex-wrap gap-2 ">
										<Button
											className="lg:w-1/2 w-full min-h-10 bg-green-600"
											onClick={handleWhatsApp}>
											<span className="flex flex-nowrap gap-2 justify-center font-bold items-center text-center">
												<MessageCircle />
												Send Whatsapp Message
											</span>
										</Button>
										<Button
											className="lg:w-1/2 w-full min-h-10 border-2 border-(--primary-color) text-primary"
											variant={"outline"}
											onClick={handleSendEmail}>
											<span className="flex flex-nowrap gap-2 justify-center font-bold items-center text-center">
												<Mail />
												Send a Email
											</span>
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>

						<Button
							className="border-2 flex-1 text-primary border-(--primary-color) cursor-pointer"
							variant={"outline"}
							onClick={handleScheduleTour}>
							{" "}
							<span className="flex flex-nowrap font-medium text-sm  gap-2 justify-center lg:font-bold items-center text-center">
								<Clock />
								Schedule Tour
							</span>
						</Button>
					</CardContent>
				</Card>
			</div>
			{isModalOpen && (
				<ScheduleTourForm
					propertyAddress={property.FullAddress}
					MLSNumber={property.MLSNumber}
					propertyId={property.id}
					onClose={closeModal}
				/>
			)}

			{isContactModalOpen && (
				<ContactForm
					propertyId={property.MLSNumber}
					onClose={closeContactModal}
				/>
			)}
			<div className="bg-white rounded-t-xl mb-10">
				<div className="w-11/12	mx-auto pl-2 flex flex-col mb-2">
					<h2 className="py-2 font-semibold mt-10 lg:mt-12 text-lg lg:text-xl">
						Search By City
					</h2>
					<p className="text-xs md:text-sm lg:font-medium font-semibold lg:text-base text-gray-700">
						Explore Active Listings in each{" "}
						<span className="text-primary font-semibold">
							SW Florida City
						</span>
						.
					</p>
				</div>

				<CitiesSection />
			</div>
		</>
	);
}
