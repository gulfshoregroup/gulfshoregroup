"use client";

import { Suspense } from "react";
import Navbar from "@/components/global/nav";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";

export default function PublicLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const showNavbar = pathname !== "/signup" && pathname !== "/signin";

	return (
		<>
			{showNavbar && (
				<Suspense fallback={<div className="h-16 bg-white border-b" />}>
					<Navbar />
				</Suspense>
			)}
			{children}

			<Suspense>
				<Toaster richColors position="bottom-center" />
			</Suspense>
		</>
	);
}
