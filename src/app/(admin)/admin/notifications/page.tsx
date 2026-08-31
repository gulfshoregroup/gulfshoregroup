"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Edit, Trash2, Loader } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const getStatusColor = (status: string) => {
	switch (status) {
		case "Sent":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
		case "Scheduled":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
		case "Draft":
			return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
	}
};

const getTypeColor = (type: string) => {
	switch (type) {
		case "new-updates":
			return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
		case "welcome":
			return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
		case "price-drop":
			return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
		case "reminders":
			return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
		case "new-user":
			return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
		default:
			return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
	}
};

const getTypeLabel = (type: string) => {
	const labels: { [key: string]: string } = {
		"new-updates": "New Updates",
		welcome: "Welcome",
		"price-drop": "Price Drop",
		reminders: "Reminders",
		"new-user": "New User",
	};
	return labels[type] || type;
};

const getChannelLabel = (channel: string) => {
	const labels: { [key: string]: string } = {
		email: "Email",
		whatsapp: "WhatsApp",
		text: "Text",
	};
	return labels[channel] || channel;
};

export default function NotificationsPage() {
	const [notifications, setNotifications] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [viewingNotification, setViewingNotification] = useState<any | null>(null);

	useEffect(() => {
		fetchNotifications();
	}, []);

	const fetchNotifications = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/notifications");
			if (!response.ok) throw new Error("Failed to fetch");
			const data = await response.json();
			setNotifications(data);
		} catch (error) {
			console.error("[v0] Error fetching notifications:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (
			!confirm("Are you sure you want to delete this notification?")
		)
			return;
		try {
			const response = await fetch(`/api/notifications/${id}`, {
				method: "DELETE",
			});
			if (response.ok) {
				setNotifications(notifications.filter((n) => n._id !== id));
			}
		} catch (error) {
			console.error("[v0] Error deleting notification:", error);
		}
	};

	const scheduledCount = notifications.filter(
		(n) => n.status === "Scheduled"
	).length;
	const sentCount = notifications.filter(
		(n) => n.status === "Sent"
	).length;
	const draftCount = notifications.filter(
		(n) => n.status === "Draft"
	).length;
	const totalRecipients = notifications.reduce(
		(sum, n) => sum + (n.recipients || 0),
		0
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Scheduled Notifications
					</h1>
					<p className="text-muted-foreground mt-2">
						Manage and monitor your scheduled notification campaigns
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Button
						variant="outline"
						className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-medium flex items-center gap-2"
						onClick={async () => {
							try {
								const res = await fetch("/api/v2/cron/run-drip");
								const data = await res.json();
								alert(data.message || "Instant test triggered successfully!");
								fetchNotifications();
							} catch {
								alert("Failed to trigger instant test");
							}
						}}
					>
						⚡ Run Instant Test Now
					</Button>
					<Link href="/admin/notifications/schedule">
						<Button className="flex items-center gap-2">
							<Plus className="h-4 w-4" />
							Schedule New
						</Button>
					</Link>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Scheduled
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">
							{scheduledCount}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Sent
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">
							{sentCount}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Draft
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">
							{draftCount}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">
							Total Recipients
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-foreground">
							{totalRecipients.toLocaleString()}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Notifications</CardTitle>
					<CardDescription>
						View and manage all scheduled notification campaigns
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<Loader className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : notifications.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								No notifications found. Create one to get started!
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Title</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Channel</TableHead>
									<TableHead>Segment</TableHead>
									<TableHead>Scheduled For</TableHead>
									<TableHead>Recipients</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">
										Actions
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{notifications.map((notification) => (
									<TableRow key={notification._id}>
										<TableCell className="font-medium">
											{notification.title}
										</TableCell>
										<TableCell>
											<Badge
												className={getTypeColor(notification.type)}>
												{getTypeLabel(notification.type)}
											</Badge>
										</TableCell>
										<TableCell>
											{getChannelLabel(notification.channel)}
										</TableCell>
										<TableCell className="capitalize">
											{notification.segment}
										</TableCell>
										<TableCell>
											{notification.isDrip
												? <span className="font-medium text-emerald-600">{notification.dripLabel}</span>
												: notification.scheduledFor
												? new Date(notification.scheduledFor).toLocaleString()
												: "Not scheduled"}
										</TableCell>
										<TableCell>
											{notification.recipients?.toLocaleString() || 0}
										</TableCell>
										<TableCell>
											<Badge
												className={getStatusColor(
													notification.status
												)}>
												{notification.status}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => setViewingNotification(notification)}
												>
													<Eye className="h-4 w-4" />
												</Button>
												<Link href={`/admin/notifications/schedule?id=${notification._id}`}>
													<Button variant="ghost" size="sm">
														<Edit className="h-4 w-4" />
													</Button>
												</Link>
												<Button
													variant="ghost"
													size="sm"
													className="text-destructive hover:text-destructive"
													onClick={() =>
														handleDelete(notification._id)
													}>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{viewingNotification && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
					<Card className="w-full max-w-lg bg-card shadow-lg border border-border flex flex-col max-h-[90vh]">
						<CardHeader className="flex-none flex flex-row items-start justify-between pb-4 border-b border-border">
							<div>
								<CardTitle className="text-xl font-bold">
									Notification Details
								</CardTitle>
								<CardDescription className="mt-1">
									Complete setup configurations
								</CardDescription>
							</div>
							<Badge className={getStatusColor(viewingNotification.status)}>
								{viewingNotification.status}
							</Badge>
						</CardHeader>
						<CardContent className="flex-1 overflow-y-auto space-y-4 pt-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-xs text-muted-foreground font-semibold">Title</p>
									<p className="text-sm font-medium text-foreground">{viewingNotification.title}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground font-semibold">Type</p>
									<Badge className={cn("mt-0.5", getTypeColor(viewingNotification.type))}>
										{getTypeLabel(viewingNotification.type)}
									</Badge>
								</div>
								<div>
									<p className="text-xs text-muted-foreground font-semibold">Channel</p>
									<p className="text-sm font-medium capitalize text-foreground">{viewingNotification.channel}</p>
								</div>
								<div>
									<p className="text-xs text-muted-foreground font-semibold">Target Segment</p>
									<p className="text-sm font-medium capitalize text-foreground">{viewingNotification.segment}</p>
								</div>
								<div className="col-span-2">
									<p className="text-xs text-muted-foreground font-semibold">Scheduled For</p>
									<p className="text-sm font-medium text-foreground">
										{viewingNotification.isDrip
											? viewingNotification.dripLabel
											: viewingNotification.scheduledFor
											? new Date(viewingNotification.scheduledFor).toLocaleString()
											: "Not Scheduled"}
									</p>
								</div>
							</div>
							
							<div className="border-t border-border pt-3">
								<p className="text-xs text-muted-foreground font-semibold mb-1">Message Template</p>
								<div className="bg-muted p-3 rounded-md text-sm text-foreground whitespace-pre-wrap border border-border">
									{viewingNotification.message || "(No message content)"}
								</div>
							</div>

							{viewingNotification.propertyCriteria && (
								<div className="border-t border-border pt-3">
									<p className="text-xs text-muted-foreground font-semibold mb-2">Property Filter Criteria</p>
									<div className="grid grid-cols-2 gap-2 bg-muted/50 p-3 rounded-md border border-border text-xs text-foreground">
										<div>
											<span className="font-semibold text-muted-foreground">Min Price: </span>
											<span>{viewingNotification.propertyCriteria.minPrice ? `$${Number(viewingNotification.propertyCriteria.minPrice).toLocaleString()}` : "Any"}</span>
										</div>
										<div>
											<span className="font-semibold text-muted-foreground">Max Price: </span>
											<span>{viewingNotification.propertyCriteria.maxPrice ? `$${Number(viewingNotification.propertyCriteria.maxPrice).toLocaleString()}` : "Any"}</span>
										</div>
										<div>
											<span className="font-semibold text-muted-foreground">Min Beds: </span>
											<span>{viewingNotification.propertyCriteria.beds || "Any"}</span>
										</div>
										<div>
											<span className="font-semibold text-muted-foreground">Min Baths: </span>
											<span>{viewingNotification.propertyCriteria.baths || "Any"}</span>
										</div>
										{viewingNotification.propertyCriteria.propertyTypes?.length > 0 && (
											<div className="col-span-2">
												<span className="font-semibold text-muted-foreground">Types: </span>
												<span>{viewingNotification.propertyCriteria.propertyTypes.join(", ")}</span>
											</div>
										)}
										{viewingNotification.propertyCriteria.features?.length > 0 && (
											<div className="col-span-2">
												<span className="font-semibold text-muted-foreground">Amenities: </span>
												<span>{viewingNotification.propertyCriteria.features.join(", ")}</span>
											</div>
										)}
									</div>
								</div>
							)}

							<div className="flex justify-end gap-2 pt-4 border-t border-border">
								<Button variant="outline" onClick={() => setViewingNotification(null)}>
									Close
								</Button>
								<Link href={`/admin/notifications/schedule?id=${viewingNotification._id}`}>
									<Button onClick={() => setViewingNotification(null)}>
										Edit Notification
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
