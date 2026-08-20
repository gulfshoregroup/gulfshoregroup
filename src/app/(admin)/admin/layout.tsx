import React from "react";
import "./globals.css";
import VerifyAdmin from "@/hooks/auth";
import { LayoutContent } from "@/components/layout-content";
import { Toaster } from "@/components/ui/sonner";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Enforce authentication & role checks on the server
	await VerifyAdmin();

	return (
		<>
			<LayoutContent>
				{children}
			</LayoutContent>
			<Toaster
				{...{
					position: "bottom-right",
					theme: "light",
				}}
			/>
		</>
	);
}
