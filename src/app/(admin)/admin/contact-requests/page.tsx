"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Search,
	Plus,
	Phone,
	Mail,
	MessageCircle,
	Code,
	Code2,
} from "lucide-react";
import Link from "next/link";
import { IContactRequest } from "@/models/contact";

const statusOptions = [
	{
		value: "New Request",
		label: "New",
		color: "bg-blue-100 text-blue-800",
	},
	{
		value: "Email Sent",
		label: "Email Sent",
		color: "bg-yellow-100 text-yellow-800",
	},
	{
		value: "Interested",
		label: "Interested",
		color: "bg-green-100 text-green-400",
	},
	{
		value: "Closed",
		label: "Closed",
		color: "bg-green-100 text-green-900",
	},
];

const getRefLink = (ref: string) => {
	if (!ref || ref === "null" || ref === "N/A") return "#";
	if (ref.startsWith("http://") || ref.startsWith("https://")) return ref;
	const cleanRef = ref.startsWith("/") ? ref : `/${ref}`;
	// In local dev, use relative paths so they resolve on localhost, in prod they resolve on main domain
	return cleanRef;
};

export default function ContactRequestsPage() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [contactReq, setContactReq] = useState<IContactRequest[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all"); // default to show all
	const [selectedRequest, setSelectedRequest] = useState<IContactRequest | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	// Fetch contact requests
	useEffect(() => {
		const fetchContactRequests = async () => {
			try {
				const res = await fetch("/api/contact"); // use your real API route
				if (!res.ok)
					throw new Error("Failed to fetch contact requests");
				const json = await res.json();

				setContactReq(json.data.requests || []);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};
		fetchContactRequests();
	}, []);

	const filteredRequest = contactReq.filter((request) => {
		const matchesSearch =
			request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			request.email
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			request.phone?.includes(searchTerm);

		const matchesStatus =
			statusFilter === "all" || request.status === statusFilter;

		return matchesSearch && matchesStatus;
	});

	const getStatusColor = (status: string) => {
		return (
			statusOptions.find((s) => s.value === status)?.color ||
			"bg-gray-100 text-gray-800"
		);
	};

	if (loading)
		return (
			<div className="p-6 text-center font-bold text-muted-foreground">
				Loading requests...
			</div>
		);
	if (error)
		return (
			<div className="p-6 text-center text-red-500">
				Error: {error}
			</div>
		);
	if (!contactReq.length)
		return (
			<div className="p-6 text-center font-bold text-muted-foreground">
				No requests available.
			</div>
		);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						Contact Requests
					</h1>
					<p className="text-muted-foreground mt-2">
						Manage and track all real estate requests
					</p>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
				<Card>
					<CardContent className="pt-6 text-center">
						<div className="text-3xl font-bold text-foreground">
							{contactReq.length}
						</div>
						<p className="text-sm text-muted-foreground mt-1">
							Total Requests
						</p>
					</CardContent>
				</Card>
				{statusOptions.map((status) => (
					<Card key={status.value}>
						<CardContent className="pt-6 text-center">
							<div
								className={`text-3xl font-bold ${
									status.color.split(" ")[1]
								}`}>
								{
									contactReq.filter((r) => r.status === status.value)
										.length
								}
							</div>
							<p className="text-sm text-muted-foreground mt-1">
								{status.label}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Table */}
			<Card>
				<CardHeader>
					<CardTitle>All Requests</CardTitle>
					<CardDescription>
						Search and filter requests by status and contact
						information
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* Filters */}
						<div className="flex gap-4 flex-col md:flex-row">
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
								onValueChange={setStatusFilter}>
								<SelectTrigger className="w-full md:w-48">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Statuses</SelectItem>
									{statusOptions.map((status) => (
										<SelectItem
											key={status.value}
											value={status.value}>
											{status.label}
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
										<th className="text-left py-3 px-4 font-semibold text-foreground">
											Name
										</th>
										<th className="text-left py-3 px-4 font-semibold text-foreground">
											Contact
										</th>
										<th className="text-left py-3 px-4 font-semibold text-foreground">
											Status
										</th>
										<th className="text-left py-3 px-4 font-semibold text-foreground">
											Message
										</th>
										<th className="text-left py-3 px-4 font-semibold text-foreground">
											Reference
										</th>
										<th className="text-left py-3 px-4 font-semibold text-foreground">
											Ref Type
										</th>
										<th className="text-left py-3 px-4 font-semibold text-foreground">
											Action
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredRequest.map((request, i) => (
										<tr
											key={i}
											className="border-b border-border hover:bg-muted/50 transition-colors">
											<td className="py-3 px-4 font-medium text-foreground">
												{request.name}
											</td>
											<td className="py-3 px-4 space-y-1">
												<div className="flex items-center gap-2 text-muted-foreground">
													<Mail className="h-3 w-3" />
													<span className="text-xs">
														{request.email}
													</span>
												</div>
												<div className="flex items-center gap-2 text-muted-foreground">
													<Phone className="h-3 w-3" />
													<span className="text-xs">
														{request.phone}
													</span>
												</div>
											</td>
											<td className="py-3 px-4">
												<Badge
													className={getStatusColor(
														request.status || ""
													)}>
													{
														statusOptions.find(
															(s) => s.value === request.status
														)?.label
													}
												</Badge>
											</td>
											<td className="py-3 px-4 ">
												{request.message || "N/A"}
											</td>
											<td className="py-3 px-4">
												{request.refType?.toLowerCase().includes("valuation") || request.refType?.toLowerCase().includes("seller") || request.message?.includes("Home Valuation") ? (
													<Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-semibold px-2 py-0.5 text-xs inline-flex items-center gap-1">
														🏠 Seller (Valuation)
													</Badge>
												) : request.refType?.toLowerCase().includes("tour") || request.message?.includes("Tour") ? (
													<Badge className="bg-blue-100 text-blue-900 border border-blue-300 font-semibold px-2 py-0.5 text-xs inline-flex items-center gap-1">
														🛒 Buyer (Tour)
													</Badge>
												) : (
													<Badge className="bg-purple-100 text-purple-900 border border-purple-300 font-semibold px-2 py-0.5 text-xs inline-flex items-center gap-1">
														💬 Buyer (Inquiry)
													</Badge>
												)}
											</td>

											<td className="py-3 px-4 ">
												{!request.ref || request.ref === "null" || request.ref === "N/A" ? (
													""
												) : (
													<a 
														href={getRefLink(request.ref)} 
														target="_blank" 
														rel="noreferrer"
														className="text-blue-600 hover:underline"
													>
														{request.ref === "/" ? "Home" : "Property"}
													</a>
												)}
											</td>
											<td className="py-3 px-4 ">
												{!request.ref || request.ref === "null" || request.ref === "N/A"
													? ""
													: request.refType || "Link"}
											</td>
											<td className="py-3 px-4">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														setSelectedRequest(request);
														setDialogOpen(true);
													}}>
													View
												</Button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>

						{filteredRequest.length === 0 && (
							<div className="text-center py-8">
								<p className="text-muted-foreground">
									No requests found matching your criteria
								</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-md bg-white text-gray-900 border border-gray-200 shadow-lg rounded-xl z-[99999]">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold">Contact Request Details</DialogTitle>
						<DialogDescription>
							Submitted on {selectedRequest ? new Date(selectedRequest.createdAt).toLocaleString() : ""}
						</DialogDescription>
					</DialogHeader>
					{selectedRequest && (
						<div className="space-y-4 py-2">
							{/* Target Property To Sell (For Sellers) */}
							{selectedRequest.refType === "Home_Valuation" && (
								<div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-1.5">
									<span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
										🏠 Target Property To Sell (Home Valuation)
									</span>
									<p className="text-base font-bold text-gray-900">
										{selectedRequest.ref && selectedRequest.ref !== "null" ? selectedRequest.ref : "Address Provided In Message"}
									</p>
								</div>
							)}

							<div>
								<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
									{selectedRequest.refType === "Home_Valuation" ? "Seller Name" : "Customer Name"}
								</span>
								<p className="text-sm font-semibold text-gray-900 mt-0.5">{selectedRequest.name}</p>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</span>
									<a href={`mailto:${selectedRequest.email}`} className="text-sm font-semibold text-blue-600 hover:underline mt-0.5 block break-all">
										{selectedRequest.email}
									</a>
								</div>
								<div>
									<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</span>
									<a href={`tel:${selectedRequest.phone}`} className="text-sm font-semibold text-gray-900 mt-0.5 block">
										{selectedRequest.phone || "N/A"}
									</a>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</span>
									<div className="mt-1">
										<Badge className={getStatusColor(selectedRequest.status || "")}>
											{statusOptions.find((s) => s.value === selectedRequest.status)?.label || selectedRequest.status}
										</Badge>
									</div>
								</div>
								<div>
									<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Request Type</span>
									<div className="mt-1">
										{selectedRequest.refType === "Home_Valuation" ? (
											<Badge className="bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs">
												🏠 Seller (Home Valuation)
											</Badge>
										) : (
											<Badge variant="outline" className="text-xs font-semibold">
												{selectedRequest.refType || "Contact Form"}
											</Badge>
										)}
									</div>
								</div>
							</div>
							<div>
								<span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
									{selectedRequest.refType === "Home_Valuation" ? "Valuation Details & Property Specs" : "Message / Inquiry"}
								</span>
								<p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200 mt-1 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto font-mono text-xs">
									{selectedRequest.message || "No additional message provided."}
								</p>
							</div>
						</div>
					)}

					<DialogFooter>
						<Button onClick={() => setDialogOpen(false)}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
