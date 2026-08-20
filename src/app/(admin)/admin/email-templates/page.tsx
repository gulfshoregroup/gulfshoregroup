"use client";

import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Edit, Star, StarOff } from "lucide-react";

export default function EmailTemplatesPage() {
	const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
	const [isEditing, setIsEditing] = useState(false);

	// Mock data - in a real app, you would fetch this from your API
	const templates = [
		{
			id: "1",
			name: "Welcome Email",
			subject: "Welcome to Our Platform",
			isDefault: true,
			lastUpdated: "",
			content:
				"Dear {{name}},\n\nWelcome to our property platform! We're excited to have you join us.\n\nWith our platform, you can:\n- Browse thousands of properties\n- Save your favorites\n- Schedule viewings\n\nIf you have any questions, please don't hesitate to contact us.\n\nBest regards,\nThe Team",
		},
		{
			id: "2",
			name: "Property Recommendation",
			subject: "Properties You Might Like",
			isDefault: false,
			lastUpdated: "",
			content:
				"Hello {{name}},\n\nBased on your preferences, we thought you might be interested in these properties:\n\n{{property_list}}\n\nClick on any property to learn more.\n\nHappy house hunting!\nThe Team",
		},
		{
			id: "3",
			name: "Tour Confirmation",
			subject: "Your Property Tour is Confirmed",
			isDefault: false,
			lastUpdated: "",
			content:
				"Hi {{name}},\n\nYour tour for {{property_name}} has been confirmed for {{tour_date}} at {{tour_time}}.\n\nAddress: {{property_address}}\n\nIf you need to reschedule, please contact us at least 24 hours in advance.\n\nWe look forward to showing you the property!\nThe Team",
		},
		{
			id: "4",
			name: "Password Reset",
			subject: "Reset Your Password",
			isDefault: false,
			lastUpdated: "",
			content:
				"Hello,\n\nWe received a request to reset your password. Click the link below to set a new password:\n\n{{reset_link}}\n\nIf you didn't request this, you can safely ignore this email.\n\nBest regards,\nThe Team",
		},
	];

	const openEditor = (template: any) => {
		setSelectedTemplate(template);
		setIsEditing(true);
	};

	const closeEditor = () => {
		setIsEditing(false);
		setSelectedTemplate(null);
	};

	const makeDefault = (templateId: any) => {
		// In a real app, you would update this in your backend
		console.log(`Making template ${templateId} the default`);
	};

	return (
		<div className="px-4 my-5">
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">Email Templates</h1>
					<Button>
						<Mail className="mr-2 h-4 w-4" />
						Create Template
					</Button>
				</div>

				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Template Name</TableHead>
								<TableHead>Subject</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Last Updated</TableHead>
								<TableHead className="w-[100px]">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{templates.map((template) => (
								<TableRow key={template.id}>
									<TableCell className="font-medium">
										{template.name}
									</TableCell>
									<TableCell>{template.subject}</TableCell>
									<TableCell>
										{template.isDefault ? (
											<Badge>Default</Badge>
										) : (
											<Badge variant="outline">Active</Badge>
										)}
									</TableCell>
									<TableCell>{template.lastUpdated}</TableCell>
									<TableCell>
										<div className="flex space-x-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => openEditor(template)}>
												<Edit className="h-4 w-4" />
												<span className="sr-only">Edit</span>
											</Button>
											{!template.isDefault && (
												<Button
													variant="ghost"
													size="icon"
													onClick={() => makeDefault(template.id)}>
													<Star className="h-4 w-4" />
													<span className="sr-only">
														Make Default
													</span>
												</Button>
											)}
											{template.isDefault && (
												<Button variant="ghost" size="icon" disabled>
													<StarOff className="h-4 w-4" />
													<span className="sr-only">Default</span>
												</Button>
											)}
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				{isEditing && selectedTemplate && (
					<Dialog open={isEditing} onOpenChange={closeEditor}>
						<DialogContent className="sm:max-w-[800px]">
							<DialogHeader>
								<DialogTitle>Edit Email Template</DialogTitle>
							</DialogHeader>
							<div className="grid gap-4 py-4">
								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor="name" className="text-right">
										Name
									</Label>
									<Input
										id="name"
										defaultValue={selectedTemplate.name}
										className="col-span-3"
									/>
								</div>
								<div className="grid grid-cols-4 items-center gap-4">
									<Label htmlFor="subject" className="text-right">
										Subject
									</Label>
									<Input
										id="subject"
										defaultValue={selectedTemplate.subject}
										className="col-span-3"
									/>
								</div>
								<div className="grid grid-cols-4 items-start gap-4">
									<Label
										htmlFor="content"
										className="text-right pt-2">
										Content
									</Label>
									<Textarea
										id="content"
										defaultValue={selectedTemplate.content}
										className="col-span-3 min-h-[300px] font-mono"
									/>
								</div>
							</div>
							<DialogFooter>
								<Button variant="outline" onClick={closeEditor}>
									Cancel
								</Button>
								<Button>Save Changes</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				)}
			</div>
		</div>
	);
}
