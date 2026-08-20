"use client";
import React, { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Calendar,
	Mail,
	Phone,
	Filter,
	Trash2,
	Building2,
	Clock,
	CheckCircle2,
	XCircle,
	AlertCircle,
	Lock,
	ExternalLink,
	Eye,
	User,
	MessageSquare,
} from "lucide-react";

import { toast } from "sonner";

export default function ToursPage() {
	const [tourRequests, setTourRequests] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [propertySearch, setPropertySearch] = useState("");
	const [userSearch, setUserSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// View Details Modal State
	const [viewModalTour, setViewModalTour] = useState<any | null>(null);
	const [isViewOpen, setIsViewOpen] = useState(false);

	const fetchTours = async () => {
		try {
			const res = await fetch("/api/admin/tours");
			const json = await res.json();
			if (json.success) {
				setTourRequests(json.tours);
			}
		} catch (e) {
			console.error("Error fetching tours:", e);
			toast.error("Failed to load tour requests");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchTours();
	}, []);

	// Handle Status Change
	const handleStatusChange = async (tourId: string, newStatus: string) => {
		try {
			const res = await fetch(`/api/admin/tours/${tourId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!res.ok) throw new Error("Failed to update status");

			setTourRequests((prev) =>
				prev.map((t) => (t.id === tourId ? { ...t, status: newStatus } : t))
			);
			if (viewModalTour && viewModalTour.id === tourId) {
				setViewModalTour((prev: any) => ({ ...prev, status: newStatus }));
			}
			toast.success(`Tour status updated to "${newStatus}"`);
		} catch (err: any) {
			toast.error(err.message || "Failed to update tour status");
		}
	};

	// Handle Delete Tour
	const handleDeleteTour = async (tourId: string) => {
		if (!confirm("Are you sure you want to delete this tour request?")) return;
		try {
			const res = await fetch(`/api/admin/tours/${tourId}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete tour request");

			setTourRequests((prev) => prev.filter((t) => t.id !== tourId));
			if (viewModalTour?.id === tourId) {
				setIsViewOpen(false);
				setViewModalTour(null);
			}
			toast.success("Tour request deleted successfully");
		} catch (err: any) {
			toast.error(err.message || "Failed to delete tour request");
		}
	};

	// Handle Open View Modal
	const handleOpenViewModal = (tour: any) => {
		setViewModalTour(tour);
		setIsViewOpen(true);
	};

	const filteredTours = tourRequests.filter((t) => {
		const matchProperty = (t.propertyAddress || "").toLowerCase().includes(propertySearch.toLowerCase());
		const matchUser = (t.userName || "").toLowerCase().includes(userSearch.toLowerCase()) || 
		                  (t.userEmail || "").toLowerCase().includes(userSearch.toLowerCase());
		const matchStatus = statusFilter === "all" || (t.status || "").toLowerCase() === statusFilter.toLowerCase();
		return matchProperty && matchUser && matchStatus;
	});

	const getStatusStyles = (status: string) => {
		switch (status?.toLowerCase()) {
			case "confirmed":
				return "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200";
			case "completed":
				return "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200";
			case "cancelled":
				return "bg-red-100 text-red-800 border-red-300 hover:bg-red-200";
			case "pending":
			default:
				return "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200";
		}
	};

	const pendingCount = tourRequests.filter((t) => (t.status || "").toLowerCase() === "pending").length;
	const confirmedCount = tourRequests.filter((t) => (t.status || "").toLowerCase() === "confirmed").length;
	const completedCount = tourRequests.filter((t) => (t.status || "").toLowerCase() === "completed").length;

	return (
		<div className="space-y-6 px-2 md:px-4 my-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">Tour Requests</h1>
					<p className="text-muted-foreground mt-1 text-sm md:text-base">
						Manage, schedule, and track property tour requests from potential buyers
					</p>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6 text-center">
						<div className="text-3xl font-bold text-foreground">{tourRequests.length}</div>
						<p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
							<Clock className="h-4 w-4 text-blue-500" /> Total Tours
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6 text-center">
						<div className="text-3xl font-bold text-amber-600">{pendingCount}</div>
						<p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
							<AlertCircle className="h-4 w-4 text-amber-500" /> Pending
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6 text-center">
						<div className="text-3xl font-bold text-blue-600">{confirmedCount}</div>
						<p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
							<Lock className="h-4 w-4 text-blue-500" /> Locked & Confirmed
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6 text-center">
						<div className="text-3xl font-bold text-emerald-600">{completedCount}</div>
						<p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
							<CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completed
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base font-semibold">
						<Filter className="h-4 w-4" />
						Filter Requests
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row gap-4 items-center">
						<Input
							placeholder="Search by property address..."
							value={propertySearch}
							onChange={(e) => setPropertySearch(e.target.value)}
							className="w-full md:max-w-xs"
						/>
						<Input
							placeholder="Search by user name or email..."
							value={userSearch}
							onChange={(e) => setUserSearch(e.target.value)}
							className="w-full md:max-w-xs"
						/>
						<Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
							<SelectTrigger className="w-full md:w-44">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="confirmed">Confirmed</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
								<SelectItem value="cancelled">Cancelled</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Tour Requests Table */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Tour Requests</CardTitle>
					<CardDescription>
						All scheduled property visits submitted by website visitors
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-center text-muted-foreground py-8">Loading tour requests...</p>
					) : filteredTours.length === 0 ? (
						<p className="text-center text-muted-foreground py-8">No tour requests found.</p>
					) : (
						<div className="overflow-x-auto rounded-md border">
							<Table>
								<TableHeader className="bg-muted/50">
									<TableRow className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
										<TableHead className="w-[120px] pl-4">Request ID</TableHead>
										<TableHead className="min-w-[220px]">Property Details</TableHead>
										<TableHead className="min-w-[200px]">Visitor Contact</TableHead>
										<TableHead className="min-w-[190px]">Tour Date & Time</TableHead>
										<TableHead className="w-[150px] text-center">Status Action</TableHead>
										<TableHead className="min-w-[180px]">Note / Message</TableHead>
										<TableHead className="w-[100px] text-right pr-4">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredTours.map((request) => {
										const statusLower = (request.status || "").toLowerCase();
										const isConfirmed = statusLower === "confirmed";
										const isCompleted = statusLower === "completed";
										const isCancelled = statusLower === "cancelled";

										const displayAddr = request.propertyAddress === "MLS: " || !request.propertyAddress || request.propertyAddress === "N/A"
											? "General / Direct Tour"
											: request.propertyAddress;

										return (
											<TableRow 
												key={request.id} 
												className={`align-middle transition-colors ${
													isConfirmed 
														? "bg-blue-50/60 dark:bg-blue-950/20 border-l-4 border-l-blue-600" 
														: isCompleted 
														? "bg-emerald-50/40 dark:bg-emerald-950/10 border-l-4 border-l-emerald-600"
														: isCancelled 
														? "bg-red-50/30 opacity-80 border-l-4 border-l-red-400"
														: ""
												}`}
											>
												{/* Request ID */}
												<TableCell className="pl-4 py-3">
													<Badge variant="outline" className="font-mono text-[11px] text-muted-foreground bg-background" title={request.id}>
														#{request.id.slice(-8)}
													</Badge>
												</TableCell>

												{/* Property */}
												<TableCell className="py-3">
													<div className="flex items-start gap-2.5">
														<div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-100 shrink-0 mt-0.5">
															<Building2 className="h-4 w-4 text-blue-600" />
														</div>
														<div className="space-y-0.5">
															<div className="font-semibold text-sm text-foreground leading-tight">
																{displayAddr}
															</div>
															{request.propertyId && (
																<div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 pt-0.5">
																	<span>MLS: {request.propertyId}</span>
																	<a
																		href={`/admin/properties?search=${encodeURIComponent(request.propertyId)}`}
																		target="_blank"
																		rel="noreferrer"
																		className="text-blue-600 hover:underline inline-flex items-center gap-0.5 font-semibold"
																		title="View Property in Admin"
																	>
																		<ExternalLink className="h-3 w-3" /> View
																	</a>
																</div>
															)}
														</div>
													</div>
												</TableCell>

												{/* Visitor Contact */}
												<TableCell className="py-3">
													<div className="space-y-0.5">
														<div className="font-semibold text-sm text-foreground flex items-center gap-1.5 flex-wrap">
															<User className="h-3.5 w-3.5 text-muted-foreground" />
															<span>{request.userName}</span>
															<Badge className="bg-blue-100 text-blue-900 border-blue-200 text-[10px] px-1.5 py-0 font-bold">
																🛒 Buyer
															</Badge>
														</div>

														<div className="text-xs text-muted-foreground flex items-center gap-1.5">
															<Mail className="h-3 w-3 text-blue-500 shrink-0" />
															<a href={`mailto:${request.userEmail}`} className="hover:underline hover:text-blue-600 truncate max-w-[160px]">
																{request.userEmail}
															</a>
														</div>
														{request.userPhone && (
															<div className="text-xs text-muted-foreground flex items-center gap-1.5">
																<Phone className="h-3 w-3 text-emerald-500 shrink-0" />
																<a href={`tel:${request.userPhone}`} className="hover:underline">
																	{request.userPhone}
																</a>
															</div>
														)}
													</div>
												</TableCell>

												{/* Date & Time Slot */}
												<TableCell className="py-3">
													<div className="space-y-1">
														<div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
															<Calendar className="h-3.5 w-3.5 text-blue-600" />
															{request.requestedDate}
														</div>
														<div className="text-xs text-muted-foreground flex items-center gap-1.5">
															<Clock className="h-3.5 w-3.5 text-amber-600" />
															<span>{request.requestedTime}</span>
														</div>

														{/* Lock / Slot Badge */}
														{isConfirmed && (
															<Badge className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-[11px] gap-1 px-2 py-0.5 mt-1 inline-flex items-center shadow-sm">
																<Lock className="h-3 w-3" /> Slot Locked & Booked
															</Badge>
														)}

														{isCompleted && (
															<Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-[11px] gap-1 px-2 py-0.5 mt-1 inline-flex items-center shadow-sm">
																<CheckCircle2 className="h-3 w-3" /> Tour Completed
															</Badge>
														)}

														{isCancelled && (
															<Badge variant="outline" className="text-red-600 bg-red-50 border-red-200 text-[11px] gap-1 px-2 py-0.5 mt-1 inline-flex items-center">
																<XCircle className="h-3 w-3" /> Tour Cancelled
															</Badge>
														)}

														{!isConfirmed && !isCompleted && !isCancelled && (
															<Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 text-[11px] gap-1 px-2 py-0.5 mt-1 inline-flex items-center">
																<Clock className="h-3 w-3" /> Awaiting Confirmation
															</Badge>
														)}
													</div>
												</TableCell>

												{/* Status Action */}
												<TableCell className="text-center py-3">
													<Select
														value={request.status?.toLowerCase() || "pending"}
														onValueChange={(val) => {
															const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
															handleStatusChange(request.id, capitalized);
														}}
													>
														<SelectTrigger
															className={`w-32 h-8 text-xs font-semibold mx-auto rounded-full border transition-all ${getStatusStyles(
																request.status
															)}`}
														>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="pending">Pending</SelectItem>
															<SelectItem value="confirmed">Confirmed</SelectItem>
															<SelectItem value="completed">Completed</SelectItem>
															<SelectItem value="cancelled">Cancelled</SelectItem>
														</SelectContent>
													</Select>
												</TableCell>

												{/* Message */}
												<TableCell className="max-w-[200px] py-3">
													<div className="text-xs text-muted-foreground truncate leading-relaxed" title={request.message}>
														{request.message || "No additional message."}
													</div>
												</TableCell>

												{/* Actions */}
												<TableCell className="text-right pr-4 py-3">
													<div className="flex items-center justify-end gap-1">
														{/* View Details Modal Trigger */}
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
															title="View Tour & Property Details"
															onClick={() => handleOpenViewModal(request)}
														>
															<Eye className="h-4 w-4" />
														</Button>

														{/* Delete */}
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
															title="Delete Tour Request"
															onClick={() => handleDeleteTour(request.id)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>

						</div>
					)}
				</CardContent>
			</Card>

			{/* VIEW TOUR & PROPERTY DETAILS MODAL */}
			<Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
				<DialogContent className="sm:max-w-[550px] w-[95vw] rounded-2xl p-6">
					<DialogHeader className="border-b pb-3">
						<DialogTitle className="text-xl font-bold flex items-center gap-2">
							<Building2 className="h-5 w-5 text-blue-600" />
							Tour & Property Request Details
						</DialogTitle>
						<DialogDescription>
							Full information submitted for this property visit.
						</DialogDescription>
					</DialogHeader>

					{viewModalTour && (
						<div className="space-y-5 py-4 text-sm">
							{/* Property Block */}
							<div className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
										<Building2 className="h-4 w-4 text-blue-600" /> Target Property Details
									</h3>
									{viewModalTour.propertyId && (
										<Button size="sm" variant="outline" asChild className="h-7 text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50">
											<a
												href={`/admin/properties?search=${encodeURIComponent(viewModalTour.propertyId)}`}
												target="_blank"
												rel="noreferrer"
											>
												<ExternalLink className="h-3 w-3 mr-1" /> View Property
											</a>
										</Button>
									)}
								</div>

								<div className="text-base font-bold text-foreground">
									{viewModalTour.propertyAddress === "MLS: " || !viewModalTour.propertyAddress || viewModalTour.propertyAddress === "N/A"
										? "General / Direct Tour Request"
										: viewModalTour.propertyAddress}
								</div>

								{/* Property specs if available */}
								{viewModalTour.propertyDetails && (
									<div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 flex-wrap">
										{viewModalTour.propertyDetails.price && (
											<span className="font-bold text-foreground text-sm text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">
												{viewModalTour.propertyDetails.price}
											</span>
										)}
										{viewModalTour.propertyDetails.beds && (
											<span className="bg-background px-2 py-0.5 rounded border">
												🛏️ {viewModalTour.propertyDetails.beds} Beds
											</span>
										)}
										{viewModalTour.propertyDetails.baths && (
											<span className="bg-background px-2 py-0.5 rounded border">
												🛁 {viewModalTour.propertyDetails.baths} Baths
											</span>
										)}
										{viewModalTour.propertyDetails.sqft && (
											<span className="bg-background px-2 py-0.5 rounded border">
												📐 {viewModalTour.propertyDetails.sqft}
											</span>
										)}
										{viewModalTour.propertyId && (
											<Badge variant="outline" className="font-mono text-xs">
												MLS ID: {viewModalTour.propertyId}
											</Badge>
										)}
									</div>
								)}
							</div>

							{/* User Details Block (Buyer) */}
							<div className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
								<h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
									<User className="h-4 w-4 text-blue-600" /> Buyer Contact Info
								</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<span className="text-xs text-muted-foreground block">Customer Name</span>
										<span className="font-semibold text-foreground">{viewModalTour.userName}</span>
									</div>
									<div>
										<span className="text-xs text-muted-foreground block">Email</span>
										<a href={`mailto:${viewModalTour.userEmail}`} className="font-semibold text-blue-600 hover:underline flex items-center gap-1">
											<Mail className="h-3.5 w-3.5" /> {viewModalTour.userEmail}
										</a>
									</div>
									{viewModalTour.userPhone && (
										<div>
											<span className="text-xs text-muted-foreground block">Phone</span>
											<a href={`tel:${viewModalTour.userPhone}`} className="font-semibold text-foreground flex items-center gap-1">
												<Phone className="h-3.5 w-3.5 text-muted-foreground" /> {viewModalTour.userPhone}
											</a>
										</div>
									)}
									<div>
										<span className="text-xs text-muted-foreground block">Submitted On</span>
										<span className="font-medium text-foreground">{viewModalTour.createdAt}</span>
									</div>
								</div>
							</div>

							{/* Listing Agent / Seller Representative Contact Block */}
							<div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200/90 space-y-3 shadow-xs">
								<h3 className="font-semibold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
									<Building2 className="h-4 w-4 text-amber-600" /> Listing Agent & Seller Representative
								</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
									<div>
										<span className="text-muted-foreground block">Listing Agent</span>
										<span className="font-bold text-foreground text-sm">
											{viewModalTour.listingAgent?.name || "Gulfshore In-House Listing Agent"}
										</span>
									</div>
									<div>
										<span className="text-muted-foreground block">Brokerage Office</span>
										<span className="font-semibold text-foreground">
											{viewModalTour.listingAgent?.office || "Gulfshore Real Estate LLC"}
										</span>
									</div>
									<div>
										<span className="text-muted-foreground block">Agent Email</span>
										<a
											href={`mailto:${viewModalTour.listingAgent?.email || "listings@gulfshoregroup.com"}`}
											className="font-semibold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
										>
											<Mail className="h-3.5 w-3.5" />
											{viewModalTour.listingAgent?.email || "listings@gulfshoregroup.com"}
										</a>
									</div>
									<div>
										<span className="text-muted-foreground block">Agent Phone</span>
										<a
											href={`tel:${viewModalTour.listingAgent?.phone || "(239) 555-0199"}`}
											className="font-semibold text-foreground flex items-center gap-1 mt-0.5"
										>
											<Phone className="h-3.5 w-3.5 text-muted-foreground" />
											{viewModalTour.listingAgent?.phone || "(239) 555-0199"}
										</a>
									</div>
								</div>
							</div>



							{/* Tour Date & Status */}
							<div className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
								<h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
									<Calendar className="h-4 w-4 text-blue-600" /> Requested Tour Date & Time
								</h3>
								<div className="flex items-center justify-between">
									<div>
										<div className="text-base font-bold text-foreground">
											📅 {viewModalTour.requestedDate}
										</div>
										<div className="text-sm text-muted-foreground font-medium mt-0.5">
											⏰ Slot: {viewModalTour.requestedTime}
										</div>
									</div>

									<div>
										<Select
											value={viewModalTour.status?.toLowerCase() || "pending"}
											onValueChange={(val) => {
												const capitalized = val.charAt(0).toUpperCase() + val.slice(1);
												handleStatusChange(viewModalTour.id, capitalized);
											}}
										>
											<SelectTrigger className={`w-36 h-9 font-semibold rounded-full border ${getStatusStyles(viewModalTour.status)}`}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="pending">Pending</SelectItem>
												<SelectItem value="confirmed">Confirmed</SelectItem>
												<SelectItem value="completed">Completed</SelectItem>
												<SelectItem value="cancelled">Cancelled</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>
							</div>

							{/* Message Block */}
							<div className="p-4 bg-muted/40 rounded-xl border border-border space-y-2">
								<h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
									<MessageSquare className="h-4 w-4 text-blue-600" /> Customer Message / Note
								</h3>
								<p className="text-sm bg-white dark:bg-zinc-900 p-3 rounded-lg border border-border text-foreground leading-relaxed whitespace-pre-wrap">
									{viewModalTour.message || "No additional comments provided."}
								</p>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button variant="outline" onClick={() => setIsViewOpen(false)}>
							Close Details
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
