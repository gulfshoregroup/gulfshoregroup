import ContactUs from "@/components/contact-section";
import Footer from "@/components/global/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title:
		"Contact Us - Naples Florida Real Estate Office - GULFSHORE GROUP",

	description:
		"Gulfshore Group Real Estate Office Contact Us Now to know more about Naples Florida Real Estate Properties and Surrounding Area. Buy Condos, Homes and Vacant Land.",
	keywords:
		"SWFlorida Real-estate, Homes For Sale in Naples Florida, Homes For Sale in Southwest florida, Southwest florida Realestate, homes in southwest florida, florida real-estate, real-estate",
};

export default function ContactPage() {
	return (
		<div className="h-screen pt-14">
			<ContactUs />
			<Footer />
		</div>
	);
}
