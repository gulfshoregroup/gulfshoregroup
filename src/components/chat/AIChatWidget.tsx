"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import dynamic from "next/dynamic";

const AIChatDialog = dynamic(() => import("./AIChatDialog"), {
	ssr: false,
	loading: () => null,
});

export default function AIChatWidget() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="fixed bottom-20 right-4 z-50 md:bottom-24 md:right-6 flex flex-col items-end">
			{/* Chat Button */}
			{!isOpen && (
				<button
					type="button"
					onClick={(e) => {
						e.preventDefault();
						setIsOpen(true);
					}}
					className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all transform hover:scale-105 flex items-center gap-2 cursor-pointer"
					aria-label="Open AI Concierge"
				>
					<MessageSquare className="w-6 h-6" />
					<span className="font-semibold hidden sm:inline">Ask AI Concierge</span>
				</button>
			)}

			{/* Chat Window loaded on demand */}
			{isOpen && <AIChatDialog onClose={() => setIsOpen(false)} />}
		</div>
	);
}
