"use client";

import { Suspense } from "react";
import AiChatUI from "./AiChatUI";

export default function AIChatsPage() {
	return (
		<div className="p-4 md:p-6 w-full max-w-7xl mx-auto">
			<Suspense fallback={<div className="p-6 text-muted-foreground animate-pulse">Loading chats...</div>}>
				<AiChatUI />
			</Suspense>
		</div>
	);
}
