"use client";

import React from "react";
import { GraduationCap, ExternalLink, School } from "lucide-react";
import { Property } from "@/app/generated/prisma/client";

interface SchoolInfoSectionProps {
	property: Property;
}

export default function SchoolInfoSection({ property }: SchoolInfoSectionProps) {
	if (!property) return null;

	const rawData = (property.raw as any) || {};

	const elementarySchool = rawData.ElementarySchool || null;
	const middleSchool = rawData.MiddleOrJuniorSchool || null;
	const highSchool = rawData.HighSchool || null;
	const schoolDistrict =
		rawData.HighSchoolDistrict || rawData.ElementarySchoolDistrict || rawData.MiddleSchoolDistrict || null;

	const city = property.City || "";

	// Function to generate GreatSchools search URL for a school
	const getGreatSchoolsUrl = (schoolName: string | null) => {
		if (!schoolName) return "https://www.greatschools.org";
		const query = `${schoolName} ${city} Florida`;
		return `https://www.greatschools.org/search/search.page?q=${encodeURIComponent(query)}`;
	};

	return (
		<div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm h-full flex flex-col">
			<div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100 ">
				<GraduationCap className="w-5 h-5 text-primary" />
				<h3 className="text-lg font-bold text-gray-900 ">
					School & Education Information
				</h3>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{/* Elementary School */}
				<div className="p-3.5 rounded-xl bg-gray-50  border border-gray-100  flex flex-col justify-between">
					<div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
							<School className="w-3.5 h-3.5" />
							<span>Elementary School</span>
						</div>
						<p className="text-sm font-semibold text-gray-900 ">
							{elementarySchool ? (
								elementarySchool
							) : (
								<span className="text-gray-400 font-normal italic">Not Provided by MLS</span>
							)}
						</p>
					</div>
					{elementarySchool && (
						<a
							href={getGreatSchoolsUrl(elementarySchool)}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mt-2">
							View Ratings <ExternalLink className="w-3 h-3" />
						</a>
					)}
				</div>

				{/* Middle School */}
				<div className="p-3.5 rounded-xl bg-gray-50  border border-gray-100  flex flex-col justify-between">
					<div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
							<School className="w-3.5 h-3.5" />
							<span>Middle / Junior High</span>
						</div>
						<p className="text-sm font-semibold text-gray-900 ">
							{middleSchool ? (
								middleSchool
							) : (
								<span className="text-gray-400 font-normal italic">Not Provided by MLS</span>
							)}
						</p>
					</div>
					{middleSchool && (
						<a
							href={getGreatSchoolsUrl(middleSchool)}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mt-2">
							View Ratings <ExternalLink className="w-3 h-3" />
						</a>
					)}
				</div>

				{/* High School */}
				<div className="p-3.5 rounded-xl bg-gray-50  border border-gray-100  flex flex-col justify-between">
					<div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
							<School className="w-3.5 h-3.5" />
							<span>High School</span>
						</div>
						<p className="text-sm font-semibold text-gray-900 ">
							{highSchool ? (
								highSchool
							) : (
								<span className="text-gray-400 font-normal italic">Not Provided by MLS</span>
							)}
						</p>
					</div>
					{highSchool && (
						<a
							href={getGreatSchoolsUrl(highSchool)}
							target="_blank"
							rel="noreferrer"
							className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mt-2">
							View Ratings <ExternalLink className="w-3 h-3" />
						</a>
					)}
				</div>

				{/* School District */}
				<div className="p-3.5 rounded-xl bg-gray-50  border border-gray-100  flex flex-col justify-between">
					<div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
							<GraduationCap className="w-3.5 h-3.5" />
							<span>School District</span>
						</div>
						<p className="text-sm font-semibold text-gray-900 ">
							{schoolDistrict ? (
								schoolDistrict
							) : (
								<span className="text-gray-400 font-normal italic">Not Provided by MLS</span>
							)}
						</p>
					</div>
					<a
						href={`https://www.greatschools.org/search/search.page?q=${encodeURIComponent(city + " Florida")}`}
						target="_blank"
						rel="noreferrer"
						className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mt-2">
						Browse City Schools <ExternalLink className="w-3 h-3" />
					</a>
				</div>
			</div>
		</div>
	);
}
