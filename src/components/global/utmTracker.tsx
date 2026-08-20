"use client";

import { useSearchParams, usePathname } from "next/navigation";
import { useEffect, Suspense } from "react";

function TrackerContent() {
	const searchParams = useSearchParams();
	const pathname = usePathname();

	useEffect(() => {
		const source = searchParams.get("utm_source") || searchParams.get("ref");
		if (source) {
			// Prevent double-tracking same click in current session
			const sessionKey = `track_${source}_${pathname}`;
			if (sessionStorage.getItem(sessionKey)) return;

			sessionStorage.setItem(sessionKey, "1");

			fetch("/api/track/campaign", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					source: source,
					path: pathname,
				}),
			}).catch((err) => console.error("UTM tracking error:", err));
		}
	}, [searchParams, pathname]);

	return null;
}

export default function UtmTracker() {
	return (
		<Suspense fallback={null}>
			<TrackerContent />
		</Suspense>
	);
}
