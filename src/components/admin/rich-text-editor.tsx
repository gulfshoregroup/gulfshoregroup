"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
	Bold,
	Italic,
	List,
	ListOrdered,
	Heading2,
	Heading3,
	Pilcrow,
	Code,
	Eye,
	FileText,
	RemoveFormatting,
	Undo,
	Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
	value: string;
	onChange: (val: string) => void;
	placeholder?: string;
	minHeight?: string;
}

export function RichTextEditor({
	value,
	onChange,
	placeholder = "Write description here...",
	minHeight = "360px",
}: RichTextEditorProps) {
	const [activeTab, setActiveTab] = useState<"visual" | "html" | "preview">("visual");
	const editorRef = useRef<HTMLDivElement>(null);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Keep editorRef innerHTML in sync with value prop when value changes from outside (e.g. AI generation)
	useEffect(() => {
		if (editorRef.current && activeTab === "visual") {
			// Only update if substantially different to avoid cursor position resets while typing
			if (editorRef.current.innerHTML !== (value || "")) {
				editorRef.current.innerHTML = value || "";
			}
		}
	}, [value, activeTab]);

	const handleInput = useCallback(() => {
		if (editorRef.current) {
			const html = editorRef.current.innerHTML;
			// If it's just an empty break or empty paragraph, normalize to empty
			if (html === "<p><br></p>" || html === "<br>") {
				onChange("");
			} else {
				onChange(html);
			}
		}
	}, [onChange]);

	const executeCommand = (command: string, arg: string | undefined = undefined) => {
		if (editorRef.current) {
			editorRef.current.focus();
			document.execCommand(command, false, arg);
			handleInput();
		}
	};

	const formatBlock = (tag: string) => {
		if (editorRef.current) {
			editorRef.current.focus();
			document.execCommand("formatBlock", false, `<${tag}>`);
			handleInput();
		}
	};

	return (
		<div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
			{/* Top Bar with Mode Switcher */}
			<div className="flex flex-wrap items-center justify-between border-b border-border bg-muted/40 px-3 py-2 gap-2">
				{/* Tab Selector */}
				<div className="flex items-center gap-1 bg-background border border-border p-1 rounded-md text-xs font-medium">
					<button
						type="button"
						onClick={() => setActiveTab("visual")}
						className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
							activeTab === "visual"
								? "bg-primary text-primary-foreground shadow-xs font-semibold"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<FileText className="w-3.5 h-3.5" />
						Visual Editor (WYSIWYG)
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("preview")}
						className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
							activeTab === "preview"
								? "bg-primary text-primary-foreground shadow-xs font-semibold"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<Eye className="w-3.5 h-3.5" />
						Live Preview
					</button>
					<button
						type="button"
						onClick={() => setActiveTab("html")}
						className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
							activeTab === "html"
								? "bg-primary text-primary-foreground shadow-xs font-semibold"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						<Code className="w-3.5 h-3.5" />
						HTML Source
					</button>
				</div>

				<span className="text-xs text-muted-foreground hidden sm:inline-block">
					{activeTab === "visual" && "✨ Formatted view (No raw HTML tags)"}
					{activeTab === "preview" && "👀 Exact visitor preview"}
					{activeTab === "html" && "⚙️ Direct HTML editing"}
				</span>
			</div>

			{/* Formatting Toolbar (Only in Visual Mode) */}
			{activeTab === "visual" && (
				<div className="flex flex-wrap items-center gap-1 p-2 bg-muted/20 border-b border-border text-sm">
					{/* Paragraph / Headings */}
					<div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 px-2 text-xs"
							onMouseDown={(e) => {
								e.preventDefault();
								formatBlock("p");
							}}
							title="Normal Paragraph"
						>
							<Pilcrow className="w-3.5 h-3.5 mr-1" />
							Normal
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 px-2 text-xs font-bold"
							onMouseDown={(e) => {
								e.preventDefault();
								formatBlock("h2");
							}}
							title="Main Heading (H2)"
						>
							<Heading2 className="w-4 h-4 mr-0.5" />
							H2
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-8 px-2 text-xs font-semibold"
							onMouseDown={(e) => {
								e.preventDefault();
								formatBlock("h3");
							}}
							title="Sub Heading (H3)"
						>
							<Heading3 className="w-4 h-4 mr-0.5" />
							H3
						</Button>
					</div>

					{/* Bold & Italic */}
					<div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onMouseDown={(e) => {
								e.preventDefault();
								executeCommand("bold");
							}}
							title="Bold (Ctrl+B)"
						>
							<Bold className="w-4 h-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onMouseDown={(e) => {
								e.preventDefault();
								executeCommand("italic");
							}}
							title="Italic (Ctrl+I)"
						>
							<Italic className="w-4 h-4" />
						</Button>
					</div>

					{/* Lists */}
					<div className="flex items-center gap-0.5 border-r border-border pr-2 mr-1">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onMouseDown={(e) => {
								e.preventDefault();
								executeCommand("insertUnorderedList");
							}}
							title="Bullet List"
						>
							<List className="w-4 h-4" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8"
							onMouseDown={(e) => {
								e.preventDefault();
								executeCommand("insertOrderedList");
							}}
							title="Numbered List"
						>
							<ListOrdered className="w-4 h-4" />
						</Button>
					</div>

					{/* Undo / Redo / Clear */}
					<div className="flex items-center gap-0.5">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground hover:text-foreground"
							onMouseDown={(e) => {
								e.preventDefault();
								executeCommand("undo");
							}}
							title="Undo (Ctrl+Z)"
						>
							<Undo className="w-3.5 h-3.5" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground hover:text-foreground"
							onMouseDown={(e) => {
								e.preventDefault();
								executeCommand("redo");
							}}
							title="Redo (Ctrl+Y)"
						>
							<Redo className="w-3.5 h-3.5" />
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-muted-foreground hover:text-destructive"
							onMouseDown={(e) => {
								e.preventDefault();
								executeCommand("removeFormat");
							}}
							title="Remove Formatting"
						>
							<RemoveFormatting className="w-3.5 h-3.5" />
						</Button>
					</div>
				</div>
			)}

			{/* VISUAL EDITOR CONTENT */}
			{activeTab === "visual" && (
				<div
					ref={editorRef}
					contentEditable
					onInput={handleInput}
					style={{ minHeight }}
					className="p-5 focus:outline-none focus:ring-0 overflow-y-auto prose prose-neutral max-w-none text-foreground
						[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-5 [&_h2]:mb-2.5
						[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2
						[&_p]:text-base [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4
						[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:my-3 [&_ul]:text-muted-foreground
						[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_ol]:my-3 [&_ol]:text-muted-foreground
						[&_li]:leading-normal
						[&_strong]:font-semibold [&_strong]:text-foreground
						[&_em]:italic"
					data-placeholder={placeholder}
				/>
			)}

			{/* HTML SOURCE CODE CONTENT */}
			{activeTab === "html" && (
				<textarea
					value={value || ""}
					onChange={(e) => onChange(e.target.value)}
					style={{ minHeight }}
					className="w-full p-4 font-mono text-sm bg-muted/10 text-foreground border-none resize-y focus:outline-none focus:ring-0 leading-relaxed"
					placeholder="<p>Enter HTML markup here...</p>"
				/>
			)}

			{/* LIVE PREVIEW CONTENT */}
			{activeTab === "preview" && (
				<div
					style={{ minHeight }}
					className="p-5 overflow-y-auto bg-background/50 prose prose-neutral max-w-none text-foreground
						[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-primary [&_h2]:mt-5 [&_h2]:mb-2.5
						[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2
						[&_p]:text-base [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4
						[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1.5 [&_ul]:my-3 [&_ul]:text-muted-foreground
						[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-1.5 [&_ol]:my-3 [&_ol]:text-muted-foreground
						[&_li]:leading-normal
						[&_strong]:font-semibold [&_strong]:text-foreground"
					dangerouslySetInnerHTML={{ __html: value || "<p class='italic text-muted-foreground'>No description provided yet.</p>" }}
				/>
			)}
		</div>
	);
}

