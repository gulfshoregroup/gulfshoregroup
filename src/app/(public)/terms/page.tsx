"use client";
import AboutSection from "@/components/about-section";
import Footer from "@/components/global/footer";
import Link from "next/link";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const TermsPage = () => {
	const router = useRouter();
	return (
		<>
			<div className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-sm font-semibold text-[#d90429] hover:underline mb-6 cursor-pointer focus:outline-hidden"
				>
					<ArrowLeft size={16} />
					<span>Go Back</span>
				</button>
				<h1 className="text-3xl font-bold mb-6">
					Terms and Conditions
				</h1>

				<p className="mb-4">Effective Date: July 29, 2025</p>
				<p className="mb-4">
					Website:{" "}
					<Link href={"https://www.gulfshoregroup.com"}>
						https://www.gulfshoregroup.com
					</Link>
				</p>
				<p className="mb-8">Entity: Gulfshore Group</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					1. Acceptance of Terms
				</h2>
				<p className="mb-4">
					By accessing or using gulfshoregroup.com, you agree to be
					bound by these Terms and Conditions and our Privacy Policy.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					2. Description of Service
				</h2>
				<p className="mb-4">
					Gulfshore Group provides real estate listings and tools for
					property discovery and tour scheduling in Southwest Florida.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					3. Eligibility
				</h2>
				<p className="mb-4">
					Users must be at least 18 years old to access our services.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					4. User Accounts
				</h2>
				<p className="mb-4">
					You are responsible for your account credentials. Keep them
					secure and accurate.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					5. Communication & Notifications
				</h2>
				<p className="mb-4">
					By using our site, you consent to receive notifications via
					email, SMS, and WhatsApp about listings, tours, and
					promotions. You can opt out anytime.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					6. Listings & Content Accuracy
				</h2>
				<p className="mb-4">
					We do not guarantee listing accuracy and may update or
					remove content without notice.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					7. Intellectual Property
				</h2>
				<p className="mb-4">
					All content is the property of Gulfshore Group. Do not copy
					or redistribute without permission.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					8. Prohibited Use
				</h2>
				<p className="mb-4">
					No illegal use, false submissions, or data scraping allowed.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					9. Limitation of Liability
				</h2>
				<p className="mb-4">
					We are not liable for service interruptions or outcomes of
					property transactions.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					10. Governing Law
				</h2>
				<p className="mb-4">
					This agreement is governed by the laws of Florida, United
					States.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">11. Contact</h2>
				<p className="mb-4">
					mailbox@gulfshoregroup.com | +1 (239) 992-9119
				</p>
			</div>
			<div className="px-4">
				<AboutSection />
			</div>
			<Footer />
		</>
	);
};

export default TermsPage;
