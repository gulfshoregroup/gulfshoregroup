import Footer from "@/components/global/footer";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import React from "react";

// Enhanced metadata generation with comprehensive SEO
export async function generateMetadata(): Promise<Metadata> {
	return {
		title: "Recommended Properties for You - Gulfsohre Group",
		description:
			"Recommended properties only for you. Explore the best real estate listings tailored to your preferences.",
		openGraph: {
			title: "Recommended Properties for You",
			description:
				"Recommended properties only for you. Explore the best real estate listings tailored to your preferences.",
			siteName: "Gulfshore Group",
			url: `https://gulfshoregroup.com/Recommended-Properties`,
			images: [
				{
					url: "https://gulfshoregroup.com/logo.png",
					alt: "Recommended Properties for You",
				},
			],
		},
		alternates: {
			canonical: `https://gulfshoregroup.com/Recommended-Properties`,
		},
	};
}

export default function page() {
	return redirect(`/Florida-Real-Estate-Search/`);
}
