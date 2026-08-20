"use client";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import axios from "axios";
import { Users, Building, Zap, Heart, MapPin, Home, Phone, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip,
	Legend
} from "recharts";

interface DashBoardStats {
	TotalSocialLogs: number;
	TotalUsers: number;
	TotalWishlistedProperties: number;
	TotalPropertyViews: number;
	TotalProperties: number;
	TotalContacts: number;
	TotalCities: number;
	TotalCommunities: number;
	TotalTours: number;
	LastSocialMediaUploadTime: string;
	chartData?: Array<{ date: string; Leads: number; Inquiries: number }>;
	hotLeads?: any[];
}

export default function DashboardPage() {
	const [data, setData] = useState<DashBoardStats | null>(null);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await axios.get("/api/admin/dashboard");
				setData(res.data.data);
			} catch (error) {
				console.error("Error fetching dashboard data:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-lg text-muted-foreground animate-pulse">Loading dashboard...</p>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex items-center justify-center h-screen">
				<p className="text-lg text-red-500">Failed to load dashboard data.</p>
			</div>
		);
	}

	const statCards = [
		{
			label: "Total Users",
			value: data.TotalUsers,
			icon: <Users className="h-5 w-5 text-emerald-600" />,
			color: "text-emerald-600",
			onClick: () => router.push("/admin/users"),
		},
		{
			label: "Properties",
			value: data.TotalProperties,
			icon: <Home className="h-5 w-5 text-pink-700" />,
			color: "text-pink-700",
			onClick: () => router.push("/admin/properties"),
		},
		{
			label: "Contact Requests",
			value: data.TotalContacts,
			icon: <Phone className="h-5 w-5 text-blue-600" />,
			color: "text-blue-600",
			onClick: () => router.push("/admin/contact-requests"),
		},
		{
			label: "Cities",
			value: data.TotalCities,
			icon: <MapPin className="h-5 w-5 text-green-700" />,
			color: "text-green-700",
			onClick: undefined,
		},
		{
			label: "Communities",
			value: data.TotalCommunities,
			icon: <Building className="h-5 w-5 text-blue-900" />,
			color: "text-blue-900",
			onClick: undefined,
		},
		{
			label: "Tour Requests",
			value: data.TotalTours,
			icon: <Calendar className="h-5 w-5 text-rose-700" />,
			color: "text-rose-700",
			onClick: undefined,
		},
		{
			label: "Saved Properties",
			value: data.TotalWishlistedProperties,
			icon: <Heart className="h-5 w-5 text-red-500" />,
			color: "text-red-500",
			onClick: () => router.push("/admin/wishlist"),
		},
		{
			label: "Property Views",
			value: data.TotalPropertyViews,
			icon: <Building className="h-5 w-5 text-indigo-600" />,
			color: "text-indigo-600",
			onClick: undefined,
		},
	];

	return (
		<div className="space-y-6 p-2">
			<div>
				<h1 className="text-3xl font-bold">Dashboard</h1>
				<p className="text-muted-foreground mt-1">Overview of your Gulfshore Group platform</p>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
				{statCards.map((card) => (
					<Card
						key={card.label}
						onClick={card.onClick}
						className={card.onClick ? "cursor-pointer hover:shadow-md transition-shadow hover:border-primary/40" : ""}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">
								{card.label}
							</CardTitle>
							{card.icon}
						</CardHeader>
						<CardContent>
							<div className={`text-3xl font-bold ${card.color}`}>
								{card.value?.toLocaleString() ?? "—"}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Trends Chart & Hot Leads */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
				{data.chartData && data.chartData.length > 0 && (
					<Card className="shadow-sm border border-border/80 lg:col-span-2">
						<CardHeader className="pb-2">
							<CardTitle className="text-lg font-bold">7-Day Platform Activity Trends</CardTitle>
							<p className="text-xs text-muted-foreground">Compare new user registrations (Leads) against property inquiries & valuations (Inquiries)</p>
						</CardHeader>
						<CardContent className="h-[320px] w-full pt-4">
							<ResponsiveContainer width="100%" height="100%">
								<LineChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
									<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
									<XAxis dataKey="date" tickLine={false} className="text-xs font-semibold text-muted-foreground" />
									<YAxis tickLine={false} className="text-xs font-semibold text-muted-foreground" allowDecimals={false} />
									<Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
									<Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
									<Line type="monotone" dataKey="Leads" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} name="New Signups / Leads" />
									<Line type="monotone" dataKey="Inquiries" stroke="#d90429" strokeWidth={3} activeDot={{ r: 6 }} name="Valuations & Requests" />
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				)}

				<Card className="shadow-sm border border-border/80 lg:col-span-1">
					<CardHeader className="pb-2">
						<CardTitle className="text-lg font-bold flex items-center gap-2"><Zap className="w-5 h-5 text-orange-500" fill="currentColor" /> Hot Lead Alerts</CardTitle>
						<p className="text-xs text-muted-foreground">Leads that are highly engaged or ready to buy.</p>
					</CardHeader>
					<CardContent className="pt-4 space-y-4">
						{data.hotLeads && data.hotLeads.length > 0 ? (
							data.hotLeads.map((lead: any) => (
								<div key={lead.id} className="p-3 border border-orange-200 bg-orange-50/50 rounded-lg cursor-pointer hover:bg-orange-50 transition-colors" onClick={() => router.push(`/admin/leads/${lead.id}`)}>
									<div className="flex justify-between items-start">
										<div>
											<h4 className="font-semibold text-sm text-gray-900">{lead.fullName || lead.email.split('@')[0]}</h4>
											<p className="text-xs text-muted-foreground">{lead.phone || lead.email}</p>
										</div>
										<span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
											{lead.scoreLabel}
										</span>
									</div>
									<div className="mt-2 text-xs text-orange-800 flex items-center justify-between">
										<span>Score: {lead.score}/100</span>
										<span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
									</div>
								</div>
							))
						) : (
							<div className="text-center py-8">
								<p className="text-sm text-muted-foreground">No hot leads right now.</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
