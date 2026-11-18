"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

const FloodZoneLookup = dynamic(() => import("./FloodZoneLookup"), {
	ssr: false,
	loading: () => <div className="h-[250px] w-full rounded-xl bg-gray-100 animate-pulse" />,
});

/**
 * Loads the FEMA flood-zone tool's JavaScript only when it is about to scroll
 * into view, so it doesn't add to the homepage's initial blocking time.
 * The fixed-height placeholder keeps the layout from shifting.
 */
export default function LazyFloodZoneLookup() {
	const ref = useRef<HTMLDivElement>(null);
	const [show, setShow] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el || show) return;
		if (!("IntersectionObserver" in window)) {
			setShow(true);
			return;
		}
		const io = new IntersectionObserver(
			(entries) => {
				if (entries.some((e) => e.isIntersecting)) {
					setShow(true);
					io.disconnect();
				}
			},
			{ rootMargin: "300px" }
		);
		io.observe(el);
		return () => io.disconnect();
	}, [show]);

	return (
		<div ref={ref} className="min-h-[250px]">
			{show ? <FloodZoneLookup /> : <div className="h-[250px] w-full rounded-xl bg-gray-100" />}
		</div>
	);
}
