"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Bot, User, Clock, Smartphone, Mail, Globe, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AiChatUI({ groupedChats, leadIds }: { groupedChats: any, leadIds: string[] }) {
	const searchParams = useSearchParams();
	const initialChannel = searchParams.get("channel") as any || "all";
	
	const [selectedLeadId, setSelectedLeadId] = useState<string | null>(leadIds[0] || null);
	const [filter, setFilter] = useState<'all' | 'website' | 'sms' | 'email'>(initialChannel);

	// Sync sidebar clicks (URL changes) to the local filter state
	useEffect(() => {
		const channel = searchParams.get("channel");
		if (channel) {
			setFilter(channel as any);
		}
	}, [searchParams]);
	const [searchTerm, setSearchTerm] = useState("");

	const filteredLeadIds = leadIds.filter((leadId) => {
		const thread = groupedChats[leadId];
		const lead = thread.lead;
		const name = `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase();
		const email = (lead.email || "").toLowerCase();
		const phone = (lead.phone || "").toLowerCase();
		const term = searchTerm.toLowerCase();
		
		const matchesSearch = name.includes(term) || email.includes(term) || phone.includes(term);
		if (!matchesSearch) return false;

		// Filter leads by channel
		// Removed: We want ALL users to show up in the sidebar on every tab (Emails, SMS, Chat) 
		// so it acts like a full WhatsApp contact list.
		// The actual chat messages in the right pane are already filtered by channel below.

		return true;
	});

	// Auto-select the first lead if the current selection is hidden by the filter
	useEffect(() => {
		if (selectedLeadId && !filteredLeadIds.includes(selectedLeadId)) {
			setSelectedLeadId(filteredLeadIds.length > 0 ? filteredLeadIds[0] : null);
		} else if (!selectedLeadId && filteredLeadIds.length > 0) {
			setSelectedLeadId(filteredLeadIds[0]);
		}
	}, [filteredLeadIds, selectedLeadId]);

	const selectedThread = selectedLeadId ? groupedChats[selectedLeadId] : null;
	const messages = selectedThread ? [...selectedThread.messages].reverse() : [];
	
	const filteredMessages = messages.filter((c: any) => {
		// Apply channel filter
		if (filter !== 'all') {
			return c.channel === filter;
		}
		return true;
	});

	const channelIcon = (channel: string) => {
		if (channel === 'sms') return <Smartphone className="w-4 h-4 text-blue-500" />;
		if (channel === 'email') return <Mail className="w-4 h-4 text-orange-500" />;
		return <Globe className="w-4 h-4 text-primary" />;
	};

	let pageTitle = "AI Conversations";
	let pageDesc = "Manage and monitor all AI interactions.";
	if (filter === 'website') {
		pageTitle = "AI Chatbot";
		pageDesc = "Manage all website AI Chatbot conversations.";
	} else if (filter === 'sms') {
		pageTitle = "AI SMS";
		pageDesc = "Manage all AI SMS text conversations.";
	} else if (filter === 'email') {
		pageTitle = "AI Emails";
		pageDesc = "Manage all AI Email thread conversations.";
	}

	return (
		<div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50/50 rounded-xl overflow-hidden border border-border/60 shadow-sm">
			{/* Top Header */}
			<div className="bg-white border-b border-border/50 px-6 py-4 flex items-center gap-3 shrink-0">
				<div className="bg-primary/10 p-2 rounded-lg">
					{filter === 'sms' ? <Smartphone className="w-5 h-5 text-green-600" /> : filter === 'email' ? <Mail className="w-5 h-5 text-orange-600" /> : <Bot className="w-5 h-5 text-primary" />}
				</div>
				<div>
					<h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
					<p className="text-sm text-muted-foreground">{pageDesc}</p>
				</div>
			</div>

			{/* Main WhatsApp-like Layout */}
			<div className="flex flex-1 overflow-hidden">
				
				{/* Left Pane: Contacts List */}
				<div className={`w-full md:w-[350px] lg:w-[400px] border-r border-border/50 bg-white flex flex-col shrink-0 ${selectedLeadId ? 'hidden md:flex' : 'flex'}`}>
					<div className="p-4 border-b border-border/50">
						<div className="relative">
							<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
							<Input 
								placeholder="Search users..." 
								className="pl-9 bg-gray-50/80 border-transparent focus-visible:ring-primary/20"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
							/>
						</div>
					</div>
					
					<div className="flex-1 overflow-y-auto">
						{filteredLeadIds.length === 0 ? (
							<div className="p-8 text-center text-muted-foreground text-sm">
								No conversations found.
							</div>
						) : (
							filteredLeadIds.map((leadId) => {
								const thread = groupedChats[leadId];
								const lead = thread.lead;
								const latestMessage = thread.messages[0]; // because order is desc
								const isSelected = selectedLeadId === leadId;

								return (
									<div 
										key={leadId}
										onClick={() => setSelectedLeadId(leadId)}
										className={`p-4 border-b border-border/30 cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-primary/5' : ''}`}
									>
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
												<User className="w-5 h-5 text-gray-500" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex justify-between items-baseline mb-0.5">
													<h3 className="font-semibold text-gray-900 truncate">
														{lead.firstName ? `${lead.firstName} ${lead.lastName || ""}` : (lead.email || lead.phone || "Unknown User")}
													</h3>
													<span suppressHydrationWarning className="text-[10px] text-gray-400 shrink-0 ml-2">
														{latestMessage ? new Date(latestMessage.createdAt).toLocaleDateString() : "No messages"}
													</span>
												</div>
												<p className="text-xs text-gray-500 truncate flex items-center gap-1">
													{latestMessage ? (
														<>
															{latestMessage.role === 'ai' ? <Bot className="w-3 h-3 text-primary" /> : channelIcon(latestMessage.channel)}
															<span className="truncate">{latestMessage.message}</span>
														</>
													) : (
														<span className="truncate italic">No chat history yet...</span>
													)}
												</p>
											</div>
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Right Pane: Chat Window */}
				<div className={`flex-1 flex flex-col bg-[#F9FAFB] relative ${!selectedLeadId ? 'hidden md:flex' : 'flex'}`}>
					{selectedThread ? (
						<>
							{/* Chat Header with Tabs */}
							<div className="bg-white border-b border-border/50 shrink-0 flex flex-col">
								{/* Header Top Row */}
								<div className="px-6 py-4 flex justify-between items-center">
									<div className="flex items-center gap-3">
										<button 
											className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900"
											onClick={() => setSelectedLeadId(null)}
										>
											<ArrowLeft className="w-5 h-5" />
										</button>
										<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 hidden md:flex">
											<User className="w-5 h-5 text-primary" />
										</div>
										<div>
											<h2 className="font-bold text-gray-900 text-lg">
												{selectedThread.lead.firstName ? `${selectedThread.lead.firstName} ${selectedThread.lead.lastName || ""}` : (selectedThread.lead.email || selectedThread.lead.phone)}
											</h2>
											<div className="flex gap-2 text-xs text-gray-500 mt-0.5">
												{selectedThread.lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3"/> {selectedThread.lead.email}</span>}
												{selectedThread.lead.phone && <span className="flex items-center gap-1 ml-2"><Smartphone className="w-3 h-3"/> {selectedThread.lead.phone}</span>}
											</div>
										</div>
									</div>
									<Link 
										href={`/admin/leads/${selectedLeadId}`}
										className="text-xs bg-primary/10 text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-full transition-colors font-semibold shadow-sm"
									>
										View Profile
									</Link>
								</div>
								
							</div>

							{/* Conditional Rendering based on Filter */}
							{filter === 'email' ? (
								<div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
									{filteredMessages.map((chat: any) => {
										const isAi = chat.role === 'ai';
										return (
											<div key={chat.id} className="bg-white border border-border/60 shadow-sm rounded-lg overflow-hidden">
												<div className="bg-gray-50/80 px-4 py-3 border-b border-border/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
													<div className="flex items-start gap-3">
														<div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isAi ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
															{isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
														</div>
														<div className="text-sm">
															<div className="font-semibold text-gray-900">
																{isAi ? 'Gulfshore Group AI' : (selectedThread.lead.firstName ? `${selectedThread.lead.firstName} ${selectedThread.lead.lastName || ""}` : 'User')}
															</div>
															<div className="text-gray-500 text-xs">
																<span className="font-medium">From:</span> {isAi ? 'noreply@updates.gulfshoregroup.com' : (selectedThread.lead.email || 'unknown@user.com')}
															</div>
															<div className="text-gray-500 text-xs mt-0.5">
																<span className="font-medium">To:</span> {!isAi ? 'Gulfshore Group' : (selectedThread.lead.email || 'unknown@user.com')}
															</div>
														</div>
													</div>
													<div className="text-xs text-gray-400 font-medium whitespace-nowrap self-start sm:self-auto">
														{new Date(chat.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
													</div>
												</div>
												<div className="p-5 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
													{chat.message && chat.message.trim().length > 0 ? chat.message : <span className="text-gray-400 italic">No text provided</span>}
												</div>
											</div>
										);
									})}
									{filteredMessages.length === 0 && (
										<div className="text-center text-gray-400 py-10 italic">
											No email history found for this user.
										</div>
									)}
								</div>
							) : (
								<div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center bg-fixed bg-no-repeat bg-opacity-20 relative">
									{/* Subtle overlay to make text readable over the background pattern */}
									<div className="absolute inset-0 bg-white/80 backdrop-blur-sm pointer-events-none"></div>

									<div className="relative z-10 space-y-6">
										<div className="text-center">
											<span className="bg-white/80 backdrop-blur-sm text-xs font-semibold text-gray-500 px-3 py-1 rounded-full shadow-sm border border-gray-100">
												Conversation Started
											</span>
										</div>
										
										{filteredMessages.map((chat: any) => (
											<div key={chat.id} className={`flex flex-col ${chat.role === 'ai' ? 'items-end' : 'items-start'}`}>
												<div className="flex items-center gap-1.5 mb-1 px-1">
													{chat.role === 'user' ? (
														<>
															<span className="text-[10px] font-bold text-gray-500 uppercase">User</span>
															{channelIcon(chat.channel)}
														</>
													) : (
														<>
															<Bot className="w-3.5 h-3.5 text-primary" />
															<span className="text-[10px] font-bold text-primary uppercase">AI Concierge</span>
														</>
													)}
												</div>
												<div 
													className={`max-w-[75%] text-sm p-4 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed relative ${
														chat.role === 'ai' 
														? 'bg-primary text-white rounded-tr-sm border border-primary/10' 
														: 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
													}`}
												>
													{chat.message && chat.message.trim().length > 0 ? chat.message : <span className="text-gray-400 italic">No text provided</span>}
												</div>
												<span suppressHydrationWarning className="text-[10px] text-gray-400 mt-1.5 px-2 font-medium">
													{new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												</span>
											</div>
										))}
									</div>
								</div>
							)}
						</>
					) : (
						<div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
							<div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
								<Bot className="w-10 h-10 text-gray-300" />
							</div>
							<p className="text-lg font-medium text-gray-500">Select a conversation</p>
							<p className="text-sm">Choose a user from the left panel to view their AI chat history.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
