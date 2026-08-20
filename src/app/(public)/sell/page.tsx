import ValuationForm from "@/components/valuation-form";
import Footer from "@/components/global/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Free Home Valuation - What's Your Home Worth? | GULFSHORE GROUP",
	description:
		"Get a professional, comprehensive market analysis and valuation of your home in Southwest Florida. Find out what your Naples or Bonita Springs property is worth today.",
	keywords:
		"home valuation, property value, what is my home worth, real estate estimate, sell home Naples Florida, Florida real estate office",
};

export default function SellPage() {
	return (
		<div className="min-h-screen bg-linear-to-b from-gray-50/50 via-white to-gray-50/30 pt-28 pb-16 flex flex-col justify-between">
			<div className="container mx-auto px-4 max-w-5xl flex-1">
				{/* Page Heading */}
				<div className="text-center mb-12 space-y-4">
					<span className="text-primary font-semibold tracking-wider uppercase text-sm">
						Sell Your Property
					</span>
					<h1 className="text-4xl md:text-5xl font-bold font-serif text-gray-900 tracking-tight">
						What is Your Home Worth?
					</h1>
					<p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
						Get an accurate valuation estimate of your property using active MLS data, comparable market listings, and structural details of your home.
					</p>
				</div>

				{/* Valuation Multi-step Form */}
				<div className="w-full">
					<ValuationForm />
				</div>
			</div>
			<div className="mt-16 w-full">
				<Footer />
			</div>
		</div>
	);
}
