"use client";
import React, { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import capitalizeWords from "@/hooks/capitalize-letter";
import fetchCommunities from "@/DAL/FetchCommunities";

function CommunitiesSection({ city }: { city: any }) {
	const [showAll, setShowAll] = useState(false);
	const [communities, setCommunities] = useState<
		{
			name: string;
		}[]
	>([]);

	const [isAnimating, setIsAnimating] = useState(false);

	const INITIAL_SHOW_COUNT = 15;
	const visibleCommunities = showAll
		? communities
		: communities.slice(0, INITIAL_SHOW_COUNT);
	const hasMore = communities.length > INITIAL_SHOW_COUNT;

	const handleToggle = () => {
		setIsAnimating(true);
		setShowAll(!showAll);

		// Reset animation state after transition
		setTimeout(() => {
			setIsAnimating(false);
		}, 300);
	};

	useEffect(() => {
		const fetchData = async () => {
			const communitiesdata = await fetchCommunities(city);
			const data = communitiesdata.data || [];
			setCommunities(data);
			console.log(data);
		};
		fetchData();
	}, []);

	if (!communities.length) {
		return <></>;
	}

	return (
		<div className="w-11/12 max-w-[1600px] mx-auto py-6 mt-8 lg:mt-12">
			<div className="mb-6">
				<h2 className="text-xl lg:text-2xl font-medium text-slate-900 mb-2">
					<span className="text-primary">{city} Florida</span> Real
					Estate Communities
				</h2>
				<p className="text-gray-600">
					Explore {communities.length} communities across{" "}
					<span className="text-primary">
						{city + " "}
						Florida
					</span>
				</p>
			</div>

			<div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
				{visibleCommunities.map((community, i) => {
					const isVisible = i < INITIAL_SHOW_COUNT || showAll;

					return (
						community.name.trim() && (
							<a
								key={i}
								href={`/Florida-Real-Estate-Search/${capitalizeWords(
									city
								).replaceAll(" ", "-")}/${capitalizeWords(
									community.name
								).replaceAll(" ", "-")}`}
								className={`
                  inline-flex gap-2 items-center px-3 lg:py-3 py-2.5 
                  text-sm text-start md:font-medium font-normal 
                  text-blue-700 hover:text-blue-950 
                  border border-gray-200 hover:border-primary/20 
                  rounded-full transition-all duration-200 
                  hover:shadow-md hover:scale-[1.02] 
                  group relative overflow-hidden
                  ${!isVisible ? "hidden" : ""}
                  ${
										isAnimating
											? "transition-all duration-300 ease-in-out"
											: ""
									}
                `}>
								{/* Subtle hover effect background */}
								<div className="absolute inset-0 bg-linear-to-r from-blue-400/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

								<Search
									size={16}
									className="text-blue-600 group-hover:text-blue-800 transition-colors duration-200 shrink-0"
								/>
								<span className="relative z-10 text-sm  leading-tight">
									{capitalizeWords(community.name)}
								</span>

								{/* Modern accent line */}
								<div className="absolute bottom-0 left-0 w-0 h-0.5 bg-linear-to-r from-accent to-primary group-hover:w-full transition-all duration-300"></div>
							</a>
						)
					);
				})}
			</div>

			{/* Show More/Less Button */}
			{hasMore && (
				<div className="mt-8 text-center">
					<button
						onClick={handleToggle}
						className="
              inline-flex items-center gap-2 px-6 py-3 
              bg-linear-to-r from-primary/80 to-primary/90 
              hover:from-aceent/70 hover:to-primary/80 
              text-white font-medium text-sm 
              rounded-full shadow hover:shadow-lg
              transform hover:scale-105 transition-all duration-200 
              focus:outline-none focus:ring-4 
              relative overflow-hidden group
            ">
						{/* Button background animation */}
						<div className="absolute inset-0 bg-linear-to-r from-primary/50 to-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

						<span className="relative z-10">
							{showAll
								? "Show Less"
								: `Show ${
										communities.length - INITIAL_SHOW_COUNT
								  } More`}
						</span>

						{showAll ? (
							<ChevronUp
								size={18}
								className="relative z-10 transition-transform duration-200 group-hover:scale-110"
							/>
						) : (
							<ChevronDown
								size={18}
								className="relative z-10 transition-transform duration-200 group-hover:scale-110"
							/>
						)}

						{/* Ripple effect */}
						<div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-100 bg-white/20 scale-0 group-active:scale-100 transition-all duration-150"></div>
					</button>

					{/* Progress indicator */}
					<div className="mt-4 flex justify-center">
						<div className="flex items-center gap-2 text-sm text-gray-600">
							<span>Showing</span>
							<span className="font-medium text-blue-700">
								{showAll ? communities.length : INITIAL_SHOW_COUNT}
							</span>
							<span>of</span>
							<span className="font-medium text-blue-700">
								{communities.length}
							</span>
							<span>communities</span>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default CommunitiesSection;
