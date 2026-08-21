"use client";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";

interface CommunicationLog {
	id: string;
	type: string;
	to: string;
	subject: string | null;
	status: string;
	createdAt: string;
	updatedAt: string;
}

export default function CommunicationLogsPage() {
	const [logs, setLogs] = useState<CommunicationLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [activeTab, setActiveTab] = useState("all"); // "all", "email", "sms"

	const fetchLogs = async () => {
		try {
			setLoading(true);
			const res = await axios.get("/api/admin/communication-logs");
			if (res.data && res.data.logs) {
				setLogs(res.data.logs);
			}
		} catch (error: any) {
			console.error("Error fetching logs:", error);
			toast.error("Failed to load communication logs");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLogs();
		
		// Refresh logs periodically
		const interval = setInterval(fetchLogs, 30000);
		return () => clearInterval(interval);
	}, []);

	// Search Filter
	const filteredLogs = logs.filter((log) => {
		const matchesTab = activeTab === "all" || log.type?.toLowerCase() === activeTab;
		const term = searchTerm.toLowerCase();
		const matchesSearch = log.to?.toLowerCase().includes(term) ||
			log.subject?.toLowerCase().includes(term) ||
			log.status?.toLowerCase().includes(term) ||
			log.type?.toLowerCase().includes(term);
		
		return matchesTab && matchesSearch;
	});

	const getStatusColor = (status: string) => {
		switch (status.toLowerCase()) {
			case "delivered":
			case "opened":
			case "clicked":
				return "bg-green-100 text-green-800 border-green-200";
			case "failed":
			case "bounced":
			case "undelivered":
				return "bg-red-100 text-red-800 border-red-200";
			default:
				return "bg-gray-100 text-gray-800 border-gray-200";
		}
	};

	return (
		<div className="space-y-6 px-4 my-5">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Communication Logs</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Track the delivery and open status of all system emails and SMS messages.
					</p>
				</div>
			</div>

			{/* Tabs & Search */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
				<div className="flex bg-muted p-1 rounded-md">
					<button
						onClick={() => setActiveTab("all")}
						className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all ${
							activeTab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
						}`}
					>
						All Logs
					</button>
					<button
						onClick={() => setActiveTab("email")}
						className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all flex items-center gap-2 ${
							activeTab === "email" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
						}`}
					>
						<Mail className="h-3.5 w-3.5" /> Emails
					</button>
					<button
						onClick={() => setActiveTab("sms")}
						className={`px-4 py-1.5 text-sm font-medium rounded-sm transition-all flex items-center gap-2 ${
							activeTab === "sms" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
						}`}
					>
						<MessageSquare className="h-3.5 w-3.5" /> SMS
					</button>
				</div>

				<div className="relative w-full max-w-sm">
					<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						type="search"
						placeholder="Search by email, subject or status..."
						className="pl-8 w-full"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Type</TableHead>
							<TableHead>Recipient</TableHead>
							<TableHead>Subject</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Sent At</TableHead>
							<TableHead>Last Updated</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading && logs.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
									Loading logs...
								</TableCell>
							</TableRow>
						) : filteredLogs.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
									No logs found.
								</TableCell>
							</TableRow>
						) : (
							filteredLogs.map((log) => (
								<TableRow key={log.id}>
									<TableCell>
										<div className="flex items-center gap-2 font-medium">
											{log.type.toLowerCase() === "email" ? (
												<Mail className="h-4 w-4 text-blue-500" />
											) : (
												<MessageSquare className="h-4 w-4 text-emerald-500" />
											)}
											{log.type}
										</div>
									</TableCell>
									<TableCell className="font-medium">{log.to}</TableCell>
									<TableCell className="max-w-[200px] truncate" title={log.subject || ""}>
										{log.subject || <span className="text-muted-foreground italic">N/A</span>}
									</TableCell>
									<TableCell>
										<Badge variant="outline" className={getStatusColor(log.status)}>
											{log.status.toUpperCase()}
										</Badge>
									</TableCell>
									<TableCell className="text-muted-foreground whitespace-nowrap">
										{format(new Date(log.createdAt), "MMM d, yyyy h:mm a")}
									</TableCell>
									<TableCell className="text-muted-foreground whitespace-nowrap">
										{format(new Date(log.updatedAt), "MMM d, yyyy h:mm a")}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
