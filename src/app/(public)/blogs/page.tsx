import React from "react";
import BlogSection from "@/components/blogs/blogSection";
import Footer from "@/components/global/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Real Estate Blogs - GULFSHORE GROUP",
	description: "Tips, trends, and insights from Southwest Florida real estate experts.",
};

export default function page() {
	return (
		<div>
			<div className="mt-16 container mx-auto px-4">
				<BlogSection />
			</div>
			<Footer />
		</div>
	);
}
