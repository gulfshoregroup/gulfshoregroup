"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Search, Plus, Phone, Mail, Calendar, Eye, Trash2, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import { IPrismaLead } from "@/models/leads";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// -------------------- CONFIG --------------------
const statusOptions = [
	{ value: "new", label: "New", color: "bg-blue-100 text-blue-800" },
	{
		value: "contacted",
		label: "Contacted",
		color: "bg-yellow-100 text-yellow-800",
	},
	{
		value: "interested",
		label: "Interested",
		color: "bg-purple-100 text-purple-800",
	},
	{
		value: "closed",
		label: "Closed",
		color: "bg-green-100 text-green-800",
	},
];

const sourceOptions = [
	{
		value: "General",
		color: "bg-purple-100 text-purple-800",
	},
	{
		value: "SignUp",
		color: "bg-green-100 text-green-800",
	},
	{
		value: "Contact_Form",
		color: "bg-violet-100 text-violet-800",
	},
	{
		value: "Tour_Request",
		color: "bg-amber-100 text-amber-800",
	},
	{
		value: "Home_Valuation",
		color: "bg-emerald-100 text-emerald-800",
	},
	{
		value: "Other",
		color: "bg-gray-100 text-gray-800",
	},
];

const SourceFilters = [
	"All Sources",
	"SignUp",
	"Contact_Form",
	"Tour_Request",
	"Home_Valuation",
	"General",
	"Other",
];

// -------------------- PAGE --------------------
export default function LeadsPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sourceFilter, setSourceFilter] = useState("All Sources");
	const [leads, setLeads] = useState<IPrismaLead[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [sortBy, setSortBy] = useState("createdAt");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const limit = 20;

	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [quickTagLeadId, setQuickTagLeadId] = useState<string | null>(null);
	const [viewLead, setViewLead] = useState<IPrismaLead | null>(null);
	const [isViewOpen, setIsViewOpen] = useState(false);
	const [fullViewLead, setFullViewLead] = useState<any>(null);
	const [loadingFullViewLead, setLoadingFullViewLead] = useState(false);

	const handleOpenView = async (lead: IPrismaLead) => {
		setViewLead(lead);
		setIsViewOpen(true);
		setFullViewLead(null);
		setLoadingFullViewLead(true);
		try {
			const res = await fetch(`/api/leads/${lead.id || lead._id}`);
			if (res.ok) {
				const data = await res.json();
				setFullViewLead(data);
			}
		} catch (err) {
			console.error("Failed to fetch full lead details", err);
		} finally {
			setLoadingFullViewLead(false);
		}
	};

	const TAG_OPTIONS = ["Buyer", "Seller", "Hot Lead", "Cold Lead", "Investor"];

	const handleQuickTag = async (leadId: string, tag: string, currentTags: string[]) => {
		const has = currentTags.includes(tag);
		const newTags = has ? currentTags.filter((t) => t !== tag) : [...currentTags, tag];
		try {
			const res = await fetch(`/api/leads/${leadId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ tags: newTags }),
			});
			if (!res.ok) throw new Error("Failed");
			setLeads((prev) =>
				prev.map((l) => (l.id === leadId ? { ...l, tags: newTags } : l))
			);
			toast.success(has ? `Removed "${tag}"` : `Tagged as "${tag}"`);
		} catch {
			toast.error("Failed to update tag");
		}
	};
	const [formData, setFormData] = useState<{
		firstName: string;
		lastName: string;
		email: string;
		phone: string;
		status: string;
		source: string;
		tags: string[];
		lastContactedAt: string;
	}>({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		status: "New",
		source: "General",
		tags: [],
		lastContactedAt: "",
	});

	const handleCreateLead = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.firstName || !formData.lastName || !formData.email) {
			toast.error("First Name, Last Name, and Email are required");
			return;
		}
		try {
			const res = await fetch("/api/leads", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					lastContactedAt: formData.lastContactedAt ? new Date(formData.lastContactedAt).toISOString() : null,
				}),
			});
			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || "Failed to create lead");
			}
			const newLead = await res.json();
			setLeads((prev) => [newLead, ...prev]);
			setIsCreateOpen(false);
			setFormData({
				firstName: "",
				lastName: "",
				email: "",
				phone: "",
				status: "New",
				source: "General",
				tags: [],
				lastContactedAt: "",
			});
			toast.success("Lead created successfully!");
		} catch (err: any) {
			toast.error(err.message || "Something went wrong");
		}
	};

	// -------------------- FETCH --------------------
	useEffect(() => {
		const fetchLeads = async () => {
			try {
				setLoading(true);
				const res = await fetch(`/api/leads?page=${page}&limit=${limit}&sortBy=${sortBy}&sortOrder=${sortOrder}`);
				if (!res.ok) throw new Error("Failed to fetch leads");
				const json = await res.json();
				setLeads(json.data || []);
				setTotalCount(json.total || 0);
				setTotalPages(json.totalPages || 1);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchLeads();
	}, [page, sortBy, sortOrder]);

	// -------------------- FILTERS --------------------
	const filteredLeads = leads.filter((lead) => {
		const matchesSearch =
			lead.firstName
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			lead.lastName
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			lead.phone?.includes(searchTerm);

		const matchesStatus =
			statusFilter === "all" ||
			lead.status?.toLowerCase() === statusFilter.toLowerCase();

		const matchesSource =
			sourceFilter === "All Sources" ||
			lead.source?.toLowerCase() === sourceFilter.toLowerCase();

		return matchesSearch && matchesStatus && matchesSource;
	});

	// -------------------- HELPERS --------------------
	const getStatusColor = (status: string) =>
		statusOptions.find((s) => s.value === status?.toLowerCase())
			?.color || "bg-gray-100 text-gray-800";

	const getSourceColor = (source: string) =>
		sourceOptions.find((s) => s.value === source)?.color ||
		"bg-gray-100 text-gray-800";

	const getScoreColor = (label: string) => {
		switch (label) {
			case "Ready to Buy": return "bg-red-100 text-red-800 font-bold border-red-200";
			case "Hot": return "bg-orange-100 text-orange-800";
			case "Warm": return "bg-amber-100 text-amber-800";
			case "Cold": return "bg-blue-100 text-blue-800";
			default: return "bg-gray-100 text-gray-800";
		}
	};

	// -------------------- UI STATES --------------------
	if (loading)
		return (
			<div className="p-6 text-center font-bold text-muted-foreground">
				Loading leads...
			</div>
		);
	if (error)
		return (
			<div className="p-6 text-center text-red-500">
				Error: {error}
			</div>
		);

	// -------------------- UI --------------------
	return (
		<div className="space-y-6">
			{/* HEADER */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Leads
					</h1>
					<p className="text-muted-foreground mt-2">
						View, manage, and track all potential buyers and sellers
					</p>
				</div>
				<Button 
					onClick={() => setIsCreateOpen(true)}
					className="flex items-center gap-2"
				>
					<Plus className="h-4 w-4" />
					Add Lead
				</Button>
			</div>

			{/* SUMMARY CARDS */}
			<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
				{[
					{
						label: "Total Leads",
						value: leads.length,
						color: "text-foreground",
					},
					{
						label: "New",
						value: leads.filter((l) => l.status === "New").length,
						color: "text-blue-600",
					},
					{
						label: "Interested",
						value: leads.filter((l) => l.status === "Interested")
							.length,
						color: "text-purple-600",
					},
					{
						label: "Closed",
						value: leads.filter((l) => l.status === "Closed").length,
						color: "text-green-600",
					},
					{
						label: "Hot Leads 🔥",
						value: leads.filter((l) => l.scoreLabel === "Hot" || l.scoreLabel === "Ready to Buy").length,
						color: "text-orange-600",
					},
				].map((card, i) => (
					<Card key={i}>
						<CardContent className="pt-6 text-center">
							<div className={`text-3xl font-bold ${card.color}`}>
								{card.value}
							</div>
							<p className="text-sm text-muted-foreground mt-1">
								{card.label}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* LEADS TABLE */}
			<Card>
				<CardHeader>
					<CardTitle>All Leads</CardTitle>
					<CardDescription>
						Search, filter, and view all leads in one place
					</CardDescription>
				</CardHeader>
				<CardContent>
					{/* Filters */}
					<div className="flex flex-col md:flex-row gap-4 mb-4">
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by name, email, or phone..."
								className="pl-10"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>

						<Select
							value={statusFilter}
							onValueChange={(v) => setStatusFilter(v)}>
							<SelectTrigger className="md:w-48">
								<SelectValue placeholder="Filter by status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Statuses</SelectItem>
								{statusOptions.map((status) => (
									<SelectItem key={status.value} value={status.value}>
										{status.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={sourceFilter}
							onValueChange={(v) => setSourceFilter(v)}>
							<SelectTrigger className="md:w-48">
								<SelectValue placeholder="Filter by source" />
							</SelectTrigger>
							<SelectContent>
								{SourceFilters.map((src) => (
									<SelectItem key={src} value={src}>
										{src.replace("_", " ")}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Table */}
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border">
									<th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
									<th className="text-left py-3 px-4 font-semibold text-foreground">Contact</th>
									<th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
									<th className="text-left py-3 px-4 font-semibold text-foreground">Score</th>
									<th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setSortBy("viewedProperties"); setSortOrder(sortOrder === "desc" ? "asc" : "desc"); }}>
										<div className="flex items-center gap-1">
											Views {sortBy === "viewedProperties" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
										</div>
									</th>
									<th className="text-left py-3 px-4 font-semibold text-foreground cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => { setSortBy("lastLogin"); setSortOrder(sortOrder === "desc" ? "asc" : "desc"); }}>
										<div className="flex items-center gap-1">
											Last Active {sortBy === "lastLogin" ? (sortOrder === "desc" ? "↓" : "↑") : ""}
										</div>
									</th>
									<th className="text-left py-3 px-4 font-semibold text-foreground">Tags</th>
									<th className="text-left py-3 px-4 font-semibold text-foreground">Last Contact</th>
									<th className="text-left py-3 px-4 font-semibold text-foreground">Action</th>
								</tr>
							</thead>
							<tbody>
								{filteredLeads.map((lead, i) => (
									<tr
										key={i}
										className="border-b border-border hover:bg-muted/50 transition-colors">
										<td className="py-3 px-4 font-medium text-foreground">
											{lead.firstName} {lead.lastName}
										</td>
										<td className="py-3 px-4">
											<div className="space-y-1 text-xs text-muted-foreground">
												<div className="flex items-center gap-1">
													<Mail className="h-3 w-3" /> {lead.email}
												</div>
												<div className="flex items-center gap-1">
													<Phone className="h-3 w-3" /> {lead.phone}
												</div>
											</div>
										</td>
										<td className="py-3 px-4">
											<Badge className={getStatusColor(lead.status)}>
												{lead.status || "Unknown"}
											</Badge>
										</td>
										<td className="py-3 px-4">
											<Badge className={getScoreColor(lead.scoreLabel)}>
												{lead.scoreLabel || "Cold"} ({lead.score || 0})
											</Badge>
										</td>
										<td className="py-3 px-4 text-center">
											<div className="font-bold text-blue-600">{lead._count?.viewHistory || 0}</div>
											{lead.viewHistory?.[0]?.lastViewedAt && (
												<div className="text-[10px] text-muted-foreground mt-0.5">
													{new Date(lead.viewHistory[0].lastViewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
												</div>
											)}
										</td>
										<td className="py-3 px-4 text-xs text-muted-foreground">
											{lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
										</td>
										<td className="py-3 px-4">
											<div className="flex gap-1 flex-wrap items-center">
												{lead.tags?.length ? (
													lead.tags.map((tag, j) => (
														<Badge
															key={j}
															variant="secondary"
															className="text-xs cursor-pointer"
															onClick={() => handleQuickTag(lead.id, String(tag), (lead.tags || []).map(String))}>
															{String(tag).replace(/_/g, " ")} ✕
														</Badge>
													))
												) : null}
												{/* Quick tag dropdown — show label only when no tags */}
												<div className="relative">
													<button
														onClick={() => setQuickTagLeadId(quickTagLeadId === lead.id ? null : lead.id)}
														className="text-xs text-muted-foreground hover:text-primary transition-colors px-1"
														title="Add / remove tags">
														{lead.tags?.length ? "+" : "+ Tag"}
													</button>
													{quickTagLeadId === lead.id && (
														<div className="absolute z-50 top-6 left-0 bg-background border rounded-lg shadow-lg p-2 min-w-[130px]">
															{TAG_OPTIONS.map((tag) => (
																<button
																	key={tag}
																	onClick={() => { handleQuickTag(lead.id, tag, (lead.tags || []).map(String)); setQuickTagLeadId(null); }}
																	className={`w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors flex items-center gap-2 ${ (lead.tags || []).map(String).includes(tag) ? "font-semibold text-primary" : ""}`}>
																	{(lead.tags || []).map(String).includes(tag) ? "✓ " : ""}{tag}
																</button>
															))}
														</div>
													)}
												</div>
											</div>
										</td>

										<td className="py-3 px-4 text-xs text-muted-foreground">
											<div className="flex items-center gap-1">
												<Calendar className="h-3 w-3" />
												{lead.lastContactedAt
													? new Date(lead.lastContactedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
													: new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
											</div>
										</td>
										<td className="py-3 px-4">
											<div className="flex items-center gap-1">
												<Button
													title="Quick View"
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
													onClick={() => handleOpenView(lead)}
												>
													<Eye className="h-4 w-4" />
												</Button>
												<Link href={`/admin/leads/${lead.id || lead._id}`} title="Edit">
													<Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
														<Edit className="h-4 w-4" />
													</Button>
												</Link>
												<Button 
													title="Delete"
													variant="ghost" 
													size="icon" 
													className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
													onClick={() => {
														if (confirm("Are you sure you want to delete this lead?")) {
															fetch(`/api/leads/${lead.id || lead._id}`, { method: "DELETE" })
																.then(res => {
																	if (res.ok) {
																		setLeads(prev => prev.filter(l => (l.id || l._id) !== (lead.id || lead._id)));
																		toast.success("Lead deleted");
																	} else {
																		toast.error("Failed to delete lead");
																	}
																});
														}
													}}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					{filteredLeads.length === 0 && (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								No leads found matching your criteria.
							</p>
						</div>
					)}

					{/* Pagination Controls */}
					<div className="flex items-center justify-between mt-4 px-2">
						<span className="text-xs text-muted-foreground">
							Page {page} of {totalPages} (Showing {leads.length} of {totalCount} total)
						</span>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.max(p - 1, 1))}
								disabled={page === 1}
							>
								<ChevronLeft className="h-4 w-4 mr-1" />
								Previous
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
								disabled={page === totalPages || totalPages === 0}
							>
								Next
								<ChevronRight className="h-4 w-4 ml-1" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent className="sm:max-w-[500px] w-[95vw] rounded-xl">
					<form onSubmit={handleCreateLead}>
						<DialogHeader>
							<DialogTitle>Add New Lead</DialogTitle>
							<DialogDescription>
								Fill in the details below to add a new potential lead.
							</DialogDescription>
						</DialogHeader>
						<div className="grid gap-4 py-4 max-h-[65vh] overflow-y-auto px-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">
							<div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
								<Label htmlFor="firstName" className="text-left sm:text-right">
									First Name
								</Label>
								<Input
									id="firstName"
									required
									value={formData.firstName}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											firstName: e.target.value,
										}))
									}
									className="sm:col-span-3"
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
								<Label htmlFor="lastName" className="text-left sm:text-right">
									Last Name
								</Label>
								<Input
									id="lastName"
									required
									value={formData.lastName}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											lastName: e.target.value,
										}))
									}
									className="sm:col-span-3"
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
								<Label htmlFor="email" className="text-left sm:text-right">
									Email
								</Label>
								<Input
									id="email"
									type="email"
									required
									value={formData.email}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											email: e.target.value,
										}))
									}
									className="sm:col-span-3"
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
								<Label htmlFor="phone" className="text-left sm:text-right">
									Phone
								</Label>
								<Input
									id="phone"
									value={formData.phone}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											phone: e.target.value,
										}))
									}
									className="sm:col-span-3"
								/>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
								<Label htmlFor="status" className="text-left sm:text-right">
									Status
								</Label>
								<Select
									value={formData.status}
									onValueChange={(v) =>
										setFormData((prev) => ({ ...prev, status: v }))
									}
								>
									<SelectTrigger className="sm:col-span-3">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="New">New</SelectItem>
										<SelectItem value="Contacted">Contacted</SelectItem>
										<SelectItem value="Interested">Interested</SelectItem>
										<SelectItem value="Closed">Closed</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
								<Label htmlFor="source" className="text-left sm:text-right">
									Source
								</Label>
								<Select
									value={formData.source}
									onValueChange={(v) =>
										setFormData((prev) => ({ ...prev, source: v }))
									}
								>
									<SelectTrigger className="sm:col-span-3">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="General">General</SelectItem>
										<SelectItem value="Signup">Signup</SelectItem>
										<SelectItem value="Contact_Form">Contact Form</SelectItem>
										<SelectItem value="Tour_Request">Tour Request</SelectItem>
										<SelectItem value="Home_Valuation">Home Valuation</SelectItem>
										<SelectItem value="Other">Other</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
								<Label className="text-left sm:text-right">Tags</Label>
								<div className="sm:col-span-3">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="outline" className="w-full justify-start text-left font-normal h-auto py-2 whitespace-normal min-h-10">
												{formData.tags.length > 0 
													? formData.tags.join(", ") 
													: "Select tags..."}
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent className="w-[85vw] sm:w-[325px]">
											{TAG_OPTIONS.map((tag) => {
												const isSelected = formData.tags.includes(tag);
												return (
													<DropdownMenuCheckboxItem
														key={tag}
														checked={isSelected}
														onCheckedChange={(checked) => {
															setFormData((prev) => ({
																...prev,
																tags: checked
																	? [...prev.tags, tag]
																	: prev.tags.filter((t) => t !== tag),
															}));
														}}
													>
														{tag}
													</DropdownMenuCheckboxItem>
												);
											})}
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2 sm:gap-4">
								<Label htmlFor="lastContactedAt" className="text-left sm:text-right">
									Last Contact
								</Label>
								<Input
									id="lastContactedAt"
									type="date"
									value={formData.lastContactedAt}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											lastContactedAt: e.target.value,
										}))
									}
									className="col-span-3"
								/>
							</div>
						</div>
						<DialogFooter>
							<Button type="submit">Create Lead</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* QUICK VIEW MODAL */}
			<Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
				<DialogContent className="sm:max-w-[560px] w-[95vw] rounded-xl">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold">
							{viewLead?.firstName} {viewLead?.lastName}
						</DialogTitle>
						<DialogDescription>Lead Details</DialogDescription>
					</DialogHeader>

					{viewLead && (
						<div className="space-y-4 py-2">
							{/* Contact Info */}
							<div className="grid grid-cols-2 gap-3">
								<div className="bg-muted/40 rounded-lg p-3 space-y-1">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Email</p>
									<p className="text-sm font-medium break-all">{viewLead.email || "—"}</p>
								</div>
								<div className="bg-muted/40 rounded-lg p-3 space-y-1">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Phone</p>
									<p className="text-sm font-medium">{viewLead.phone || "—"}</p>
								</div>
								<div className="bg-muted/40 rounded-lg p-3 space-y-1">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Status</p>
									<Badge className={getStatusColor(viewLead.status)}>{viewLead.status || "—"}</Badge>
								</div>
								<div className="bg-muted/40 rounded-lg p-3 space-y-1">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Source</p>
									<Badge className={getSourceColor(viewLead.source || "")}>{viewLead.source?.replaceAll("_", " ") || "—"}</Badge>
								</div>
								<div className="bg-muted/40 rounded-lg p-3 space-y-1">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Score</p>
									<Badge className={getScoreColor(viewLead.scoreLabel)}>
										{viewLead.scoreLabel || "Cold"} ({viewLead.score || 0} pts)
									</Badge>
								</div>
								<div className="bg-muted/40 rounded-lg p-3 space-y-1">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Last Contact</p>
									<p className="text-sm font-medium">
										{viewLead.lastContactedAt
											? new Date(viewLead.lastContactedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
											: new Date(viewLead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
									</p>
								</div>
							</div>

							{/* Tags */}
							{viewLead.tags && viewLead.tags.length > 0 && (
								<div className="bg-muted/40 rounded-lg p-3 space-y-2">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Tags</p>
									<div className="flex flex-wrap gap-1.5">
										{viewLead.tags.map((tag, i) => (
											<Badge key={i} className="text-xs bg-[#d90429]/10 text-[#d90429] border-0">{String(tag)}</Badge>
										))}
									</div>
								</div>
							)}

							{/* Created At */}
							<div className="bg-muted/40 rounded-lg p-3 space-y-1">
								<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Created At</p>
								<p className="text-sm font-medium">{new Date(viewLead.createdAt).toLocaleString()}</p>
							</div>
						</div>
					)}

					{loadingFullViewLead && (
						<div className="text-center text-sm text-muted-foreground py-4 flex items-center justify-center gap-2">
							<div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
							Loading full details...
						</div>
					)}

					{fullViewLead && (
						<div className="space-y-4 pt-2 border-t mt-2 max-h-[35vh] overflow-y-auto pr-2">
							{/* Notes */}
							{fullViewLead.notes?.length > 0 && (
								<div className="space-y-2">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Notes</p>
									{fullViewLead.notes.map((note: any) => (
										<div key={note._id} className="bg-muted/30 p-2.5 rounded-lg border border-border/50 text-sm">
											<p className="whitespace-pre-wrap text-xs">{note.content}</p>
											<p className="text-[10px] text-muted-foreground mt-1">{new Date(note.createdAt).toLocaleString()}</p>
										</div>
									))}
								</div>
							)}

							{/* Inquiry History */}
							{fullViewLead.inquiryHistory?.length > 0 && (
								<div className="space-y-2">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Inquiries</p>
									{fullViewLead.inquiryHistory.map((inq: any) => (
										<div key={inq._id} className="bg-muted/30 p-2.5 rounded-lg border border-border/50 text-sm">
											<Badge variant="outline" className="mb-1 text-[10px] uppercase">{String(inq.type).replaceAll("_", " ")}</Badge>
											{inq.message && <p className="whitespace-pre-wrap mt-1 text-xs">{inq.message}</p>}
											<p className="text-[10px] text-muted-foreground mt-1">{new Date(inq.createdAt).toLocaleString()}</p>
										</div>
									))}
								</div>
							)}

							{/* AI Chats */}
							{fullViewLead.aiChats?.length > 0 && (
								<div className="space-y-2">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">AI Chats</p>
									{fullViewLead.aiChats.map((chat: any) => (
										<div key={chat.id || chat._id} className="bg-muted/30 p-2.5 rounded-lg border border-border/50 text-sm">
											<Badge variant="outline" className="mb-1 text-[10px] uppercase">{chat.role}</Badge>
											<p className="whitespace-pre-wrap mt-1 text-xs">{chat.message}</p>
											<p className="text-[10px] text-muted-foreground mt-1">{new Date(chat.createdAt).toLocaleString()}</p>
										</div>
									))}
								</div>
							)}
							
							{/* Tasks */}
							{fullViewLead.tasks?.length > 0 && (
								<div className="space-y-2">
									<p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Tasks</p>
									{fullViewLead.tasks.map((task: any) => (
										<div key={task.id || task._id} className="bg-muted/30 p-2.5 rounded-lg border border-border/50 text-sm flex justify-between items-center">
											<div>
												<p className="font-medium text-xs">{task.title}</p>
												{task.dueDate && <p className="text-[10px] text-muted-foreground mt-0.5">Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
											</div>
											<Badge variant={task.status === "completed" ? "default" : "secondary"} className="text-[10px]">
												{task.status}
											</Badge>
										</div>
									))}
								</div>
							)}
						</div>
					)}

					<DialogFooter className="gap-2 flex-col sm:flex-row mt-4">
						<Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
						<Button asChild className="w-full sm:w-auto" onClick={() => setIsViewOpen(false)}>
							<Link href={`/admin/leads/${viewLead?.id || viewLead?._id}`}>Open Full Profile →</Link>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
