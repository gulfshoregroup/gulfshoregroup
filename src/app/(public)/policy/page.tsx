"use client";
import AboutSection from "@/components/about-section";
import Footer from "@/components/global/footer";
import React from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const PrivacyPage = () => {
	const router = useRouter();
	return (
		<>
			{" "}
			<div className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-sm font-semibold text-[#d90429] hover:underline mb-6 cursor-pointer focus:outline-hidden"
				>
					<ArrowLeft size={16} />
					<span>Go Back</span>
				</button>
				<h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

				<p className="mb-4">Effective Date: July 29, 2025</p>
				<p className="mb-4">
					Website: https://www.gulfshoregroup.com
				</p>
				<p className="mb-8">Entity: Gulfshore Group</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					1. Introduction
				</h2>
				<p className="mb-4">
					This policy explains how we collect, use, and protect your
					personal data when you use our website.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					2. Information We Collect
				</h2>
				<p className="mb-2">
					a. Personal Info: name, email, phone, preferences
				</p>
				<p className="mb-4">
					b. Device Data: IP, browser, pages visited
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					3. Use of Information
				</h2>
				<p className="mb-4">
					We use your data to provide services, contact you, and
					improve user experience.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">4. Consent</h2>
				<p className="mb-4">
					By using our site, you consent to this policy and agree to
					receive communication via email, SMS, or WhatsApp.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">5. Cookies</h2>
				<p className="mb-4">
					We use cookies to analyze traffic and improve site
					performance. You can disable cookies in browser settings.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					6. Data Sharing
				</h2>
				<p className="mb-4">
					We only share data with trusted service providers and never
					sell your personal info.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">7. Security</h2>
				<p className="mb-4">
					We implement industry-standard measures to protect your
					data.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					8. Your Rights
				</h2>
				<p className="mb-4">
					You can request, update, or delete your data by contacting
					us at support@gulfshoregroup.com.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">
					9. Children’s Privacy
				</h2>
				<p className="mb-4">
					We do not knowingly collect data from users under 18 years
					old.
				</p>

				<h2 className="text-lg font-bold mt-8 mb-2">10. Changes</h2>
				<p className="mb-4">
					We may update this policy and notify users via email or
					on-site banners.
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

export default PrivacyPage;
