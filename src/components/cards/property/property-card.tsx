"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "../../ui/card";
import UrlMaker from "@/hooks/url-maker";
import { formatPrice } from "@/hooks/formatPrice";
import capitalizeWords from "@/hooks/capitalize-letter";
import CardCarousel from "./cardCarousel";
import { X, BedDouble, Bath, Ruler, CalendarDays, Trees, Landmark, Eye, ArrowRight, ArrowLeft } from "lucide-react";
import { Property } from "@/app/generated/prisma/client";
import { useDispatch } from "react-redux";
import { setHoveredMLS } from "@/state/slices/searchSlice";
import { useCarouselOptional } from "@/components/ui/carousel";

const isValidField = (value: any) => {
	return (
		value !== null &&
		value !== undefined &&
		value !== "" &&
		value !== "No" &&
		value !== "0" &&
		value !== "none" &&
		value !== "N/A" &&
		value !== "None" &&
		value !== "0.00" &&
		value !== "0%" &&
		value !== "No Information"
	);
};

/* ─── Main Card (Grid/List view) ─────────────────────────────────────── */
const PropertyCard = (property: Property & { isSelected?: boolean }) => {
	const dispatch = useDispatch();
	const carousel = useCarouselOptional();
	const { isSelected, ...restProperty } = property;
	return (
		<a
			tabIndex={0}
			className="w-full block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89A6A] rounded-2xl"
			target="_blank"
			onMouseEnter={() => dispatch(setHoveredMLS(property.MLSNumber))}
			onMouseLeave={() => dispatch(setHoveredMLS(null))}
			href={UrlMaker(
				property.City,
				property.Community || "",
				property.FullAddress,
				property.MLSNumber
			)}>

			<article className={`
				group relative h-full w-full bg-[#FAFAF8] rounded-2xl
				border transition-all duration-500 ease-out flex flex-col
				${isSelected
					? "border-red-600 border-2 shadow-[0_0_24px_rgba(220,38,38,0.25)] ring-2 ring-red-500/50 -translate-y-1"
					: "border-[#E8E4DC] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:-translate-y-1"}
			`}>
				{/* ── Image carousel ── */}
				<div className="relative shrink-0 w-full aspect-[16/9] rounded-t-2xl">
					<CardCarousel property={property} />

					{/* Gold shimmer overlay on hover */}
					<div className="
						absolute inset-0 pointer-events-none
						bg-gradient-to-t from-black/30 via-transparent to-transparent
						opacity-60 group-hover:opacity-40 transition-opacity duration-500
					" />

					{/* Property sub-type badge */}
					{isValidField(property.PropertySubType) && property.PropertyType !== "Land" && (
						<span className="
							absolute bottom-3 left-3 z-10
							px-2.5 py-1 rounded-full text-[10px] tracking-[0.12em] uppercase font-medium
							bg-white/90 backdrop-blur-sm text-[#3D3530] border border-white/60
						">
							{capitalizeWords(property.PropertySubType || "")}
						</span>
					)}
					{property.PropertyType === "Land" && (
						<span className="
							absolute bottom-3 left-3 z-10
							px-2.5 py-1 rounded-full text-[10px] tracking-[0.12em] uppercase font-medium
							bg-white/90 backdrop-blur-sm text-[#3D3530] border border-white/60
						">
							Land
						</span>
					)}
				</div>

				{/* ── Body ── */}
				<div className="flex flex-col flex-1 px-5 pt-4 pb-3">

					{/* Price row */}
					<div className="flex items-start justify-between mb-1">
						<p className="
							text-[1.35rem] leading-tight tracking-tight
							font-semibold text-[#1C1712]
						">
							{formatPrice(
								((property as any).StandardStatus === "Closed" || (property as any).MlsStatus === "Sold")
									? (property.ClosePrice || property.ListPrice || 0)
									: (property.ListPrice || 0)
							)}
						</p>
						<Image
							className="h-5 w-auto opacity-50 mt-1 shrink-0 ml-3"
							src="https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289229/brokerreciprocitylogo_jl5omm.jpg"
							alt="MLS Broker Reciprocity"
							width={84}
							height={90}
						/>
					</div>

					{/* Address */}
					<p className="
						text-[13px] text-[#7A7060] leading-snug line-clamp-2 mb-5
						group-hover:text-[#B89A6A] transition-colors duration-300
					">
						{(() => {
							const address = property.FullAddress || "";
							const city = property.City || "";
							const state = property.StateOrProvince || "FL";
							const zip = property.PostalCode || "";
							
							if (address.toLowerCase().includes(city.toLowerCase())) {
								return capitalizeWords(address).replace(" Fl", " FL");
							}
							return `${capitalizeWords(address)}, ${capitalizeWords(city)}, ${state} ${zip}`.trim().replace(/,\s*$/, "");
						})()}
					</p>

					{/* Divider & Arrow Button */}
					<div className="relative w-full">
						<div className="h-px w-full bg-gradient-to-r from-transparent via-[#DDD8CE] to-transparent" />
						{carousel && (
							<>
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										e.nativeEvent.preventDefault();
										e.nativeEvent.stopImmediatePropagation();
										if (carousel) carousel.scrollPrev();
									}}
									className="absolute -left-5 top-1/2 -translate-y-1/2 bg-[#d90429] w-7 h-7 rounded-full flex md:hidden items-center justify-center text-white shadow-sm border border-white hover:bg-[#b8032a] transition-colors z-10 cursor-pointer"
								>
									<ArrowLeft size={14} strokeWidth={2.5} />
								</button>
								<button
									type="button"
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										e.nativeEvent.preventDefault();
										e.nativeEvent.stopImmediatePropagation();
										if (carousel) carousel.scrollNext();
									}}
									className="absolute -right-5 top-1/2 -translate-y-1/2 bg-[#d90429] w-7 h-7 rounded-full flex md:hidden items-center justify-center text-white shadow-sm border border-white hover:bg-[#b8032a] transition-colors z-10 cursor-pointer"
								>
									<ArrowRight size={14} strokeWidth={2.5} />
								</button>
							</>
						)}
					</div>

					{/* Centered Stats Block */}
					<div className="flex-1 flex flex-col justify-end pt-6 pb-2">
						{/* Stats row */}
						<PropertyCardInfoLabels property={property} />

						{/* HOA — shown only when relevant */}
						{property.MandatoryHOAYN && (property.HOAFee ?? 0) > 0 && (
							<div className="mt-2 flex items-center gap-1.5">
								<Landmark size={12} className="text-[#B89A6A]" aria-hidden="true" />
								<span className="text-[11px] text-[#9A9082]">
									HOA: <span className="text-[#5A5248] font-medium">${property.HOAFee ?? 0}</span>
									{" / "}{property.HOAFeeFreq}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* ── Footer ── */}
				<div className="
					px-5 py-3 mt-auto
					border-t border-[#EDEAE3]
					bg-[#F5F3EE]
				">
					<div className="text-[10px] leading-snug text-[#A09890] tracking-wide flex flex-col gap-1">
						<p><span className="font-semibold text-[#8C847A]">Source:</span> NAPLESMLS#{property.MLSNumber}</p>
						<p><span className="font-semibold text-[#8C847A]">Listing Office:</span> <span className="text-[#7A7060]">{property.ListOfficeName || (property.raw as any)?.ListOfficeName || "N/A"}</span></p>
						<p><span className="font-semibold text-[#8C847A]">Showing Office:</span> <span className="text-[#7A7060]">GULFSHORE GROUP</span></p>
					</div>
				</div>
			</article>
		</a>
	);
};


/* ─── Map Popup Card ─────────────────────────────────────────────────── */
export const PropertyCard2 = ({
	property,
	onCardClose,
}: {
	property: any;
	onCardClose: any;
}) => {
	const [imageError, setImageError] = useState(false);
	const media = property.images as any;
	let images: string[] = [];
	if (Array.isArray(media) && media.length > 0) {
		images = media
			.map((item: any) => {
				if (typeof item === "string" && item.trim() !== "") return item;
				if (typeof item?.MediaURL === "string" && item.MediaURL.trim() !== "") {
					if (!item.MediaCategory || item.MediaCategory === "Photo") return item.MediaURL;
				}
				return null;
			})
			.filter(Boolean) as string[];
	}

	return (
		<Card className="
			relative overflow-hidden p-0
			bg-[#FAFAF8] border border-[#E8E4DC]
			shadow-[0_4px_24px_rgba(0,0,0,0.12)]
			rounded-2xl
			max-h-[250px] md:max-h-[420px] w-full
		">
			{/* Close button */}
			<button
				className="
					absolute top-2.5 right-2.5 z-20
					bg-white/90 backdrop-blur-sm hover:bg-white
					text-[#5A5248] hover:text-[#1C1712]
					rounded-full p-1.5
					shadow-sm border border-[#E8E4DC]
					transition-all duration-200
					cursor-pointer
				"
				onClick={onCardClose}
				aria-label="Close property card">
				<X size={14} />
			</button>

			<Link
				className="flex flex-row h-full"
				target="_blank"
				href={UrlMaker(
					property.City,
					property.Community || "",
					property.FullAddress,
					property.MLSNumber
				)}>

				{/* Thumbnail */}
				<div className="relative shrink-0 w-36 sm:w-44 md:w-48">
					{images.length && images[0] && !imageError ? (
						<Image
							width={200}
							height={420}
							src={images[0]}
							priority
							loading="eager"
							alt={property.FullAddress}
							unoptimized
							onError={() => setImageError(true)}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full bg-[#EDE9E2] flex items-center justify-center">
							<Landmark size={28} className="text-[#C9C0B0]" />
						</div>
					)}
					{/* subtle gradient overlay */}
					<div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/5 pointer-events-none" />
				</div>

				{/* Content */}
				<div className="flex flex-col flex-1 min-w-0 px-4 py-3.5">

					<p className="text-lg sm:text-xl font-semibold text-[#1C1712] leading-tight mb-0.5">
						{formatPrice(
							(property.StandardStatus === "Closed" || property.MlsStatus === "Sold")
								? (property.ClosePrice || property.ListPrice)
								: property.ListPrice
						)}
					</p>

					{/* Address */}
					<p className="text-[12px] sm:text-[13px] text-[#7A7060] line-clamp-2 leading-snug mb-3">
						{(() => {
							const address = property.FullAddress || "";
							const city = property.City || "";
							const state = property.StateOrProvince || "FL";
							const zip = property.PostalCode || "";
							
							if (address.toLowerCase().includes(city.toLowerCase())) {
								return capitalizeWords(address).replace(" Fl", " FL");
							}
							return `${capitalizeWords(address)}, ${capitalizeWords(city)}, ${state} ${zip}`.trim().replace(/,\s*$/, "");
						})()}
					</p>

					{/* Divider */}
					<div className="h-px bg-[#E8E4DC] mb-2.5" />

					{/* Stats */}
					<PropertyCardInfoLabels2 property={property} />

					{/* Street View Link */}
					{property.Latitude && property.Longitude && (
						<div className="mt-2.5">
							<a
								href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${property.Latitude},${property.Longitude}`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-[#5A5248] text-[11px] font-medium transition-colors border border-gray-200/60"
								onClick={(e) => e.stopPropagation()}
							>
								<Eye size={12} className="text-[#B89A6A]" /> Street & Real View
							</a>
						</div>
					)}

					{/* Footer */}
					<div className="p-3 border-t border-[#E8E4DC] bg-[#FAF9F7] text-[10px] text-[#A09890] mt-auto">
						<div className="flex flex-col gap-1 opacity-90">
							<p><span className="font-semibold text-[#8C847A]">Source:</span> NAPLESMLS#{property.MLSNumber}</p>
							<p><span className="font-semibold text-[#8C847A]">Listing Office:</span> <span className="text-[#7A7060]">{property.ListOfficeName || (property.raw as any)?.ListOfficeName || "N/A"}</span></p>
							<p><span className="font-semibold text-[#8C847A]">Showing Office:</span> <span className="text-[#7A7060]">GULFSHORE GROUP</span></p>
						</div>
					</div>
					<Image
						className="h-5 w-auto opacity-40 hidden sm:block shrink-0 ml-2 mt-2"
						src="https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289229/brokerreciprocitylogo_jl5omm.jpg"
						alt="MLS"
						width={84}
						height={90}
					/>
				</div>
			</Link>
		</Card>
	);
};

export default PropertyCard;


/* ─── Info Labels (shared) ───────────────────────────────────────────── */
const PropertyCardInfoLabels = ({ property }: { property: Property }) => {
	if (property.PropertyType === "Land") {
		return (
			<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
				<Stat icon={<Trees size={12} />} value={capitalizeWords(property.PropertyType || "")} />
				{isValidField(property.LotSizeAcres || "") && (
					<Stat
						icon={<Ruler size={12} />}
						value={`${(property.LotSizeAcres || 0).toFixed(2)} Acres`}
					/>
				)}
			</div>
		);
	}

	return (
		<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
			{isValidField(property.BedroomsTotal) && (
				<Stat
					icon={<BedDouble size={12} />}
					value={`${Number(property.BedroomsTotal)} Beds`}
				/>
			)}
			{isValidField(property.BathroomsFull) && (
				<Stat
					icon={<Bath size={12} />}
					value={`${Number(property.BathroomsFull)} Baths`}
				/>
			)}
			{isValidField(property.LivingArea) && (
				<Stat
					icon={<Ruler size={12} />}
					value={`${Number(property.LivingArea).toLocaleString()} sqft`}
				/>
			)}
			{isValidField(property.YearBuilt) && (
				<Stat
					icon={<CalendarDays size={12} />}
					value={`Built ${property.YearBuilt}`}
				/>
			)}
		</div>
	);
};

/* ─── Tiny stat pill ─────────────────────────────────────────────────── */
const Stat = ({
	icon,
	value,
}: {
	icon: React.ReactNode;
	value: string;
}) => (
	<span className="inline-flex items-center gap-1 text-[11px] text-[#5A5248] font-medium">
		<span className="text-[#B89A6A]">{icon}</span>
		{value}
	</span>
);


/* ─── PropertyCardInfoLabels2 (kept unchanged in logic) ──────────────── */
const PropertyCardInfoLabels2 = ({ property }: { property: any }) => {
	return (
		<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
			{isValidField(property.BedsTotal) && (
				<Stat icon={<BedDouble size={12} />} value={`${Number(property.BedsTotal)} Beds`} />
			)}
			{isValidField(property.BathsTotal) && (
				<Stat icon={<Bath size={12} />} value={`${Number(property.BathsTotal)} Baths`} />
			)}
			{isValidField(property.ApproxLivingArea) && (
				<Stat
					icon={<Ruler size={12} />}
					value={`${Number(property.ApproxLivingArea).toLocaleString()} sqft`}
				/>
			)}
			{isValidField(property.YearBuilt) && (
				<Stat icon={<CalendarDays size={12} />} value={`Built ${property.YearBuilt}`} />
			)}
			{isValidField(property.LotType) && (
				<Stat icon={<Trees size={12} />} value={capitalizeWords(property.LotType)} />
			)}
			{isValidField(property.OwnershipDesc) && (
				<span className="text-[11px] text-[#5A5248] font-medium">
					{capitalizeWords(property.OwnershipDesc)}
				</span>
			)}
			{isValidField(property.MasterHOAFee) && (
				<span className="inline-flex items-center gap-1 text-[11px] text-[#5A5248] font-medium">
					<Landmark size={12} className="text-[#B89A6A]" />
					HOA: ${Math.ceil(property.MasterHOAFee)}/{property.MasterHOAFeeFreq}
				</span>
			)}
			{isValidField(property.LotType) && isValidField(property.Acres) && (
				<Stat
					icon={<Ruler size={12} />}
					value={`${Number(property.Acres * 43560).toFixed(0)} sqft lot`}
				/>
			)}
		</div>
	);
};