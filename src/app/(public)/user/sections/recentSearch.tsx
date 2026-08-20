"use client";
import PropertySection from "@/components/property/propertysection/propertySlider";
import capitalizeWords from "@/hooks/capitalize-letter";

function RecentSearch({ data }: { data: any[] }) {
	if (!data.length) return null;

	return (
		<div className="flex flex-col">
			{data.map((item, i) => (
				<div>
					<PropertySection
						props={
							<h2 className="py-4 px-2 font-semibold mt-10 lg:mt-12 text-lg lg:text-xl">
								Continue Your Search in{" "}
								<span className="text-primary">
									{capitalizeWords(
										item.searchQuery.developmentName || ""
									)}{" "}
									{capitalizeWords(item.searchQuery.city || "")}{" "}
									Florida
								</span>
							</h2>
						}
						queryParams={{
							...item.searchQuery,
						}}
					/>
				</div>
			))}
		</div>
	);
}

export default RecentSearch;
