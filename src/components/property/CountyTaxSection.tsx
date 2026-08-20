"use client";

import React from "react";
import { Building2, ExternalLink, FileText, Landmark, Calendar, MapPin } from "lucide-react";
import { Property } from "@/app/generated/prisma/client";

interface CountyTaxSectionProps {
	property: Property;
}

export default function CountyTaxSection({ property }: CountyTaxSectionProps) {
	if (!property) return null;

	const rawData = (property.raw as any) || {};

	const county = property.CountyOrParish || rawData.CountyOrParish || null;
	const parcelNumber = rawData.ParcelNumber || null;
	const taxAmount = rawData.TaxAnnualAmount || null;
	const taxYear = property.TaxYear || rawData.TaxYear || null;
	const zoning = property.Zoning || rawData.Zoning || null;
	const zoningDesc = property.ZoningDescription || rawData.ZoningDescription || null;
	const currentUse = rawData.CurrentUse || null;

	let finalCurrentUse = currentUse;
	if (Array.isArray(currentUse)) {
		finalCurrentUse = currentUse.join(", ");
	}

	if (!county && !parcelNumber && (taxAmount === null || taxAmount === undefined) && !taxYear && !zoning && !finalCurrentUse) {
		return null;
	}

	// Generate Official County Appraiser Link
	let appraiserUrl: string | null = null;
	let appraiserName = "County Appraiser";

	if (county) {
		const lowerCounty = county.toLowerCase();
		if (lowerCounty.includes("collier")) {
			appraiserName = "Collier County Property Appraiser";
			appraiserUrl = parcelNumber
				? `https://www.collierappraiser.com/index.html?search_type=parcel_id&search_val=${encodeURIComponent(parcelNumber)}`
				: "https://www.collierappraiser.com";
		} else if (lowerCounty.includes("lee")) {
			appraiserName = "Lee County Property Appraiser (LEEPA)";
			appraiserUrl = parcelNumber
				? `https://www.leepa.org/Search/PropertySearch.aspx?STR=${encodeURIComponent(parcelNumber)}`
				: "https://www.leepa.org";
		} else if (lowerCounty.includes("charlotte")) {
			appraiserName = "Charlotte County Property Appraiser";
			appraiserUrl = "https://www.ccpafl.com";
		}
	}

	return (
		<div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-full flex flex-col">
			<div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100 ">
				<Landmark className="w-5 h-5 text-primary" />
				<h3 className="text-lg font-bold text-gray-900 ">
					County & Tax Information
				</h3>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{/* County */}
				{county && (
					<div className="p-3.5 rounded-xl bg-gray-50  border border-gray-100 ">
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
							<MapPin className="w-3.5 h-3.5" />
							<span>County / Parish</span>
						</div>
						<p className="text-sm font-semibold text-gray-900 ">
							{county} County
						</p>
					</div>
				)}

				{/* Parcel Number */}
				{parcelNumber && (
					<div className="p-3.5 rounded-xl bg-gray-50  border border-gray-100 ">
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
							<FileText className="w-3.5 h-3.5" />
							<span>Parcel / Folio ID</span>
						</div>
						<p className="text-sm font-semibold text-gray-900 ">
							{parcelNumber}
						</p>
					</div>
				)}

				{/* Land Use Code */}
				{finalCurrentUse && (
					<div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
							<Building2 className="w-3.5 h-3.5" />
							<span>Land Use Code</span>
						</div>
						<p className="text-sm font-semibold text-gray-900 ">
							{finalCurrentUse}
						</p>
					</div>
				)}

				{/* Annual Tax */}
				{taxAmount !== null && taxAmount !== undefined && (
					<div className="p-3.5 rounded-xl bg-gray-50  border border-gray-100 ">
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
							<Landmark className="w-3.5 h-3.5" />
							<span>Annual Tax Amount</span>
						</div>
						<p className="text-sm font-semibold text-gray-900 ">
							${Number(taxAmount).toLocaleString()}
						</p>
					</div>
				)}

				{/* Tax Year */}
				{taxYear && (
					<div className="p-3.5 rounded-xl bg-gray-50  border border-gray-100 ">
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
							<Calendar className="w-3.5 h-3.5" />
							<span>Tax Year</span>
						</div>
						<p className="text-sm font-semibold text-gray-900 ">
							{taxYear}
						</p>
					</div>
				)}

				{/* Zoning */}
				{zoning && (
					<div className="p-3.5 rounded-xl bg-gray-50  border border-gray-100  sm:col-span-2 lg:col-span-2">
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
							<Building2 className="w-3.5 h-3.5" />
							<span>Zoning & Classification</span>
						</div>
						<p className="text-sm font-semibold text-gray-900 ">
							{zoning} {zoningDesc ? `- ${zoningDesc}` : ""}
						</p>
					</div>
				)}
			</div>

			{/* County Appraiser Direct Link */}
			{appraiserUrl && (
				<div className="mt-auto pt-4 border-t border-gray-100 flex justify-end">
					<a
						href={appraiserUrl}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
						Search on {appraiserName} <ExternalLink className="w-3.5 h-3.5" />
					</a>
				</div>
			)}
		</div>
	);
}
