"use client";

import { Star } from "lucide-react";
import ReadMore from "../property/readmore";

interface Review {
	name: string;
	text: string;
}

export default function ReviewCard({ review }: { review: Review }) {
	return (
		<div className="h-full flex flex-col p-4 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
			<div className="grid grid-cols-2 w-full justify-between">
				<p className="text-foreground font-semibold text-sm">
					{review.name}
				</p>
				<div className="flex justify-end gap-1 mb-4">
					<Star className="w-4 h-4 fill-amber-600 text-amber-600" />
					<Star className="w-4 h-4 fill-amber-600 text-amber-600" />
					<Star className="w-4 h-4 fill-amber-600 text-amber-600" />
					<Star className="w-4 h-4 fill-amber-600 text-amber-600" />
					<Star className="w-4 h-4 fill-amber-600 text-amber-600" />
				</div>
			</div>

			{/* Review text */}
			<p className="text-xs text-gray-500 leading-relaxed mb-4 grow">
				{review.text}
			</p>
		</div>
	);
}
