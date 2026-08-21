"use client";

import * as React from "react";
import {
	IconDashboard,
	IconHelp,
	IconSearch,
	IconSettings,
	IconUserCheck,
	IconArticle,
	IconRobot,
	IconMessage,
	IconMail,
} from "@tabler/icons-react";
import {
	ChevronDown,
	Building2,
	Bot,
	Users,
	BarChart3,
	MapPin,
	Edit,
	Building,
	Share2,
	Bell,
	Database,
	List,
	Heart,
	Calendar,
	TrendingUp,
	MousePointer,
	Facebook,
	UserPlus,
	Home,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import Link from "next/link";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";
import { usePathname, useSearchParams } from "next/navigation";

const navigationItems = [
	{
		id: "users",
		label: "Users",
		icon: Users,
		children: [
			{ label: "Users List", icon: List, href: "/admin/users" },
			{
				label: "Wishlist",
				icon: Heart,
				href: "/admin/wishlist",
			},
			{ label: "Tours (Buyers)", icon: Calendar, href: "/admin/tours" },
			{ label: "Home Valuations (Sellers)", icon: Home, href: "/admin/valuations" },
		],
	},

	{
		id: "properties",
		label: "Properties",
		icon: Building2,
		children: [
			{ label: "Properties List", icon: List, href: "/admin/properties" },
			{ label: "Cities", icon: MapPin, href: "/admin/properties/cities" },

			{
				label: "Communities",
				icon: Building,
				href: "/admin/properties/communities",
			},
			{
				label: "Market Reports",
				icon: BarChart3,
				href: "/admin/market-reports",
			}
		],
	},
	{
		id: "automation",
		label: "Automation",
		icon: Bot,
		children: [
			{
				label: "Social Media",
				icon: Share2,
				href: "/admin/automation?tab=social",
			},
			{
				label: "Notifications",
				icon: Bell,
				href: "/admin/notifications",
			},
			{
				label: "Communication Logs",
				icon: List,
				href: "/admin/communication-logs",
			},
			{
				label: "MLS",
				icon: Database,
				href: "/admin/automation?tab=mls",
			},
		],
	},

	{
		id: "reports",
		label: "Analytics & Reports",
		icon: BarChart3,
		children: [
			{
				label: "Property Performance",
				icon: TrendingUp,
				href: "/admin/performance?tab=properties",
			},
			{
				label: "Social Analytics",
				icon: Facebook,
				href: "/admin/performance?tab=social",
			},
		],
	},

];

const data = {
	user: {
		name: "Dimitri Schwarz",
		email: "",
		avatar: "",
	},
	navMain: [
		{
			title: "Dashboard",
			url: "/admin/dashboard",
			icon: IconDashboard,
		},
		{
			title: "Leads",
			url: "/admin/leads",
			icon: IconUserCheck,
		},
		{
			title: "AI Chatbot",
			url: "/admin/ai-chats?channel=website",
			icon: IconRobot,
		},
		{
			title: "AI SMS",
			url: "/admin/ai-chats?channel=sms",
			icon: IconMessage,
		},
		{
			title: "AI Emails",
			url: "/admin/ai-chats?channel=email",
			icon: IconMail,
		},
		{
			title: "Contact Requests",
			url: "/admin/contact-requests",
			icon: IconUserCheck,
		},
	],

	navSecondary: [
		{
			title: "Blogs",
			url: "/admin/blogs",
			icon: IconArticle,
		},
		{
			title: "Settings",
			url: "/admin/settings",
			icon: IconSettings,
		},
		{
			title: "FAQs",
			url: "/admin/faqs",
			icon: IconHelp,
		},
	],

};

const NavItems = () => {
	const path = usePathname();
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab");

	const isActive = (item: { label: string; href: string }) => {
		const cleanPath = path.split("?")[0];
		const cleanHref = item.href.split("?")[0];

		if (cleanHref === "/admin/properties") {
			return cleanPath === "/admin/properties";
		}

		// Strict matching for sub-tabs to prevent overlap
		if (item.href.startsWith("/admin/automation")) {
			if (item.label === "Social Media") return path === "/admin/automation" && tab === "social";
			if (item.label === "MLS") return path === "/admin/automation" && (tab === "mls" || !tab);
			return false;
		}

		if (item.href.startsWith("/admin/performance")) {
			if (item.label === "Social Media") return path === "/admin/performance" && tab === "social";
			if (item.label === "Property Performance") return path === "/admin/performance" && (tab === "properties" || !tab);
			return false;
		}

		// Prevent partial matches on different parent routes
		if (cleanPath === cleanHref) return true;
		if (cleanHref !== "/admin/properties" && cleanPath.startsWith(cleanHref + "/")) return true;

		return false;
	};

	return navigationItems.map((navitem, index) => (
		<Collapsible
			key={index}
			defaultOpen
			className="group/collapsible">
			<SidebarGroup>
				<SidebarGroupLabel asChild>
					<CollapsibleTrigger>
						{navitem.label}
						<ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
					</CollapsibleTrigger>
				</SidebarGroupLabel>
				<CollapsibleContent>
					<SidebarGroupContent>
						<SidebarMenu>
							{navitem.children?.map((item) => (
								<SidebarMenuItem key={item.label}>
									<SidebarMenuButton
										isActive={isActive(item)}
										asChild>
										<Link href={item.href}>
											<item.icon className="size-5 shrink-0" />
											<span className="truncate">{item.label}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</CollapsibleContent>
			</SidebarGroup>
		</Collapsible>
	));
};

export function AppSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const [siteName, setSiteName] = React.useState("Gulfshore Group");

	React.useEffect(() => {
		const loadSettings = () => {
			fetch("/api/admin/general-settings")
				.then((res) => res.json())
				.then((data) => {
					if (data.siteName) setSiteName(data.siteName);
				})
				.catch(() => {});
		};
		loadSettings();
		window.addEventListener("general-settings-updated", loadSettings);
		return () => window.removeEventListener("general-settings-updated", loadSettings);
	}, []);

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:!p-1.5">
							<a href="#">
								<Home className="!size-5" />
								<span className="text-base font-semibold">
									{siteName}
								</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavItems />
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	);
}
