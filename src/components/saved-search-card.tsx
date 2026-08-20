import { useState } from "react";
import {
	ChevronRight,
	Bell,
	Trash2,
	Phone,
	Mail,
	Settings2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EditSearchModal from "@/components/edit-search-modal";
import capitalizeWords from "@/hooks/capitalize-letter";
import { formatPrice } from "@/hooks/formatPrice";

interface SavedSearchCardProps {
	search: {
		_id: string;
		name: string;
		filters: Record<string, any>;
		lastUpdated: string;
		matchCount: number;
		icon: string;
		link: string;
	};
	onUpdate?: (search: any) => void;
	onDelete?: (id: string) => void;
}

export default function SavedSearchCard({
	search,
	onUpdate,
	onDelete,
}: SavedSearchCardProps) {
	const [isModalOpen, setIsModalOpen] = useState(false);

	const handleEditClick = () => {
		setIsModalOpen(true);
	};

	const handleUpdate = (updatedSearch: any) => {
		onUpdate?.(updatedSearch);
	};

	return (
		<>
			<Card className="p-5 hover:shadow-lg transition-shadow group flex flex-col justify-between h-full">
				<div className="space-y-4">
					<div className="flex items-start justify-between">
						<a
							href={search.link}
							target="_blank"
							rel="noopener noreferrer"
							className="font-semibold text-foreground group-hover:text-blue-600 transition-colors pr-2 hover:underline">
							{capitalizeWords(search.name.replaceAll("-", " "))}
						</a>
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-blue-600"
								onClick={(e) => {
									e.stopPropagation();
									handleEditClick();
								}}>
								<Settings2 className="w-4 h-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-muted-foreground hover:text-destructive"
								onClick={(e) => {
									e.stopPropagation();
									onDelete?.(search._id);
								}}>
								<Trash2 className="w-4 h-4" />
							</Button>
						</div>
					</div>

					<div
						onClick={handleEditClick}
						className="text-sm cursor-pointer space-y-1.5 flex flex-wrap gap-1.5 min-h-[40px] items-center">
						{search.filters?.city && (
							<span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-medium border border-blue-100">
								City: {capitalizeWords(search.filters.city.replaceAll("-", " "))}
							</span>
						)}
						{search.filters?.developmentName && (
							<span className="bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-md font-medium border border-purple-100">
								Dev: {capitalizeWords(search.filters.developmentName.replaceAll("-", " "))}
							</span>
						)}
						{search.filters?.postalCode && (
							<span className="bg-orange-50 text-orange-700 text-xs px-2.5 py-1 rounded-md font-medium border border-orange-100">
								Zip: {search.filters.postalCode}
							</span>
						)}
						{(search.filters?.minPrice || search.filters?.maxPrice) && (
							<span className="bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-md font-medium border border-green-100">
								Price: {search.filters.minPrice ? formatPrice(Number(search.filters.minPrice)) : "$0"} - {search.filters.maxPrice ? formatPrice(Number(search.filters.maxPrice)) : "Any"}
							</span>
						)}
						{search.filters?.beds && (
							<span className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-md font-medium border border-teal-100">
								{search.filters.beds}+ Beds
							</span>
						)}
						{search.filters?.baths && (
							<span className="bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-md font-medium border border-teal-100">
								{search.filters.baths}+ Baths
							</span>
						)}
						{search.filters?.propertyTypes && search.filters.propertyTypes.length > 0 && (
							<span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-md font-medium border border-indigo-100">
								Types: {search.filters.propertyTypes.map((t: string) => t === "Residential-Lots" ? "Lots" : t).join(", ")}
							</span>
						)}
						{search.filters?.features && search.filters.features.length > 0 && (
							<span className="bg-pink-50 text-pink-700 text-xs px-2.5 py-1 rounded-md font-medium border border-pink-100">
								Features: {search.filters.features.map((f: string) => capitalizeWords(f)).join(", ")}
							</span>
						)}
						{search.filters?.hoa && search.filters.hoa !== "Any" && (
							<span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-md font-medium border border-amber-100">
								HOA: {search.filters.hoa}
							</span>
						)}
						{search.filters?.status && search.filters.status !== "Active" && (
							<span className="bg-slate-50 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium border border-slate-100">
								Status: {search.filters.status}
							</span>
						)}
						{!search.filters?.city &&
							!search.filters?.developmentName &&
							!search.filters?.postalCode &&
							!search.filters?.minPrice &&
							!search.filters?.maxPrice &&
							!search.filters?.beds &&
							!search.filters?.baths &&
							(!search.filters?.propertyTypes || search.filters.propertyTypes.length === 0) &&
							(!search.filters?.features || search.filters.features.length === 0) &&
							(!search.filters?.hoa || search.filters.hoa === "Any") &&
							(!search.filters?.status || search.filters.status === "Active") && (
								<span className="text-xs text-muted-foreground italic">
									All Properties (No filters active)
								</span>
							)}
					</div>

					<div className="pt-3 border-t border-border flex justify-between items-center">
						<div className="flex text-sm flex-col font-medium gap-0.5">
							<span>Dimitri Schwarz</span>
							<span>+1 239-992-9119</span>
							<span>mailbox@gulfshoregroup.com</span>
						</div>

						<div className="flex flex-row gap-2">
							<a
								href="tel:+1 239-992-9119"
								className="hover:underline bg-primary cursor-pointer text-white p-2 rounded-full font-medium">
								<Phone size={18} />
							</a>

							<a
								href="mailto:mailbox@gulfshoregroup.com"
								className="hover:underline cursor-pointer rounded-full bg-primary text-white p-2 font-medium">
								<Mail size={18} />
							</a>
						</div>
					</div>
				</div>
			</Card>

			<EditSearchModal
				search={search}
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onUpdate={handleUpdate}
			/>
		</>
	);
}
