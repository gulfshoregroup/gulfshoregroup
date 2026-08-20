"use client";
import dynamic from "next/dynamic";
import React, { Suspense } from "react";
const CommunitiesSection = dynamic(() => import("./expandGrid"), {
	ssr: false,
	loading: () => <div></div>,
});

export default function LazyCommunitySection({
	city,
}: {
	city: string;
}) {
	return (
		<Suspense>
			<CommunitiesSection city={city} />
		</Suspense>
	);
}
