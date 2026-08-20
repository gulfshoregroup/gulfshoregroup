"use client";
import React, { useState } from "react";
import PropertySection from "@/components/property/propertysection/propertySlider";
import capitalizeWords from "@/hooks/capitalize-letter";
import Link from "next/link";

interface Props {
	city: string;
	community: string;
	formattedCity: string;
	formattedCommunity: string;
}

const TABS = [
	{ label: "Active Listings", status: "Active" },
	{ label: "Sold Listings", status: "Sold" },
	{ label: "Pending Listings", status: "Pending" },
] as const;

export default function CommunityListingsTabs({
	city,
	community,
	formattedCity,
	formattedCommunity,
}: Props) {
	const [activeTab, setActiveTab] = useState<"Active" | "Sold" | "Pending">("Active");

	const isSold = activeTab === "Sold";
	const isPending = activeTab === "Pending";

	return (
		<div className="flex flex-col gap-8">
			{/* Tab Header */}
			<div className="flex flex-col gap-3">
				<div className="flex items-center justify-between flex-wrap gap-3">
					<h2 className="lg:text-2xl text-xl font-medium">
						{isSold
							? "Recently Sold in "
							: isPending
							? "Pending Sales in "
							: "Active Listings in "}
						<span className="text-primary font-bold">
							{capitalizeWords(formattedCommunity)},{" "}
							{capitalizeWords(formattedCity)}, Florida
						</span>
					</h2>
					{/* View all link */}
					<Link
						href={`/Florida-Real-Estate-Search/${city.replaceAll(" ", "-").toLowerCase()}/${community.replaceAll(" ", "-").toLowerCase()}?status=${activeTab}`}
						className="text-sm text-primary border border-primary rounded-full px-4 py-1.5 hover:bg-primary hover:text-white transition-colors whitespace-nowrap">
						View All on Map →
					</Link>
				</div>

				{/* Tab Buttons */}
				<div className="flex gap-1 border-b border-gray-200">
					{TABS.map(({ label, status }) => (
						<button
							key={status}
							onClick={() => setActiveTab(status)}
							className={`px-5 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
								activeTab === status
									? "border-primary text-primary"
									: "border-transparent text-gray-500 hover:text-gray-900"
							}`}>
							{label}
						</button>
					))}
				</div>
			</div>

			{/* Active Listings Tab */}
			{activeTab === "Active" && (
				<div className="flex flex-col gap-10">
					<PropertySection
						props={
							<p className="text-sm text-gray-600">
								Latest active listings in {capitalizeWords(formattedCommunity)}
							</p>
						}
						queryParams={{
							city,
							developmentName: community,
							order: "asc",
							sort: "CreatedDate",
							status: "Active",
						}}
					/>
					<PropertySection
						props={
							<p className="text-sm text-gray-600">
								Homes for sale in {capitalizeWords(formattedCommunity)}
							</p>
						}
						queryParams={{
							city,
							developmentName: community,
							propertyTypes: ["Homes"],
							status: "Active",
						}}
					/>
					<PropertySection
						props={
							<p className="text-sm text-gray-600">
								Waterfront homes in {capitalizeWords(formattedCommunity)}
							</p>
						}
						queryParams={{
							city,
							developmentName: community,
							features: ["Waterfront"],
							status: "Active",
						}}
					/>
					<PropertySection
						props={
							<p className="text-sm text-gray-600">
								Homes under $1M in {capitalizeWords(formattedCommunity)}
							</p>
						}
						queryParams={{
							city,
							developmentName: community,
							maxPrice: "1000000",
							status: "Active",
						}}
					/>
				</div>
			)}

			{/* Sold Properties Tab */}
			{activeTab === "Sold" && (
				<div className="flex flex-col gap-6">
					<p className="text-sm text-gray-500">
						Recently sold properties in{" "}
						<span className="font-semibold text-gray-700">
							{capitalizeWords(formattedCommunity)}
						</span>
						. Use this data to understand market trends and pricing.
					</p>
					<PropertySection
						props={null}
						queryParams={{
							city,
							developmentName: community,
							status: "Sold",
						}}
					/>
				</div>
			)}

			{/* Pending Tab */}
			{activeTab === "Pending" && (
				<div className="flex flex-col gap-6">
					<p className="text-sm text-gray-500">
						Properties currently under contract in{" "}
						<span className="font-semibold text-gray-700">
							{capitalizeWords(formattedCommunity)}
						</span>
						.
					</p>
					<PropertySection
						props={null}
						queryParams={{
							city,
							developmentName: community,
							status: "Pending",
						}}
					/>
				</div>
			)}
		</div>
	);
}
