import SavedSearchesSection from "@/components/saved-searches-section";
import Footer from "@/components/global/footer";

export default function ProfilePage() {
	return (
		<div>
			<div className="min-h-screen bg-background">
				<div className="container mx-auto px-4 py-12 space-y-12">
					<SavedSearchesSection />
				</div>
			</div>
			<Footer />
		</div>
	);
}
