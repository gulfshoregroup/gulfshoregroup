"use client";
import React, { useState, useEffect } from "react";

export default function ListingLabels({
	CreatedDate,
	Status,
	StatusType,
	pool,
	spa,
	gulfAccess,
	waterFront,
	DaysOnMarket,
}: {
	CreatedDate: string | number | Date;
	DaysOnMarket?: string | number | Date;
	Status?: string;
	StatusType?: string;
	pool?: boolean;
	spa?: boolean;
	gulfAccess?: boolean;
	waterFront?: boolean;
}) {
	const [timeAgo, setTimeAgo] = useState<string | null>(null);

	useEffect(() => {
		if (!CreatedDate) return;
		const calculateTimeDifference = (
			time: string | number | Date
		): string | null => {
			const now = new Date();
			const diffMins = (now.getTime() - new Date(time).getTime()) / 1000 / 60; 
			
			if (diffMins <= 60) return `${Math.max(1, Math.floor(diffMins))} minutes ago`;
			if (diffMins <= 1440) {
				const hrs = Math.floor(diffMins / 60);
				return hrs === 1 ? `1 hour ago` : `${hrs} hours ago`;
			}
			
			const days = Math.floor(diffMins / 1440);
			if (days < 30) {
				return days === 1 ? `1 day ago` : `${days} days ago`;
			}
			
			const months = Math.floor(days / 30);
			if (months < 12) {
				return months === 1 ? `1 month ago` : `${months} months ago`;
			}
			
			const years = Math.floor(days / 365);
			return years === 1 ? `1 year ago` : `${years} years ago`;
		};
		setTimeAgo(calculateTimeDifference(CreatedDate));
	}, [CreatedDate]);

	return (
		<div className="flex flex-wrap gap-2 items-center justify-start">
			{timeAgo && (
				<div className="text-center w-fit">
					<p className="font-semibold text-xs w-fit  px-2 py-1.5 rounded-2xl bg-black/70 focus:ring-4 focus:outline-none shadow-md  text-white">
						{timeAgo}
					</p>
				</div>
			)}
			{StatusType && StatusType !== "Resale Property" && (
				<span className="px-2.5 py-1 text-xs  font-normal md:font-medium bg-red-700 text-white rounded">
					{StatusType}
				</span>
			)}
			{Status && (
				<div className="flex flex-nowrap my-2 items-center gap-2 rounded w-fit py-1.5 px-2">
					<span>
						{Status === "Active" && (
							<>
								<div className="w-2 h-2 rounded bg-green-600"></div>
							</>
						)}
					</span>
					<span className="lg:lg:font-semibold  text-xs font-normal md:font-medium ">
						{Status === "Active" ? "Active" : Status}
					</span>
				</div>
			)}
			{waterFront && (
				<span className="px-2.5 py-1 text-xs w-fit  font-normal md:font-medium bg-blue-700 text-white rounded-full">
					Waterfront
				</span>
			)}{" "}
			{gulfAccess && (
				<span className="px-2.5 py-1 text-xs w-fit  font-normal md:font-medium bg-amber-600 text-white rounded-full">
					Gulf Access
				</span>
			)}
		</div>
	);
}
