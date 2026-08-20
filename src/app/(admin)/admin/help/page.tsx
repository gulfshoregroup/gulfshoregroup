"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	HelpCircle,
	BookOpen,
	MessageCircle,
	Phone,
	Mail,
	ChevronDown,
	ChevronUp,
	Plus,
	Pencil,
	Trash2,
	CheckCircle2,
	AlertCircle,
	Globe,
} from "lucide-react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const adminFaqs = [
	{
		q: "How do I add a new property listing?",
		a: "Go to Properties List from the sidebar and use the MLS sync automation to import new listings automatically.",
	},
	{
		q: "How do I manage leads?",
		a: "Navigate to Leads from the sidebar. You can view, filter, add notes, and update statuses of all leads.",
	},
	{
		q: "How does the MLS Data Sync work?",
		a: "The MLS sync runs every 4 hours automatically and pulls new property listings from your configured MLS feed into the database.",
	},
	{
		q: "How to edit city or community information?",
		a: "Go to Properties → Cities or Communities. Click the edit icon on any entry to update images, descriptions, and featured status.",
	},
	{
		q: "How do I create a blog post?",
		a: "Navigate to Blogs from the sidebar and click 'Create Blog' to write and publish new articles.",
	},
	{
		q: "How to view scheduled tours?",
		a: "Go to Users → Tours to see all scheduled property visits with contact information and status.",
	},
];

export default function HelpPage() {
	const [openFaq, setOpenFaq] = useState<number | null>(null);
	const [search, setSearch] = useState("");

	// Website FAQs Manager state
	const [websiteFaqs, setWebsiteFaqs] = useState<any[]>([]);
	const [loadingFaqs, setLoadingFaqs] = useState(true);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [questionInput, setQuestionInput] = useState("");
	const [answerInput, setAnswerInput] = useState("");
	const [orderInput, setOrderInput] = useState("0");
	const [isActiveInput, setIsActiveInput] = useState(true);
	const [submitting, setSubmitting] = useState(false);

	const filteredAdminFaqs = adminFaqs.filter(
		(f) =>
			f.q.toLowerCase().includes(search.toLowerCase()) ||
			f.a.toLowerCase().includes(search.toLowerCase())
	);

	const fetchWebsiteFaqs = async () => {
		setLoadingFaqs(true);
		try {
			const res = await fetch("/api/v2/faqs?category=City");
			const json = await res.json();
			if (json.success && Array.isArray(json.data)) {
				setWebsiteFaqs(json.data);
			}
		} catch (error) {
			console.error("Error fetching website FAQs:", error);
		} finally {
			setLoadingFaqs(false);
		}
	};

	useEffect(() => {
		fetchWebsiteFaqs();
	}, []);

	const handleOpenDialog = (faq?: any) => {
		if (faq) {
			setEditingId(faq.id);
			setQuestionInput(faq.question);
			setAnswerInput(faq.answer);
			setOrderInput(String(faq.order ?? 0));
			setIsActiveInput(faq.isActive ?? true);
		} else {
			setEditingId(null);
			setQuestionInput("");
			setAnswerInput("");
			setOrderInput(String(websiteFaqs.length + 1));
			setIsActiveInput(true);
		}
		setIsDialogOpen(true);
	};

	const handleSaveFaq = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!questionInput.trim() || !answerInput.trim()) return;

		setSubmitting(true);
		try {
			const payload = {
				question: questionInput.trim(),
				answer: answerInput.trim(),
				category: "City",
				order: parseInt(orderInput) || 0,
				isActive: isActiveInput,
			};

			const url = editingId ? `/api/v2/faqs/${editingId}` : "/api/v2/faqs";
			const method = editingId ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await res.json();
			if (data.success) {
				setIsDialogOpen(false);
				toast.success(editingId ? "FAQ updated successfully!" : "FAQ created successfully!");
				fetchWebsiteFaqs();
			} else {
				toast.error(data.error || "Failed to save FAQ");
			}
		} catch (error) {
			console.error("Save error:", error);
			toast.error("An error occurred while saving the FAQ");
		} finally {
			setSubmitting(false);
		}
	};

	const handleToggleActive = async (faq: any) => {
		try {
			const payload = { ...faq, isActive: !faq.isActive };
			const res = await fetch(`/api/v2/faqs/${faq.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (data.success) {
				toast.success(`FAQ ${!faq.isActive ? 'Published' : 'Unpublished'} successfully!`);
				fetchWebsiteFaqs();
			} else {
				toast.error(data.error || "Failed to update FAQ status");
			}
		} catch (error) {
			console.error("Update error:", error);
			toast.error("An error occurred while updating the FAQ status");
		}
	};

	const handleDeleteFaq = async (id: string) => {
		if (!confirm("Are you sure you want to delete this FAQ? It will be removed from all public pages.")) {
			return;
		}
		try {
			const res = await fetch(`/api/v2/faqs/${id}`, { method: "DELETE" });
			const data = await res.json();
			if (data.success) {
				toast.success("FAQ deleted successfully!");
				fetchWebsiteFaqs();
			} else {
				toast.error(data.error || "Failed to delete FAQ");
			}
		} catch (error) {
			console.error("Delete error:", error);
			toast.error("An error occurred while deleting the FAQ");
		}
	};

	return (
		<div className="space-y-6 px-4 my-5 max-w-6xl">
			<div className="flex items-center justify-between flex-wrap gap-4">
				<div className="flex items-center gap-3">
					<HelpCircle className="h-8 w-8 text-primary" />
					<div>
						<h1 className="text-3xl font-bold">Help & FAQ Management</h1>
						<p className="text-muted-foreground">
							Admin guide & public website FAQ controls
						</p>
					</div>
				</div>
			</div>

			<Tabs defaultValue="website" className="w-full">
				<TabsList className="grid w-full max-w-md grid-cols-2 h-11">
					<TabsTrigger value="website" className="flex items-center gap-2 font-medium">
						<Globe className="h-4 w-4 text-primary" />
						Website FAQs ({websiteFaqs.length})
					</TabsTrigger>
					<TabsTrigger value="admin" className="flex items-center gap-2 font-medium">
						<BookOpen className="h-4 w-4" />
						Admin Documentation
					</TabsTrigger>
				</TabsList>

				{/* TAB 1: WEBSITE FAQS MANAGER */}
				<TabsContent value="website" className="space-y-6 mt-6">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 border-b pb-6">
							<div>
								<CardTitle className="text-xl">Public Website FAQs</CardTitle>
								<CardDescription className="mt-1">
									Manage the real estate FAQs displayed on city landing pages (e.g., Naples, Marco Island). Use{" "}
									<code className="bg-muted px-1.5 py-0.5 rounded text-xs font-semibold text-primary">
										{"{displayCity}"}
									</code>{" "}
									in your text to automatically insert the dynamic city name!
								</CardDescription>
							</div>
							<button
								onClick={() => handleOpenDialog()}
								className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer shadow-sm"
							>
								<Plus className="h-4 w-4" /> Add New FAQ
							</button>
						</CardHeader>
						<CardContent className="pt-6">
							{loadingFaqs ? (
								<div className="text-center py-12 text-muted-foreground">Loading website FAQs...</div>
							) : websiteFaqs.length === 0 ? (
								<div className="text-center py-12 border rounded-lg bg-muted/20">
									<AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
									<p className="font-medium text-gray-800">No Website FAQs Found</p>
									<p className="text-sm text-muted-foreground mt-1">
										Click "Add New FAQ" above to create your first dynamic question.
									</p>
								</div>
							) : (
								<div className="rounded-md border">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Question</TableHead>
												<TableHead className="w-[100px]">Order</TableHead>
												<TableHead className="w-[120px]">Status</TableHead>
												<TableHead className="w-[150px]">Created At</TableHead>
												<TableHead className="w-[120px]">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{websiteFaqs.map((faq, index) => (
												<TableRow key={faq.id || index}>
													<TableCell>
														<div className="font-medium text-gray-900">{faq.question}</div>
														<div className="text-xs text-muted-foreground mt-1 max-w-[500px] truncate">
															{faq.answer}
														</div>
													</TableCell>
													<TableCell>
														<span className="text-sm bg-muted px-2 py-1 rounded">#{faq.order ?? index + 1}</span>
													</TableCell>
													<TableCell>
														<Badge
															variant={faq.isActive ? "default" : "secondary"}
															className="cursor-pointer"
															onClick={() => handleToggleActive(faq)}
															title="Click to toggle status"
														>
															{faq.isActive ? "Published" : "Draft"}
														</Badge>
													</TableCell>
													<TableCell>
														<div className="text-sm text-muted-foreground">
															{faq.createdAt ? new Date(faq.createdAt).toLocaleDateString() : "N/A"}
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2">
															<button
																onClick={() => handleOpenDialog(faq)}
																className="p-2 border rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
																title="Edit FAQ"
															>
																<Pencil className="h-4 w-4 text-blue-600" />
															</button>
															<button
																onClick={() => handleDeleteFaq(faq.id)}
																className="p-2 border rounded-md text-red-600 hover:bg-red-50 transition-colors"
																title="Delete FAQ"
															>
																<Trash2 className="h-4 w-4" />
															</button>
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
				</TabsContent>

				{/* TAB 2: ADMIN DOCUMENTATION */}
				<TabsContent value="admin" className="space-y-6 mt-6">
					{/* Search */}
					<div className="relative max-w-xl">
						<Input
							placeholder="Search admin help articles..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-4 h-12 text-base"
						/>
					</div>

					{/* Quick Links */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Card className="hover:shadow-md transition-shadow cursor-pointer">
							<CardHeader className="flex flex-row items-center gap-3">
								<BookOpen className="h-6 w-6 text-primary" />
								<CardTitle className="text-base">Documentation</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground">
								Read the full admin panel documentation and user guides.
							</CardContent>
						</Card>
						<Card className="hover:shadow-md transition-shadow cursor-pointer">
							<CardHeader className="flex flex-row items-center gap-3">
								<MessageCircle className="h-6 w-6 text-primary" />
								<CardTitle className="text-base">Live Chat</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground">
								Chat with our support team during business hours (9 AM – 6 PM EST).
							</CardContent>
						</Card>
						<Card className="hover:shadow-md transition-shadow cursor-pointer">
							<CardHeader className="flex flex-row items-center gap-3">
								<Phone className="h-6 w-6 text-primary" />
								<CardTitle className="text-base">Contact Support</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-muted-foreground flex items-center gap-1">
								<Mail className="h-3 w-3" />
								support@gulfshore.com
							</CardContent>
						</Card>
					</div>

					{/* FAQs */}
					<Card>
						<CardHeader>
							<CardTitle>Frequently Asked Questions (Admin Panel)</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							{filteredAdminFaqs.length === 0 ? (
								<p className="text-muted-foreground text-sm">No results found for "{search}"</p>
							) : (
								filteredAdminFaqs.map((faq, i) => (
									<div key={i} className="border rounded-lg overflow-hidden">
										<button
											onClick={() => setOpenFaq(openFaq === i ? null : i)}
											className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
										>
											<span className="font-medium text-sm">{faq.q}</span>
											{openFaq === i ? (
												<ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
											) : (
												<ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
											)}
										</button>
										{openFaq === i && (
											<div className="px-4 py-3 bg-muted/30 border-t text-sm text-muted-foreground">
												{faq.a}
											</div>
										)}
									</div>
								))
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* DIALOG FOR ADD / EDIT FAQ */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>{editingId ? "Edit Website FAQ" : "Add New Website FAQ"}</DialogTitle>
						<DialogDescription>
							This question and answer will appear on public city real estate pages. Tip: Use{" "}
							<code className="bg-muted px-1 py-0.5 rounded font-mono text-primary font-bold">
								{"{displayCity}"}
							</code>{" "}
							wherever you want the specific city name to dynamically show up.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSaveFaq} className="space-y-4 mt-2">
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-gray-700">Question</label>
							<Input
								required
								placeholder="e.g., Why are buyers choosing {displayCity} right now?"
								value={questionInput}
								onChange={(e) => setQuestionInput(e.target.value)}
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-gray-700">Answer</label>
							<textarea
								required
								rows={5}
								placeholder="e.g., {displayCity} offers premier coastal amenities, tax exemptions, and..."
								value={answerInput}
								onChange={(e) => setAnswerInput(e.target.value)}
								className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-sm font-medium text-gray-700">Display Order</label>
							<Input
								type="number"
								required
								value={orderInput}
								onChange={(e) => setOrderInput(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">Lower numbers appear first in the list.</p>
						</div>
						<div className="flex items-center gap-2 mt-2">
							<input
								type="checkbox"
								id="isActiveToggle"
								checked={isActiveInput}
								onChange={(e) => setIsActiveInput(e.target.checked)}
								className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
							/>
							<label htmlFor="isActiveToggle" className="text-sm font-medium text-gray-700">
								Published (Visible on website)
							</label>
						</div>
						<DialogFooter className="mt-6">
							<button
								type="button"
								onClick={() => setIsDialogOpen(false)}
								className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={submitting}
								className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
							>
								{submitting ? "Saving..." : editingId ? "Update FAQ" : "Create FAQ"}
							</button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
