"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const ForcedLoginModal = dynamic(() => import("./ForcedLoginModal"), {
	ssr: false,
});

const MissingPhoneModal = dynamic(() => import("./MissingPhoneModal"), {
	ssr: false,
});

export default function AuthModals() {
	const pathname = usePathname();
	const { isSignedIn, isLoaded } = useUser();

	// Only load ForcedLoginModal on property detail pages
	const isDetailPage = pathname ? pathname.includes("/Florida-Real-Estate-Listings/") : false;

	return (
		<>
			{isDetailPage && <ForcedLoginModal />}
			{isLoaded && isSignedIn && <MissingPhoneModal />}
		</>
	);
}

