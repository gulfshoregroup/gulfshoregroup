import AboutSection from "@/components/about-section";
import ContactUs from "@/components/contact-section";
import Footer from "@/components/global/footer";
import ClientReviews from "@/components/home/reviews-section";
import WhyChooseUs from "@/components/home/whyus-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title:
		"About Us - Naples Florida Real Estate Office - GULFSHORE GROUP",

	description:
		"Gulfshore Group - We are dedicated to deliver exceptional service and unparalleled expertise in Southwest Florida’s dynamic property market. From luxurious beachfront homes to exclusive waterfront estates, we bring you the finest coastal living experiences.",
	keywords:
		"SWFlorida Real-estate, Homes For Sale in Naples Florida, Homes For Sale in Southwest florida, Southwest florida Realestate, homes in southwest florida, florida real-estate, real-estate",
};

export default function AboutPage() {
	return (
		<div>
			<div className="mt-16 container mx-auto px-4">
				<h1 className="lg:text-2xl text-lg font-medium text-start">
					About Gulfshore Group
				</h1>
				<AboutSection />
			</div>
			<WhyChooseUs />
			<ClientReviews />
			<Footer />
		</div>
	);
}
