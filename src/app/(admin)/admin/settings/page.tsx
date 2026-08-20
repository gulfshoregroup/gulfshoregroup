"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Bell, Shield, Globe, Save, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
	const [siteName, setSiteName] = useState("Gulfshore Group");
	const [contactEmail, setContactEmail] = useState("admin@gulfshore.com");
	const [siteUrl, setSiteUrl] = useState("https://gulfshoregroup.com");
	const [savingGeneral, setSavingGeneral] = useState(false);

	const [notifications, setNotifications] = useState(true);
	const [emailAlerts, setEmailAlerts] = useState(true);
	const [savingNotif, setSavingNotif] = useState(false);

	const [email, setEmail] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [updating, setUpdating] = useState(false);

	useEffect(() => {
		// 1. Read admin email from cookie or fallback
		const getCookie = (name: string) => {
			const value = `; ${document.cookie}`;
			const parts = value.split(`; ${name}=`);
			if (parts.length === 2) return parts.pop()?.split(';').shift() || "";
			return "";
		};
		const cookieEmail = getCookie("mock_user_email");
		if (cookieEmail && cookieEmail !== "false") {
			setEmail(cookieEmail);
		} else {
			setEmail("admin@gulfshore.com");
		}

		// 2. Load General Settings
		fetch("/api/admin/general-settings")
			.then((res) => res.json())
			.then((data) => {
				if (data.siteName) setSiteName(data.siteName);
				if (data.contactEmail) setContactEmail(data.contactEmail);
				if (data.siteUrl) setSiteUrl(data.siteUrl);
			})
			.catch(() => {});

		// 3. Load Notification Settings
		fetch("/api/admin/notification-settings")
			.then((res) => res.json())
			.then((data) => {
				if (typeof data.pushEnabled === "boolean") setNotifications(data.pushEnabled);
				if (typeof data.emailEnabled === "boolean") setEmailAlerts(data.emailEnabled);
			})
			.catch(() => {});
	}, []);

	const handleSaveGeneral = async () => {
		setSavingGeneral(true);
		try {
			const res = await fetch("/api/admin/general-settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ siteName, contactEmail, siteUrl }),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("General settings saved successfully!");
				window.dispatchEvent(new Event("general-settings-updated"));
			} else {
				toast.error(data.error || "Failed to save settings.");
			}
		} catch {
			toast.error("Error saving general settings.");
		} finally {
			setSavingGeneral(false);
		}
	};

	const saveNotificationSettings = async (push: boolean, email_alerts: boolean) => {
		setSavingNotif(true);
		try {
			const res = await fetch("/api/admin/notification-settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ pushEnabled: push, emailEnabled: email_alerts }),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Notification preference saved!");
			} else {
				toast.error(data.error || "Failed to save notification preference.");
			}
		} catch {
			toast.error("Error saving notification setting.");
		} finally {
			setSavingNotif(false);
		}
	};

	const handleUpdateSecurity = async () => {
		if (!currentPassword) {
			toast.error("Please enter your current password to save changes.");
			return;
		}
		if (!email) {
			toast.error("Email cannot be empty.");
			return;
		}

		setUpdating(true);
		try {
			const res = await fetch("/api/admin/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					action: "change-credentials",
					password: currentPassword,
					newEmail: email,
					newPassword: newPassword || undefined
				})
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Credentials updated successfully!");
				document.cookie = `mock_user_email=${email}; path=/; max-age=31536000`;
				setCurrentPassword("");
				setNewPassword("");
			} else {
				toast.error(data.error || "Failed to update credentials.");
			}
		} catch {
			toast.error("Error updating credentials.");
		} finally {
			setUpdating(false);
		}
	};

	return (
		<div className="space-y-6 px-4 my-5">
			<div className="flex items-center gap-3">
				<Settings className="h-8 w-8 text-primary" />
				<div>
					<h1 className="text-3xl font-bold">Settings</h1>
					<p className="text-muted-foreground">Manage your admin panel preferences</p>
				</div>
			</div>

			<div className="grid gap-6">
				{/* General Settings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Globe className="h-5 w-5" />
							General Settings
						</CardTitle>
						<CardDescription>Configure your basic site preferences</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="siteName">Site Name</Label>
								<Input 
									id="siteName" 
									value={siteName} 
									onChange={(e) => setSiteName(e.target.value)} 
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="contactEmail">Contact Email</Label>
								<Input 
									id="contactEmail" 
									type="email" 
									value={contactEmail} 
									onChange={(e) => setContactEmail(e.target.value)} 
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="siteUrl">Site URL</Label>
							<Input 
								id="siteUrl" 
								value={siteUrl} 
								onChange={(e) => setSiteUrl(e.target.value)} 
							/>
						</div>
						<Button 
							onClick={handleSaveGeneral} 
							disabled={savingGeneral}
							className="bg-primary text-white"
						>
							<Save className="h-4 w-4 mr-2" />
							{savingGeneral ? "Saving..." : "Save Changes"}
						</Button>
					</CardContent>
				</Card>

				{/* Notification Settings */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Bell className="h-5 w-5" />
							Notifications
						</CardTitle>
						<CardDescription>Control how you receive notifications</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Push Notifications</p>
								<p className="text-sm text-muted-foreground">Receive in-app notifications</p>
							</div>
							<Switch
								checked={notifications}
								disabled={savingNotif}
								onCheckedChange={(val) => {
									setNotifications(val);
									saveNotificationSettings(val, emailAlerts);
								}}
							/>
						</div>
						<Separator />
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">Email Alerts</p>
								<p className="text-sm text-muted-foreground">Get email for new leads and contacts</p>
							</div>
							<Switch
								checked={emailAlerts}
								disabled={savingNotif}
								onCheckedChange={(val) => {
									setEmailAlerts(val);
									saveNotificationSettings(notifications, val);
								}}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Security */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="h-5 w-5" />
							Security & Account
						</CardTitle>
						<CardDescription>Manage your administrative login credentials</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="adminEmail">Admin Email / ID</Label>
							<Input
								id="adminEmail"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="admin@gulfshore.com"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="currPassword">Current Password (Required to make changes)</Label>
							<div className="relative">
								<Input
									id="currPassword"
									type={showCurrentPassword ? "text" : "password"}
									value={currentPassword}
									onChange={(e) => setCurrentPassword(e.target.value)}
									placeholder="Enter current password"
									className="pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowCurrentPassword(!showCurrentPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
									tabIndex={-1}
									aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
								>
									{showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="newPassword">New Password (Leave blank to keep current)</Label>
							<div className="relative">
								<Input
									id="newPassword"
									type={showNewPassword ? "text" : "password"}
									value={newPassword}
									onChange={(e) => setNewPassword(e.target.value)}
									placeholder="Enter new password"
									className="pr-10"
								/>
								<button
									type="button"
									onClick={() => setShowNewPassword(!showNewPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
									tabIndex={-1}
									aria-label={showNewPassword ? "Hide new password" : "Show new password"}
								>
									{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
						</div>
						<Button 
							variant="outline" 
							disabled={updating}
							onClick={handleUpdateSecurity}
						>
							{updating ? "Saving..." : "Update Credentials"}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

