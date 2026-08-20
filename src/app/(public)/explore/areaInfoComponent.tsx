import ReadMore from "@/components/property/readmore";
import GetSeoData from "@/hooks/getSeoData";
import Image from "next/image";
import GolfCourseCard from "@/components/community/GolfCourseCard";

export default async function AreaInfoComponent({
	city,
	community,
}: {
	city: string;
	community?: string;
}) {
	const seoData = await GetSeoData({
		params: {
			city,
			developmentName: community || null,
			beds: "",
			baths: "",
			minPrice: "",
			maxPrice: "",
			builtYearMin: "",
			builtYearMax: "",
			sort: "",
			order: "",
			propertyTypes: [],
			postalCode: "",
			page: "",
			features: [],
		},
	});

	return (
		<div>
			<section>
				<div className="bg-white rounded-3xl shadow-sm border border-gray-100 py-16 px-6 lg:px-12 mt-4 mb-12 max-w-[1600px] mx-auto w-11/12">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
						{/* Left Image (Sticky) */}
						<div className="lg:sticky lg:top-32 relative group">
							{seoData?.content?.defaultImage ? (
								<div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
									<img 
										src={seoData.content.defaultImage} 
										alt={`${seoData?.community || community || city} entrance`}
										className="w-full h-auto object-cover aspect-[4/3] transition-transform duration-700 group-hover:scale-105"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
									<div className="absolute bottom-6 left-6 text-white font-serif text-2xl drop-shadow-md">
										{seoData?.community || community || city} FL
									</div>
								</div>
							) : (
								<div className="w-full aspect-[4/3] bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
									<span className="text-lg">No Image Available</span>
								</div>
							)}
						</div>

						{/* Right Content */}
						<div className="prose prose-lg max-w-none text-gray-700">
							<h2 className="text-4xl font-serif text-primary mb-8 border-b border-gray-200 pb-4">
								About {seoData?.community || community || city}
							</h2>
							{seoData?.content?.infoText && seoData.content.infoText.trim().length > 0 ? (
								<div 
									className="text-gray-500 leading-relaxed space-y-4"
									dangerouslySetInnerHTML={{ __html: seoData.content.infoText }} 
								/>
							) : (
								<ReadMore className="text-gray-500 leading-relaxed">
									{`${city}, Florida: Your Gateway to Paradise Living\n\nNestled along Florida's pristine Gulf Coast, ${city} represents the epitome of luxury living, combining world-class amenities with natural beauty that captivates residents and visitors alike. This enchanting city has evolved from a small fishing village into one of America's most desirable destinations for those seeking an exceptional quality of life.`}
								</ReadMore>
							)}
						</div>
					</div>

					{/* Golf Courses Section */}
					{seoData?.content?.golfCourses && seoData.content.golfCourses.length > 0 && (
						<div className="mt-16 pt-12 border-t border-gray-100">
							<h2 className="text-3xl font-serif text-primary mb-8">
								Golf Courses at {seoData?.community || community || city}
							</h2>
							<div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
								{seoData.content.golfCourses.map((course: any, idx: number) => (
									<GolfCourseCard key={idx} course={course} />
								))}
							</div>
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
