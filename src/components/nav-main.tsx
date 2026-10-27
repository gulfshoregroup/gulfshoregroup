"use client";

import { type Icon } from "@tabler/icons-react";
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

export function NavMain({
	items,
	pendingHref,
	onNavigate,
}: {
	items: {
		title: string;
		url: string;
		icon?: Icon;
	}[];
	pendingHref?: string | null;
	onNavigate?: (url: string) => void;
}) {
	const path = usePathname();
	const searchParams = useSearchParams();
	const { isMobile, setOpenMobile } = useSidebar();

	const currentFullUrl = searchParams.toString()
		? `${path}?${searchParams.toString()}`
		: path;

	const isActive = (url: string) => {
		if (pendingHref) {
			return pendingHref === url;
		}
		if (url.includes("?")) {
			const [urlPath, urlQuery] = url.split("?");
			if (path !== urlPath) return false;
			const params = new URLSearchParams(urlQuery);
			for (const [key, val] of params.entries()) {
				if (searchParams.get(key) !== val) return false;
			}
			return true;
		}
		if (path === url) return true;
		if (url === "/admin/leads" && path.startsWith("/admin/leads/")) return true;
		if (url === "/admin/contact-requests" && path.startsWith("/admin/contact-requests/")) return true;
		return false;
	};

	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton
								isActive={isActive(item.url)}
								tooltip={item.title}
								asChild>
								<Link
									href={item.url}
									prefetch={true}
									onClick={() => {
										if (currentFullUrl !== item.url) {
											onNavigate?.(item.url);
										}
										if (isMobile) {
											setOpenMobile(false);
										}
									}}>
									{item.icon && <item.icon className="size-5 shrink-0" />}
									<span className="truncate">{item.title}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
