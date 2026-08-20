import Header from "@/components/property-management/header";
import HeroSection from "@/components/property-management/hero-section";
import ServicesSection from "@/components/property-management/services-section";
import AboutSection from "@/components/property-management/about-section";
import ContactSection from "@/components/property-management/contact-section";
import Footer from "@/components/property-management/footer";

export default function Home() {
	return (
		<main className="min-h-screen bg-background text-foreground">
			<Header />
			<HeroSection />
			<ServicesSection />
			<AboutSection />
			<ContactSection />
			<Footer />
		</main>
	);
}
