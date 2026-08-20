"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, DollarSign, Calendar, PieChart, Home } from "lucide-react";
import { MarketReportData } from "@/lib/services/market-report.service";

interface MarketReportSectionProps {
	city?: string;
	community?: string;
}

export default function MarketReportSection({ city, community }: MarketReportSectionProps) {
	const [report, setReport] = useState<MarketReportData | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<boolean>(false);

	useEffect(() => {
		let isMounted = true;
		setLoading(true);
		setError(false);

		const params = new URLSearchParams();
		if (city) params.set("city", city);
		if (community) params.set("community", community);

		fetch(`/api/v2/market-report?${params.toString()}`)
			.then((res) => res.json())
			.then((json) => {
				if (isMounted) {
					if (json.success && json.data) {
						setReport(json.data);
					} else {
						setError(true);
					}
					setLoading(false);
				}
			})
			.catch(() => {
				if (isMounted) {
					setError(true);
					setLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [city, community]);

	if (loading) {
		return (
			<div className="bg-white  rounded-2xl border border-gray-100  p-6 my-6 animate-pulse">
				<div className="h-6 w-48 bg-gray-200  rounded mb-4"></div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<div key={i} className="h-20 bg-gray-100  rounded-xl"></div>
					))}
				</div>
			</div>
		);
	}

	if (error || !report || report.activeListings === 0) {
		return null; // Gracefully hide empty/error states
	}

	const locationLabel = community || city || "Florida";

	return (
		<div className="bg-white  rounded-2xl border border-gray-100  p-6 shadow-sm my-8">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-gray-100 ">
				<div>
					<div className="flex items-center gap-2">
						<TrendingUp className="w-5 h-5 text-primary" />
						<h3 className="text-xl font-bold text-gray-900 ">
							{locationLabel} Real Estate Market Report
						</h3>
					</div>
					<p className="text-xs text-muted-foreground mt-1">
						Live statistics based on current active MLS listings
					</p>
				</div>
				<span className="text-[11px] font-medium text-gray-400 bg-gray-50  px-3 py-1 rounded-full self-start sm:self-auto">
					Updated {new Date(report.lastUpdated).toLocaleDateString()}
				</span>
			</div>

			{/* Metric Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				{/* Active Listings */}
				<div className="p-4 rounded-xl bg-gray-50  border border-gray-100 ">
					<div className="flex items-center justify-between mb-2">
						<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							Active Listings
						</span>
						<Home className="w-4 h-4 text-primary" />
					</div>
					<p className="text-2xl font-extrabold text-gray-900 ">
						{report.activeListings.toLocaleString()}
					</p>
				</div>

				{/* Median Price */}
				<div className="p-4 rounded-xl bg-gray-50  border border-gray-100 ">
					<div className="flex items-center justify-between mb-2">
						<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							Median List Price
						</span>
						<DollarSign className="w-4 h-4 text-emerald-600 " />
					</div>
					<p className="text-2xl font-extrabold text-gray-900 ">
						${report.medianListPrice.toLocaleString()}
					</p>
				</div>

				{/* Avg Days on Market */}
				<div className="p-4 rounded-xl bg-gray-50  border border-gray-100 ">
					<div className="flex items-center justify-between mb-2">
						<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							Avg Days on Market
						</span>
						<Calendar className="w-4 h-4 text-amber-500" />
					</div>
					<p className="text-2xl font-extrabold text-gray-900 ">
						{report.avgDaysOnMarket} Days
					</p>
				</div>

				{/* Avg Price per SqFt */}
				<div className="p-4 rounded-xl bg-gray-50  border border-gray-100 ">
					<div className="flex items-center justify-between mb-2">
						<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
							Avg Price / SqFt
						</span>
						<PieChart className="w-4 h-4 text-indigo-500" />
					</div>
					<p className="text-2xl font-extrabold text-gray-900 ">
						${report.avgPricePerSqft} / sqft
					</p>
				</div>
			</div>

			{/* Property Type Distribution */}
			{report.propertyTypes && report.propertyTypes.length > 0 && (
				<div>
					<h4 className="text-xs font-bold text-gray-700  uppercase tracking-wider mb-3">
						Property Type Breakdown
					</h4>
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
						{report.propertyTypes.map((item, idx) => (
							<div
								key={idx}
								className="p-3 rounded-lg bg-gray-50/70  border border-gray-100  flex justify-between items-center text-xs">
								<span className="font-semibold text-gray-800 ">
									{item.type}
								</span>
								<span className="font-bold text-primary">
									{item.count} ({item.percentage}%)
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
