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
	Home,
	Mail,
	Phone,
	Filter,
	Trash2,
	Clock,
	CheckCircle2,
	AlertCircle,
	Eye,
	User,
	MessageSquare,
	Building2,
	TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ValuationsPage() {
	const [valuations, setValuations] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [propertySearch, setPropertySearch] = useState("");
	const [sellerSearch, setSellerSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");

	// View Details Modal State
	const [selectedValuation, setSelectedValuation] = useState<any | null>(null);
	const [isViewOpen, setIsViewOpen] = useState(false);

	const fetchValuations = async () => {
		try {
			const res = await fetch("/api/admin/valuations");
			const json = await res.json();
			if (json.success) {
				setValuations(json.valuations);
			}
		} catch (e) {
			console.error("Error fetching valuations:", e);
			toast.error("Failed to load home valuations");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchValuations();
	}, []);

	// Handle Status Change
	const handleStatusChange = async (id: string, newStatus: string) => {
		try {
			const res = await fetch(`/api/admin/valuations/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!res.ok) throw new Error("Failed to update status");

			setValuations((prev) =>
				prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
			);
			if (selectedValuation && selectedValuation.id === id) {
				setSelectedValuation((prev: any) => ({ ...prev, status: newStatus }));
			}
			toast.success(`Valuation status updated to "${newStatus}"`);
		} catch (err: any) {
			toast.error(err.message || "Failed to update valuation status");
		}
	};

	// Handle Delete Valuation
	const handleDeleteValuation = async (id: string) => {
		if (!confirm("Are you sure you want to delete this valuation request?")) return;
		try {
			const res = await fetch(`/api/admin/valuations/${id}`, {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Failed to delete valuation request");

			setValuations((prev) => prev.filter((v) => v.id !== id));
			if (selectedValuation?.id === id) {
				setIsViewOpen(false);
				setSelectedValuation(null);
			}
			toast.success("Valuation request deleted successfully");
		} catch (err: any) {
			toast.error(err.message || "Failed to delete valuation request");
		}
	};

	const filteredValuations = valuations.filter((v) => {
		const matchProperty = (v.propertyAddress || "").toLowerCase().includes(propertySearch.toLowerCase());
		const matchSeller = (v.sellerName || "").toLowerCase().includes(sellerSearch.toLowerCase()) ||
		                    (v.sellerEmail || "").toLowerCase().includes(sellerSearch.toLowerCase());
		const matchStatus = statusFilter === "all" || (v.status || "").toLowerCase() === statusFilter.toLowerCase();
		return matchProperty && matchSeller && matchStatus;
	});

	const getStatusStyles = (status: string) => {
		switch (status?.toLowerCase()) {
			case "interested":
				return "bg-purple-100 text-purple-800 border-purple-300";
			case "email sent":
				return "bg-amber-100 text-amber-800 border-amber-300";
			case "closed":
				return "bg-emerald-100 text-emerald-800 border-emerald-300";
			case "new request":
			default:
				return "bg-blue-100 text-blue-800 border-blue-300";
		}
	};

	const newCount = valuations.filter((v) => (v.status || "").toLowerCase() === "new request").length;
	const interestedCount = valuations.filter((v) => (v.status || "").toLowerCase() === "interested").length;
	const closedCount = valuations.filter((v) => (v.status || "").toLowerCase() === "closed").length;

	return (
		<div className="space-y-6 px-2 md:px-4 my-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
						<Home className="h-7 w-7 text-amber-600" /> Home Valuations (Sellers)
					</h1>
					<p className="text-muted-foreground mt-1 text-sm md:text-base">
						Manage and review property home valuation estimate requests submitted by home sellers
					</p>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6 text-center">
						<div className="text-3xl font-bold text-foreground">{valuations.length}</div>
						<p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
							<Home className="h-4 w-4 text-amber-600" /> Total Seller Requests
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6 text-center">
						<div className="text-3xl font-bold text-blue-600">{newCount}</div>
						<p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
							<AlertCircle className="h-4 w-4 text-blue-500" /> New Requests
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6 text-center">
						<div className="text-3xl font-bold text-purple-600">{interestedCount}</div>
						<p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
							<TrendingUp className="h-4 w-4 text-purple-500" /> Hot Seller Leads
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6 text-center">
						<div className="text-3xl font-bold text-emerald-600">{closedCount}</div>
						<p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
							<CheckCircle2 className="h-4 w-4 text-emerald-500" /> Listings Closed
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="flex items-center gap-2 text-base font-semibold">
						<Filter className="h-4 w-4" /> Filter Seller Requests
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
							placeholder="Search by seller name or email..."
							value={sellerSearch}
							onChange={(e) => setSellerSearch(e.target.value)}
							className="w-full md:max-w-xs"
						/>
						<Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
							<SelectTrigger className="w-full md:w-44">
								<SelectValue placeholder="Status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								<SelectItem value="new request">New Request</SelectItem>
								<SelectItem value="email sent">Email Sent</SelectItem>
								<SelectItem value="interested">Interested</SelectItem>
								<SelectItem value="closed">Closed</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Valuations Table */}
			<Card>
				<CardHeader>
					<CardTitle>Home Valuation Estimates</CardTitle>
					<CardDescription>
						All home seller valuation requests submitted from website
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-center text-muted-foreground py-8">Loading seller valuations...</p>
					) : filteredValuations.length === 0 ? (
						<p className="text-center text-muted-foreground py-8">No valuation requests found.</p>
					) : (
						<div className="overflow-x-auto rounded-md border">
							<Table>
								<TableHeader className="bg-muted/50">
									<TableRow className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
										<TableHead className="w-[110px] pl-4">Request ID</TableHead>
										<TableHead className="min-w-[220px]">Target Property To Sell</TableHead>
										<TableHead className="min-w-[200px]">Seller Contact</TableHead>
										<TableHead className="min-w-[140px]">Date Submitted</TableHead>
										<TableHead className="w-[150px] text-center">Status Action</TableHead>
										<TableHead className="min-w-[180px]">Valuation Notes / Specs</TableHead>
										<TableHead className="w-[100px] text-right pr-4">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredValuations.map((item) => (
										<TableRow key={item.id} className="align-middle transition-colors bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-50/40">
											<TableCell className="pl-4 py-3">
												<Badge variant="outline" className="font-mono text-[11px] bg-background">
													#{item.id.slice(-8)}
												</Badge>
											</TableCell>
											<TableCell className="py-3">
												<div className="flex items-start gap-2.5">
													<div className="p-1.5 rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5 border border-amber-200">
														<Home className="h-4 w-4" />
													</div>
													<div>
														<div className="font-bold text-sm text-foreground leading-tight">
															{item.propertyAddress}
														</div>
														<Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] mt-1 font-semibold">
															🏠 Seller Request
														</Badge>
													</div>
												</div>
											</TableCell>
											<TableCell className="py-3">
												<div className="space-y-0.5">
													<div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
														<User className="h-3.5 w-3.5 text-muted-foreground" />
														<span>{item.sellerName}</span>
													</div>
													<div className="text-xs text-muted-foreground flex items-center gap-1.5">
														<Mail className="h-3 w-3 text-blue-500 shrink-0" />
														<a href={`mailto:${item.sellerEmail}`} className="hover:underline hover:text-blue-600 truncate max-w-[160px]">
															{item.sellerEmail}
														</a>
													</div>
													{item.sellerPhone && (
														<div className="text-xs text-muted-foreground flex items-center gap-1.5">
															<Phone className="h-3 w-3 text-emerald-500 shrink-0" />
															<a href={`tel:${item.sellerPhone}`} className="hover:underline">
																{item.sellerPhone}
															</a>
														</div>
													)}
												</div>
											</TableCell>
											<TableCell className="py-3 text-xs text-muted-foreground font-medium">
												<div className="flex items-center gap-1">
													<Clock className="h-3.5 w-3.5 text-muted-foreground" />
													{item.createdAt}
												</div>
											</TableCell>
											<TableCell className="text-center py-3">
												<Select
													value={item.status || "New Request"}
													onValueChange={(val) => handleStatusChange(item.id, val)}
												>
													<SelectTrigger className={`w-36 h-8 text-xs font-semibold mx-auto rounded-full border ${getStatusStyles(item.status)}`}>
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="New Request">New Request</SelectItem>
														<SelectItem value="Email Sent">Email Sent</SelectItem>
														<SelectItem value="Interested">Interested</SelectItem>
														<SelectItem value="Closed">Closed</SelectItem>
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell className="max-w-[220px] py-3">
												<div className="text-xs text-muted-foreground truncate leading-relaxed" title={item.message}>
													{item.message || "Home Valuation Details Submitted"}
												</div>
											</TableCell>
											<TableCell className="text-right pr-4 py-3">
												<div className="flex items-center justify-end gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
														title="View Seller Valuation Details"
														onClick={() => {
															setSelectedValuation(item);
															setIsViewOpen(true);
														}}
													>
														<Eye className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
														title="Delete Valuation Request"
														onClick={() => handleDeleteValuation(item.id)}
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			{/* VIEW VALUATION DETAILS MODAL */}
			<Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
				<DialogContent className="sm:max-w-[550px] w-[95vw] rounded-2xl p-6">
					<DialogHeader className="border-b pb-3">
						<DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-900 dark:text-amber-400">
							<Home className="h-5 w-5 text-amber-600" /> Seller Home Valuation Details
						</DialogTitle>
						<DialogDescription>
							Full structural specs and valuation report request submitted by the seller.
						</DialogDescription>
					</DialogHeader>

					{selectedValuation && (
						<div className="space-y-4 py-4 text-sm">
							{/* Target Property Card */}
							<div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/90 space-y-2">
								<h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
									<Building2 className="h-4 w-4 text-amber-600" /> Target Property To Sell
								</h3>
								<div className="text-base font-bold text-gray-900 dark:text-gray-100">
									{selectedValuation.propertyAddress}
								</div>
								<Badge className="bg-amber-200 text-amber-900 border-amber-300 text-xs font-semibold">
									🏠 Home Valuation Estimate Requested
								</Badge>
							</div>

							{/* Seller Contact Info */}
							<div className="p-4 bg-muted/40 rounded-xl border border-border space-y-3">
								<h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
									<User className="h-4 w-4 text-blue-600" /> Seller Contact Info
								</h3>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
									<div>
										<span className="text-xs text-muted-foreground block">Seller Name</span>
										<span className="font-semibold text-foreground">{selectedValuation.sellerName}</span>
									</div>
									<div>
										<span className="text-xs text-muted-foreground block">Email</span>
										<a href={`mailto:${selectedValuation.sellerEmail}`} className="font-semibold text-blue-600 hover:underline flex items-center gap-1">
											<Mail className="h-3.5 w-3.5" /> {selectedValuation.sellerEmail}
										</a>
									</div>
									{selectedValuation.sellerPhone && (
										<div>
											<span className="text-xs text-muted-foreground block">Phone</span>
											<a href={`tel:${selectedValuation.sellerPhone}`} className="font-semibold text-foreground flex items-center gap-1">
												<Phone className="h-3.5 w-3.5 text-muted-foreground" /> {selectedValuation.sellerPhone}
											</a>
										</div>
									)}
									<div>
										<span className="text-xs text-muted-foreground block">Date Submitted</span>
										<span className="font-medium text-foreground">{selectedValuation.createdAt}</span>
									</div>
								</div>
							</div>

							{/* Valuation Specs & Message */}
							<div className="p-4 bg-muted/40 rounded-xl border border-border space-y-2">
								<h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
									<MessageSquare className="h-4 w-4 text-amber-600" /> Property Specifications & Notes
								</h3>
								<p className="text-xs bg-white dark:bg-zinc-900 p-3 rounded-lg border border-border text-foreground leading-relaxed whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
									{selectedValuation.message || "No additional comments provided."}
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
