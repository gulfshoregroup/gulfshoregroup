"use client";
import React, { Suspense } from "react";
import dynamic from "next/dynamic";

const OneSignalSetup = dynamic(() => import("./pushNotification"), {
	ssr: false,
	loading: () => <></>,
});

export default function LazyOneSignal() {
	return (
		<Suspense>
			<OneSignalSetup />
		</Suspense>
	);
}
