"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { useState, useRef, useEffect } from "react";
import { X, MessageSquare, Send } from "lucide-react";

export default function AIChatWidget() {
	const [isOpen, setIsOpen] = useState(false);
	const [localInput, setLocalInput] = useState("");
	const [currentUrl, setCurrentUrl] = useState("");

	useEffect(() => {
		setCurrentUrl(window.location.href);
	}, []);

	const { messages, sendMessage, status } = useChat({
		transport: new DefaultChatTransport({ api: `/api/v2/ai/chat${currentUrl ? `?url=${encodeURIComponent(currentUrl)}` : ""}` }),
	});
	const isLoading = status === "submitted" || status === "streaming";
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Scroll to bottom on new message
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	// Scroll to bottom on new message
	useEffect(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages]);

	const handleSend = () => {
		if (localInput && localInput.trim() && !isLoading) {
			sendMessage({ role: 'user', parts: [{ type: 'text', text: localInput }] });
			setLocalInput('');
		}
	};
	return (
		<div className="fixed bottom-20 right-4 z-50 md:bottom-24 md:right-6">
			{/* Chat Button */}
			{!isOpen && (
				<button
					type="button"
					onClick={(e) => {
						e.preventDefault();
						setIsOpen(true);
					}}
					className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all transform hover:scale-105 flex items-center gap-2"
				>
					<MessageSquare className="w-6 h-6" />
					<span className="font-semibold hidden sm:inline">Ask AI Concierge</span>
				</button>
			)}

			{/* Chat Window */}
			{isOpen && (
				<div className="bg-white rounded-2xl shadow-2xl w-[350px] sm:w-[400px] h-[500px] flex flex-col border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5">
					{/* Header */}
					<div className="bg-primary text-white p-4 flex justify-between items-center">
						<div>
							<h3 className="font-bold text-lg flex items-center gap-2">
								<span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
								AI Concierge
							</h3>
							<p className="text-xs text-white/80">Gulfshore Group Assistant</p>
						</div>
						<button
							onClick={() => setIsOpen(false)}
							className="text-white hover:text-gray-200 hover:bg-primary-dark p-1 rounded transition-colors"
						>
							<X className="w-5 h-5" />
						</button>
					</div>

					{/* Messages Area */}
					<div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
						{messages.length === 0 && (
							<div className="text-center text-gray-500 mt-10">
								<MessageSquare className="w-10 h-10 mx-auto text-gray-300 mb-2" />
								<p className="text-sm">Hi! How can I help you find your dream home in Southwest Florida today?</p>
							</div>
						)}
						{messages.map((m) => (
							<div
								key={m.id}
								className={`flex ${
									m.role === "user" ? "justify-end" : "justify-start"
								}`}
							>
								<div
									className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
										m.role === "user"
											? "bg-primary text-white rounded-tr-sm"
											: "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
									}`}
								>
									{m.content && <span>{m.content}</span>}
									{m.parts?.map((part, index) => {
										if (part.type === "text" && !m.content) {
											return <span key={index}>{part.text}</span>;
										}
										if (part.type === "tool-searchProperties" && "output" in part && part.output) {
											const result: any = part.output;
											if (Array.isArray(result)) {
												if (result.length === 0) {
													return (
														<div key={part.toolCallId} className="mt-3 text-xs italic text-gray-600 bg-gray-50 border border-gray-100 p-2 rounded">
															I searched the database but couldn't find any active listings matching your criteria. Let me know if you want to try a different area or set up an alert.
														</div>
													);
												}
												return (
													<div key={part.toolCallId} className="mt-3 space-y-2">
														<p className="text-xs font-semibold text-primary border-b pb-1">Found Properties:</p>
														{result.map((prop: any, i: number) => (
															<a href={prop.link} target="_blank" rel="noreferrer" key={i} className="block bg-gray-50 p-2.5 rounded border border-gray-200 hover:border-primary transition-colors text-xs text-gray-700 shadow-sm hover:shadow-md">
																<span className="font-bold text-gray-900 block truncate">{prop.address}</span>
																<span className="text-primary font-bold text-sm block mt-0.5">{prop.price}</span> 
																<div className="flex flex-wrap gap-1 mt-1 text-gray-600">
																	{(prop.beds != null || prop.baths != null) && (
																		<span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{prop.beds ?? 0} Beds, {prop.baths ?? 0} Baths</span>
																	)}
																	{prop.sqft && <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{prop.sqft} Sqft</span>}
																	{prop.yearBuilt && <span className="bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">Built {prop.yearBuilt}</span>}
																</div>
																<div className="flex flex-wrap gap-1 mt-1">
																	{prop.pool === "Yes" && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100">Pool</span>}
																	{prop.waterfront === "Yes" && <span className="text-[10px] bg-cyan-50 text-cyan-600 px-1.5 py-0.5 rounded-full border border-cyan-100">Waterfront</span>}
																	{prop.gulfAccess === "Yes" && <span className="text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full border border-teal-100">Gulf Access</span>}
																</div>
															</a>
														))}
														<div className="pt-2 border-t border-gray-200 mt-2 flex flex-col items-center gap-1 text-[11px] text-gray-500">
															<span>Looking to sell your current property too?</span>
															<a
																href="/sell"
																className="w-full text-center bg-gray-100 text-gray-800 font-semibold py-1.5 px-2 rounded border border-gray-300 hover:bg-gray-200 hover:text-primary transition-colors block text-xs"
															>
																+ Add New Property to Sell
															</a>
														</div>
													</div>
												);
											}
										}
										if (part.type === "tool-checkSellerProperties" && "output" in part && part.output) {
											const result: any = part.output;
											if (result.found) {
												return (
													<div key={part.toolCallId} className="mt-3 space-y-2">
														<p className="text-xs font-semibold text-primary border-b pb-1">
															Your Listed Properties / Valuations ({result.email}):
														</p>
														{result.properties.map((prop: any, i: number) => (
															<div key={i} className="bg-gray-50 p-2.5 rounded border border-gray-200 text-xs text-gray-700 space-y-1">
																<span className="font-bold text-gray-900 block truncate">{prop.address}</span>
																<span className="text-gray-500 text-[10px] block">
																	{prop.createdAt ? new Date(prop.createdAt).toLocaleDateString() : ""}
																</span>
															</div>
														))}
														<a
															href="/sell"
															className="block text-center bg-primary text-white font-bold py-2 px-3 rounded-lg text-xs hover:bg-primary/90 transition-colors shadow-xs mt-2"
														>
															+ Add New Property to Sell
														</a>
													</div>
												);
											} else {
												return (
													<div key={part.toolCallId} className="mt-3 space-y-2 bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs">
														<p className="text-gray-700">{result.message || `No existing properties found for ${result.email}.`}</p>
														<a
															href="/sell"
															className="block text-center bg-primary text-white font-bold py-2 px-3 rounded-lg text-xs hover:bg-primary/90 transition-colors shadow-xs mt-2"
														>
															+ Add New Property to Sell
														</a>
													</div>
												);
											}
										}
										return null;
									})}
								</div>
							</div>
						))}
						{isLoading && (
							<div className="flex justify-start">
								<div className="bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-1">
									<div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
									<div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
									<div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
								</div>
							</div>
						)}
						<div ref={messagesEndRef} />
					</div>

					{/* Input Area */}
					<div className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
						<input
							type="text"
							value={localInput}
							onChange={(e) => setLocalInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									handleSend();
								}
							}}
							placeholder="Type your message..."
							className="flex-1 px-4 py-2 bg-gray-100 border-transparent focus:bg-white border focus:border-primary rounded-full outline-none transition-all text-sm"
							disabled={isLoading}
						/>
						<button
							type="button"
							onClick={(e) => {
								e.preventDefault();
								handleSend();
							}}
							disabled={!localInput || !localInput.trim() || isLoading}
							className="bg-primary text-white p-2.5 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							<Send className="w-4 h-4 ml-0.5" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
