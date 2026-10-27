"use client";

import * as React from "react";
import { type Icon } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

export function NavSecondary({
	items,
	pendingHref,
	onNavigate,
	...props
}: {
	items: {
		title: string;
		url: string;
		icon: Icon;
	}[];
	pendingHref?: string | null;
	onNavigate?: (url: string) => void;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	const path = usePathname();
	const { isMobile, setOpenMobile } = useSidebar();

	const isActive = (url: string) => {
		if (pendingHref) {
			return pendingHref === url;
		}
		if (path === url) return true;
		if (path.startsWith(url + "/")) return true;
		return false;
	};

	return (
		<SidebarGroup {...props}>
			<SidebarGroupContent>
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.title}>
							<SidebarMenuButton isActive={isActive(item.url)} asChild>
								<Link
									href={item.url}
									prefetch={true}
									onClick={() => {
										if (path !== item.url) {
											onNavigate?.(item.url);
										}
										if (isMobile) {
											setOpenMobile(false);
										}
									}}>
									<item.icon className="size-5 shrink-0" />
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
