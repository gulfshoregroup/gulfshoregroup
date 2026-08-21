"use client";

import type React from "react";
import { Badge } from "@/components/ui/badge";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

import {
	BathIcon,
	BedDoubleIcon,
	DollarSignIcon,
	HomeIcon,
	MapPinIcon,
	RulerIcon,
	SparklesIcon,
	CheckCircle2Icon,
	XCircleIcon,
	PanelsTopLeftIcon,
	Building2Icon,
} from "lucide-react";
import capitalizeWords from "@/hooks/capitalize-letter";
import { Property } from "@/app/generated/prisma/client";
import ReadMore from "@/components/property/readmore";

// Helper formatters for cleaner, user-friendly values
function formatCurrency(input: string | number | null | undefined) {
	if (
		input === null ||
		input === undefined ||
		input === "" ||
		input === "N/A"
	)
		return null;
	const num =
		typeof input === "number"
			? input
			: Number(String(input).replace(/[^\d.-]/g, ""));
	if (Number.isNaN(num)) return String(input);
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(num);
}

function formatNumber(input: string | number | null | undefined) {
	if (
		input === null ||
		input === undefined ||
		input === "" ||
		input === "N/A"
	)
		return null;
	const num =
		typeof input === "number"
			? input
			: Number(String(input).replace(/[^\d.-]/g, ""));
	if (Number.isNaN(num)) return String(input);
	return new Intl.NumberFormat("en-US").format(num);
}

function formatSqFt(input: string | number | null | undefined) {
	const n = formatNumber(input);
	return n ? `${n} sq ft` : null;
}

function formatAcres(input: string | number | null | undefined) {
	const n = formatNumber(input);
	return n ? `${n} acres` : null;
}

// Helper to parse JSON arrays or comma-separated lists for chips
function parseList(input: any) {
	if (!input) return [];
	if (Array.isArray(input)) return input;
	if (typeof input === "string") {
		return input
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}
	return [];
}

// Helper to calculate annual fee based on frequency
function getAnnualFee(fee: any, freq: any): number {
	const numFee = typeof fee === "number" ? fee : Number(String(fee || "").replace(/[^\d.-]/g, ""));
	if (Number.isNaN(numFee) || numFee === 0) return 0;
	
	const f = String(freq || "").toLowerCase();
	let multiplier = 0; // Default 0 if no frequency is provided (can't reliably annualize)
	if (f.includes("month")) multiplier = 12;
	else if (f.includes("quarter")) multiplier = 4;
	else if (f.includes("semi")) multiplier = 2;
	else if (f.includes("annual") || f.includes("year")) multiplier = 1;
	else if (f.includes("week")) multiplier = 52;
	else if (f === "" || f === "undefined" || f === "null") multiplier = 0; // Don't guess if missing

	return numFee * multiplier;
}

// Compact Yes/No with icons to improve scan-ability
function YesNoBadge({
	value,
}: {
	value: boolean | null | undefined;
}) {
	if (value === null || value === undefined) return null;
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
				value
					? "bg-primary text-primary-foreground"
					: "bg-secondary text-secondary-foreground"
			}`}
			aria-label={value ? "Yes" : "No"}>
			{value ? (
				<CheckCircle2Icon className="size-3.5" aria-hidden="true" />
			) : (
				<XCircleIcon className="size-3.5" aria-hidden="true" />
			)}
			{value ? "Yes" : "No"}
		</span>
	);
}

// Enhance InfoRow to use YesNoBadge and keep clean alignment
function InfoRow({
	label,
	value,
	formatter,
	isBoolean = false,
}: {
	label: string;
	value: string | number | boolean | null | undefined;
	formatter?: (v: any) => React.ReactNode | string | null;
	isBoolean?: boolean;
}) {
	const isValidField = (value: any) => {
		if (typeof value === "boolean") return true;
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
			value !== "No Information" &&
			value !== "Not Applicable" &&
			value !== "See Remarks"
		);
	};

	const display =
		typeof formatter === "function" ? formatter(value) : value;
	if (!isValidField(value) || display === null) return null;

	const yesNo = isBoolean
		? YesNoBadge({ value: value as boolean })
		: null;

	return (
		<div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-2 md:gap-4 py-2 border-b border-border">
			<div className="text-xs md:text-sm font-medium text-muted-foreground">
				{label}
			</div>
			<div className="text-sm font-medium text-gray-800 md:text-right break-words hyphens-auto whitespace-pre-wrap">
				{yesNo || (display as React.ReactNode)}
			</div>
		</div>
	);
}

export default function PropertyDetailsTable({
	property,
}: {
	property: Property;
}) {
	const price = formatCurrency(property.ListPrice);
	const beds = formatNumber(property.BedroomsTotal);
	const baths = formatNumber(property.BathroomsFull);
	const sqft = property.LivingArea
		? `${formatNumber(property.LivingArea)} sq ft`
		: property.LotSizeSquareFeet
		? `${formatNumber(property.LotSizeSquareFeet)} sq ft`
		: null;

	const description = (property as any)?.Description || (property.raw as any)?.PublicRemarks || null;

	// Parse features from JSON fields
	const exteriorList = parseList(
		(property.raw as any)?.ExteriorFeatures
	);
	const interiorList = parseList(
		(property.raw as any)?.InteriorFeatures
	);
	const appliancesList = parseList((property.raw as any)?.Appliances);
	const flooringList = parseList((property.raw as any)?.Flooring);
	const heatingList = parseList((property.raw as any)?.Heating);
	const coolingList = parseList((property.raw as any)?.Cooling);

	return (
		<div className="w-full mx-auto space-y-6 md:space-y-8">
			{description && (
				<div
					style={{
						overflowWrap: "break-word",
						whiteSpace: "pre-wrap",
						wordWrap: "break-word",
					}}
					className="w-[calc(100% - 1rem)] border-y py-5 border-gray-200">
					<h2 className="lg:text-xl text-lg font-medium mb-4">
						Property Overview
					</h2>
					<ReadMore
						maxLength={450}
						readMoreText="Read More"
						readLessText="Read Less"
						className="text-sm lg:text-base md:font-normal font-light">
						{description}
					</ReadMore>
				</div>
			)}
			{/* Collapsible sections for cleaner scanning */}
			<Accordion
				type="multiple"
				defaultValue={[
					"basic",
					"pricing",
					"beds",
					"location",
					"amenities",
					"interior-exterior",
				]}
				className="rounded-lg border border-border bg-card">
				{/* Basic Information */}
				<AccordionItem value="basic" className="px-4 md:px-6">
					<AccordionTrigger className="text-left">
						<div className="flex items-center gap-2">
							<HomeIcon
								className="size-4 text-muted-foreground"
								aria-hidden="true"
							/>
							<span className="text-base md:text-lg font-semibold text-foreground">
								Basic Information
							</span>
						</div>
					</AccordionTrigger>
					<AccordionContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
							<InfoRow
								label="Full Address"
								value={capitalizeWords(property.FullAddress).replace(
									" Fl",
									" FL"
								)}
							/>
							<InfoRow
								label="Property Type"
								value={property.PropertyType}
							/>
							<InfoRow
								label="Property Sub Type"
								value={property.PropertySubType}
							/>
							<InfoRow
								label="Status"
								value={property.StandardStatus}
							/>
							<InfoRow
								label="Year Built"
								value={property.YearBuilt}
							/>
							<InfoRow
								label="List Office Name"
								value={property.ListOfficeName}
							/>
							<InfoRow
								label="MLS Number"
								value={property.MLSNumber}
							/>
							<InfoRow
								label="Stories"
								value={property.StoriesTotal}
								formatter={formatNumber}
							/>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Pricing */}
				<AccordionItem value="pricing" className="px-4 md:px-6">
					<AccordionTrigger className="text-left">
						<div className="flex items-center gap-2">
							<DollarSignIcon
								className="size-4 text-muted-foreground"
								aria-hidden="true"
							/>
							<span className="text-base md:text-lg font-semibold text-foreground">
								Pricing
							</span>
						</div>
					</AccordionTrigger>
					<AccordionContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
							<InfoRow
								label="Price"
								value={property.ListPrice}
								formatter={formatCurrency}
							/>

							{(property.raw as any)?.NABOR_MandatoryHOAYN ? (
								<>
									<InfoRow
										label="HOA Fee"
										value={(property.raw as any)?.NABOR_HOAFee}
										formatter={formatCurrency}
									/>
									<InfoRow
										label="HOA Fee Frequency"
										value={
											(property.raw as any)?.NABOR_HOAFeeFrequency
										}
									/>
									<InfoRow
										label="Master HOA Fee"
										value={(property.raw as any)?.NABOR_MasterHOAFee}
										formatter={formatCurrency}
									/>
									<InfoRow
										label="Master HOA Fee Frequency"
										value={
											(property.raw as any)
												?.NABOR_MasterHOAFeeFrequency
										}
									/>
									<InfoRow
										label="Condo Fee"
										value={(property.raw as any)?.CondoFee}
										formatter={formatCurrency}
									/>
									<InfoRow
										label="Condo Fee Frequency"
										value={
											(property.raw as any)?.CondoFeeFrequency
										}
									/>
									{/* Calculate and show Total Annual HOA Fee */}
									{(() => {
										const hoaFee = getAnnualFee((property.raw as any)?.NABOR_HOAFee, (property.raw as any)?.NABOR_HOAFeeFrequency);
										const masterHoaFee = getAnnualFee((property.raw as any)?.NABOR_MasterHOAFee, (property.raw as any)?.NABOR_MasterHOAFeeFrequency);
										const standardHoa = getAnnualFee((property.raw as any)?.AssociationFee, (property.raw as any)?.AssociationFeeFrequency);
										const condoFee = getAnnualFee((property.raw as any)?.CondoFee, (property.raw as any)?.CondoFeeFrequency);
										
										const totalAnnual = hoaFee + masterHoaFee + standardHoa + condoFee;
										if (totalAnnual > 0) {
											return (
												<InfoRow
													label="Total Annual HOA Fee"
													value={totalAnnual}
													formatter={formatCurrency}
												/>
											);
										}
										return null;
									})()}
								</>
							) : (
								<InfoRow label="HOA" value={"NO HOA"} />
							)}

							<InfoRow
								label="Tax Annual Amount"
								value={(property.raw as any)?.TaxAnnualAmount}
								formatter={formatCurrency}
							/>
							<InfoRow label="Tax Year" value={property.TaxYear} />
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Location & Lot */}
				<AccordionItem value="location" className="px-4 md:px-6">
					<AccordionTrigger className="text-left">
						<div className="flex items-center gap-2">
							<MapPinIcon
								className="size-4 text-muted-foreground"
								aria-hidden="true"
							/>
							<span className="text-base md:text-lg font-semibold text-foreground">
								Location & Lot
							</span>
						</div>
					</AccordionTrigger>
					<AccordionContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
							<InfoRow
								label="City"
								value={capitalizeWords(property.City)}
							/>
							<InfoRow
								label="Community"
								value={capitalizeWords(property.Community || "")}
							/>
							<InfoRow
								label="Subdivision"
								value={property.SubdivisionName}
							/>
							<InfoRow
								label="State/Province"
								value={property.StateOrProvince}
							/>
							<InfoRow
								label="Postal Code"
								value={property.PostalCode}
							/>
							<InfoRow
								label="County/Parish"
								value={property.CountyOrParish}
							/>
							<InfoRow
								label="Lot Size (Acres)"
								value={property.LotSizeAcres}
								formatter={formatAcres}
							/>
							<InfoRow
								label="Lot Size (Sq. Ft.)"
								value={property.LotSizeSquareFeet}
								formatter={formatSqFt}
							/>
							<InfoRow
								label="Total Stories"
								value={property.StoriesTotal}
								formatter={formatNumber}
							/>
						</div>
					</AccordionContent>
				</AccordionItem>

				{/* Amenities & Features */}
				<AccordionItem value="amenities" className="px-4 md:px-6">
					<AccordionTrigger className="text-left">
						<div className="flex items-center gap-2">
							<SparklesIcon
								className="size-4 text-muted-foreground"
								aria-hidden="true"
							/>
							<span className="text-base md:text-lg font-semibold text-foreground">
								Amenities & Features
							</span>
						</div>
					</AccordionTrigger>
					<AccordionContent>
						<div className="grid grid-cols-1 gap-4">
							{/* Display cooling/heating as chips if arrays, otherwise as text */}
							{coolingList.length > 0 ? (
								<div>
									<div className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
										Cooling
									</div>
									<div className="flex flex-wrap gap-2">
										{coolingList.map((c, i) => (
											<Badge key={`cool-${i}`} variant="outline">
												{c}
											</Badge>
										))}
									</div>
								</div>
							) : null}

							{heatingList.length > 0 ? (
								<div>
									<div className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
										Heating
									</div>
									<div className="flex flex-wrap gap-2">
										{heatingList.map((h, i) => (
											<Badge key={`heat-${i}`} variant="outline">
												{h}
											</Badge>
										))}
									</div>
								</div>
							) : null}

							<div className="grid grid-cols-1 mt-4 md:grid-cols-2 gap-x-6">
								<InfoRow
									label="Garage"
									value={property.GarageYN}
									isBoolean
								/>
								<InfoRow
									label="Garage Spaces"
									value={property.GarageSpaces}
									formatter={formatNumber}
								/>
								<InfoRow
									label="Parking Total"
									value={property.ParkingTotal}
									formatter={formatNumber}
								/>
								<InfoRow
									label="Private Pool"
									value={property.PoolPrivateYN}
									isBoolean
								/>
								<InfoRow
									label="Spa"
									value={property.SpaYN}
									isBoolean
								/>
								<InfoRow
									label="Waterfront"
									value={property.WaterfrontYN}
									isBoolean
								/>
								<InfoRow
									label="View"
									value={property.ViewYN}
									isBoolean
								/>

								<InfoRow
									label="New Construction"
									value={property.NewConstructionYN}
									isBoolean
								/>
								<InfoRow
									label="Furnished"
									value={property.Furnished}
								/>
							</div>
						</div>
					</AccordionContent>
				</AccordionItem>

				{property.PropertyType === "Lot and Land" ? null : (
					<>
						{/* Beds & Baths */}
						<AccordionItem value="beds" className="px-4 md:px-6">
							<AccordionTrigger className="text-left">
								<div className="flex items-center gap-2">
									<BedDoubleIcon
										className="size-4 text-muted-foreground"
										aria-hidden="true"
									/>
									<span className="text-base md:text-lg font-semibold text-foreground">
										Beds & Baths
									</span>
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="grid grid-cols-2 gap-x-6">
									<InfoRow
										label="Bedrooms Total"
										value={property.BedroomsTotal}
										formatter={formatNumber}
									/>
									<InfoRow
										label="Bathrooms Full"
										value={property.BathroomsFull}
										formatter={formatNumber}
									/>
									<InfoRow
										label="Bathrooms Half"
										value={property.BathroomsHalf}
										formatter={formatNumber}
									/>
									<InfoRow
										label="Bathrooms Total"
										value={property.BathroomsTotalInteger}
										formatter={formatNumber}
									/>
									<InfoRow
										label="Living Area"
										value={property.LivingArea}
										formatter={formatSqFt}
									/>
									<InfoRow
										label="Building Area Total"
										value={property.BuildingAreaTotal}
										formatter={formatSqFt}
									/>
									<InfoRow
										label="Rooms Total"
										value={property.RoomsTotal}
										formatter={formatNumber}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>

						{/* Interior & Exterior */}
						<AccordionItem
							value="interior-exterior"
							className="px-4 md:px-6">
							<AccordionTrigger className="text-left">
								<div className="flex items-center gap-2">
									<Building2Icon
										className="size-4 text-muted-foreground"
										aria-hidden="true"
									/>
									<span className="text-base md:text-lg font-semibold text-foreground">
										Interior & Exterior
									</span>
								</div>
							</AccordionTrigger>
							<AccordionContent>
								<div className="grid grid-cols-1 pt-6 lg:grid-cols-2 gap-4">
									{/* Exterior Features as chips */}
									{exteriorList.length > 0 ? (
										<div>
											<div className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
												Exterior Features
											</div>
											<div className="flex flex-wrap gap-2">
												{exteriorList.map((e, i) => (
													<Badge key={`ext-${i}`} variant="outline">
														{e}
													</Badge>
												))}
											</div>
										</div>
									) : null}

									{/* Interior Features as chips */}
									{interiorList.length > 0 ? (
										<div>
											<div className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
												Interior Features
											</div>
											<div className="flex flex-wrap gap-2">
												{interiorList.map((e, i) => (
													<Badge key={`int-${i}`} variant="outline">
														{e}
													</Badge>
												))}
											</div>
										</div>
									) : null}

									{/* Appliances as chips */}
									{appliancesList.length > 0 ? (
										<div className="md:col-span-1 lg:col-span-1">
											<div className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
												Appliances
											</div>
											<div className="flex flex-wrap gap-2">
												{appliancesList.map((e, i) => (
													<Badge key={`app-${i}`} variant="outline">
														{e}
													</Badge>
												))}
											</div>
										</div>
									) : null}

									{/* Flooring as chips */}
									{flooringList.length > 0 ? (
										<div className="md:col-span-1 lg:col-span-1">
											<div className="text-xs md:text-sm font-medium text-muted-foreground mb-2">
												Flooring
											</div>
											<div className="flex flex-wrap gap-2">
												{flooringList.map((f, i) => (
													<Badge key={`fl-${i}`} variant="outline">
														{f}
													</Badge>
												))}
											</div>
										</div>
									) : null}
								</div>
							</AccordionContent>
						</AccordionItem>
					</>
				)}
			</Accordion>
		</div>
	);
}
