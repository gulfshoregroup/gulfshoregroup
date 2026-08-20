"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const allPages = [
	{ title: "Dashboard", href: "/admin/dashboard", category: "Main", description: "Overview of stats and KPIs" },
	{ title: "Leads", href: "/admin/leads", category: "CRM", description: "Manage potential buyers and sellers" },
	{ title: "Contact Requests", href: "/admin/contact-requests", category: "CRM", description: "View inbound contact form submissions" },
	{ title: "Users List", href: "/admin/users", category: "Users", description: "All registered users" },
	{ title: "Wishlist", href: "/admin/wishlist", category: "Users", description: "Properties saved by users" },
	{ title: "Tours", href: "/admin/tours", category: "Users", description: "Scheduled property tour requests" },
	{ title: "Properties List", href: "/admin/properties", category: "Properties", description: "All active and inactive listings" },
	{ title: "Cities", href: "/admin/properties/cities", category: "Properties", description: "Manage city pages and images" },
	{ title: "Communities", href: "/admin/properties/communities", category: "Properties", description: "Manage community and development pages" },
	{ title: "Blogs", href: "/admin/blogs", category: "Content", description: "Create and manage blog articles" },
	{ title: "Notifications", href: "/admin/notifications", category: "Automation", description: "Schedule and send push notifications" },
	{ title: "Automation Status", href: "/admin/automation", category: "Automation", description: "Monitor background automation processes" },
	{ title: "Property Performance", href: "/admin/performance", category: "Reports", description: "Analytics and property engagement stats" },
	{ title: "Settings", href: "/admin/settings", category: "Admin", description: "Manage admin preferences and security" },
	{ title: "Help & Support", href: "/admin/help", category: "Admin", description: "FAQs and support contacts" },
];

const categoryColors: Record<string, string> = {
	Main: "bg-green-100 text-green-800",
	CRM: "bg-blue-100 text-blue-800",
	Users: "bg-purple-100 text-purple-800",
	Properties: "bg-orange-100 text-orange-800",
	Content: "bg-pink-100 text-pink-800",
	Automation: "bg-yellow-100 text-yellow-800",
	Reports: "bg-teal-100 text-teal-800",
	Admin: "bg-gray-100 text-gray-800",
};

export default function SearchPage() {
	const [query, setQuery] = useState("");

	const results = query.trim()
		? allPages.filter(
				(p) =>
					p.title.toLowerCase().includes(query.toLowerCase()) ||
					p.description.toLowerCase().includes(query.toLowerCase()) ||
					p.category.toLowerCase().includes(query.toLowerCase())
		  )
		: allPages;

	return (
		<div className="space-y-6 px-4 my-5">
			<div className="flex items-center gap-3">
				<Search className="h-8 w-8 text-primary" />
				<div>
					<h1 className="text-3xl font-bold">Search</h1>
					<p className="text-muted-foreground">Find any page or section quickly</p>
				</div>
			</div>

			{/* Search bar */}
			<div className="relative max-w-xl">
				<Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
				<Input
					autoFocus
					placeholder="Search pages, sections, features..."
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					className="pl-10 h-12 text-base"
				/>
			</div>

			{/* Results */}
			<div className="space-y-2">
				<p className="text-sm text-muted-foreground">
					{query ? `${results.length} result${results.length !== 1 ? "s" : ""} for "${query}"` : `All ${allPages.length} pages`}
				</p>
				{results.length === 0 ? (
					<div className="text-center py-12 text-muted-foreground">
						No pages found for "{query}"
					</div>
				) : (
					<div className="grid gap-2">
						{results.map((page) => (
							<Link key={page.href} href={page.href}>
								<div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer group">
									<div>
										<p className="font-medium group-hover:text-primary transition-colors">
											{page.title}
										</p>
										<p className="text-sm text-muted-foreground">{page.description}</p>
									</div>
									<Badge className={categoryColors[page.category] || "bg-gray-100 text-gray-800"}>
										{page.category}
									</Badge>
								</div>
							</Link>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
