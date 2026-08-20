"use client";

import React, { useEffect, useState } from "react";

interface MarketReportProps {
	city: string;
	community?: string;
}

interface ReportData {
	activeListings: number;
	avgListPrice: number;
	soldListings30Days: number;
	avgSoldPrice: number;
	avgDaysOnMarket: number;
}

export default function MarketReport({ city, community }: MarketReportProps) {
	const [data, setData] = useState<ReportData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchReport() {
			try {
				const params = new URLSearchParams({ city });
				if (community) params.append("community", community);

				const res = await fetch(`/api/v2/market-report?${params.toString()}`);
				const json = await res.json();
				if (json.success) {
					setData(json.data);
				}
			} catch (err) {
				console.error("Failed to fetch market report", err);
			} finally {
				setLoading(false);
			}
		}

		fetchReport();
	}, [city, community]);

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			maximumFractionDigits: 0,
		}).format(price || 0);
	};

	return (
		<div className="w-11/12 max-w-[1600px] mx-auto py-12">
			<div className="mb-8">
				<h2 className="text-3xl font-bold text-[#1C1712] mb-2">
					{community ? `${community}, ` : ""}{city} Market Report
				</h2>
				<p className="text-[#7A7060]">Real-time insights on the local real estate market (Last 30 Days)</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
				{/* Card 1: Active Listings */}
				<div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E4DC] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
					<div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
						<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
					</div>
					<h3 className="text-sm font-medium text-[#7A7060] mb-2">Active Listings</h3>
					{loading ? (
						<div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
					) : (
						<p className="text-3xl font-bold text-[#1C1712]">{data?.activeListings || 0}</p>
					)}
				</div>

				{/* Card 2: Average List Price */}
				<div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E4DC] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
					<div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
						<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
					</div>
					<h3 className="text-sm font-medium text-[#7A7060] mb-2">Avg List Price</h3>
					{loading ? (
						<div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
					) : (
						<p className="text-3xl font-bold text-[#1C1712]">{formatPrice(data?.avgListPrice || 0)}</p>
					)}
				</div>

				{/* Card 3: Homes Sold */}
				<div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E4DC] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
					<div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
						<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
					</div>
					<h3 className="text-sm font-medium text-[#7A7060] mb-2">Homes Sold (30d)</h3>
					{loading ? (
						<div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div>
					) : (
						<p className="text-3xl font-bold text-[#1C1712]">{data?.soldListings30Days || 0}</p>
					)}
				</div>

				{/* Card 4: Average Sold Price */}
				<div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E4DC] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] lg:col-span-1">
					<div className="absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10">
						<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
					</div>
					<h3 className="text-sm font-medium text-[#7A7060] mb-2">Avg Sold Price</h3>
					{loading ? (
						<div className="h-8 bg-gray-200 rounded animate-pulse w-32"></div>
					) : (
						<p className="text-3xl font-bold text-[#1C1712]">{formatPrice(data?.avgSoldPrice || 0)}</p>
					)}
				</div>

				{/* Card 5: Days on Market */}
				<div className="group relative overflow-hidden rounded-2xl bg-[#C1121F] text-white p-6 shadow-[0_8px_30px_rgba(193,18,31,0.2)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(193,18,31,0.3)]">
					<div className="absolute top-0 right-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
						<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
					</div>
					<h3 className="text-sm font-medium text-white/80 mb-2">Avg Days on Market</h3>
					{loading ? (
						<div className="h-8 bg-white/20 rounded animate-pulse w-16"></div>
					) : (
						<p className="text-3xl font-bold">{Math.round(data?.avgDaysOnMarket || 0)} Days</p>
					)}
				</div>
			</div>
		</div>
	);
}
