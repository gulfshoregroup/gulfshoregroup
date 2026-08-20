"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";

export function LayoutContent({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();

	if (pathname === "/sign-in") {
		return <>{children}</>;
	}

	return (
		<SidebarProvider
			style={
				{
					"--sidebar-width": "calc(var(--spacing) * 64)",
					"--header-height": "calc(var(--spacing) * 12)",
				} as React.CSSProperties
			}>
			<AppSidebar variant="inset" />
			<SidebarInset>
				<SiteHeader />
				<div className="flex flex-1 flex-col">
					<div className="@container/main flex flex-1 flex-col gap-2 px-4 py-2">
						{children}
					</div>
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
