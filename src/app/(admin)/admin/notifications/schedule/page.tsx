"use client";

import type React from "react";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	CalendarIcon,
	Clock,
	Users,
	MessageSquare,
	Mail,
	Phone,
	ArrowLeft,
	ChevronDown,
	Bell,
	ChartColumnDecreasing,
	BellDot,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";

const notificationTypes = [
	{ value: "New Updates", label: "New Updates", icon: BellDot },
	{ value: "Reminders", label: "Reminders", icon: Clock },
	{ value: "New user", label: "New user", icon: Users },
	{ value: "Welcome", label: "Welcome", icon: MessageSquare },
	{
		value: "Price drop",
		label: "Price drop",
		icon: ChartColumnDecreasing,
	},
];

const channels = [
	{ value: "Email", label: "Email", icon: Mail },
	{ value: "SMS", label: "Text (SMS)", icon: MessageSquare },
	{ value: "Both", label: "Both (Email & Text)", icon: Bell },
];

const segments = [
	{ value: "users", label: "All Users" },
	{ value: "user", label: "Specific User" },
];

const locationOptions = [
	"Miami",
	"Miami Beach",
	"Wynwood",
	"Brickell",
	"Coral Gables",
	"Aventura",
];
const propertyTypeOptions = [
	"Single Family",
	"Condos",
	"Residential-Lots",
];
const amenitiesOptions = [
	"Pool",
	"Garage",
	"Parking",
	"Waterfront",
	"Gulf Access",
];

function ScheduleNotificationContent() {
	const [date, setDate] = useState<Date>();
	const [time, setTime] = useState("");
	const [userId, setUserId] = useState("");
	const [propertyId, setPropertyId] = useState("");
	const [usersList, setUsersList] = useState<any[]>([]);

	useEffect(() => {
		const fetchUsers = async () => {
			try {
				const response = await fetch("/api/leads");
				if (response.ok) {
					const data = await response.json();
					setUsersList(data);
				}
			} catch (error) {
				console.error("Error fetching users:", error);
			}
		};
		fetchUsers();
	}, []);

	const [selectedType, setSelectedType] = useState("");
	const [selectedChannel, setSelectedChannel] = useState("");
	const [scheduleType, setScheduleType] = useState("fixed");
	const [daysAfterSignup, setDaysAfterSignup] = useState("");
	const [selectedSegment, setSelectedSegment] = useState("");
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [showPropertyCriteria, setShowPropertyCriteria] =
		useState(false);
	const [priceRange, setPriceRange] = useState({ min: "", max: "" });
	const [yearBuiltRange, setYearBuiltRange] = useState({ min: "", max: "" });
	const [sqftRange, setSqftRange] = useState({ min: "" });
	const [acresRange, setAcresRange] = useState({ min: "", max: "" });
	const [hoa, setHoa] = useState("");
	const [locationDetails, setLocationDetails] = useState({
		subdivision: "",
		school: "",
		address: "",
		postalCode: ""
	});

	const [selectedLocations, setSelectedLocations] = useState<
		string[]
	>([]);
	const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<
		string[]
	>([]);
	const [bedroomRange, setBedroomRange] = useState({
		min: "",
		max: "",
	});
	const [bathroomRange, setBathroomRange] = useState({
		min: "",
		max: "",
	});
	const [selectedAmenities, setSelectedAmenities] = useState<
		string[]
	>([]);
	const [newListingsOnly, setNewListingsOnly] = useState(false);
	const [priceDropOnly, setPriceDropOnly] = useState(false);

	const searchParams = useSearchParams();
	const router = useRouter();
	const id = searchParams.get("id");

	useEffect(() => {
		if (id) {
			const fetchNotification = async () => {
				try {
					const res = await fetch(`/api/notifications/${id}`);
					if (!res.ok) throw new Error("Failed to fetch notification");
					const data = await res.json();
					setTitle(data.title || "");
					setMessage(data.message || "");
					setSelectedType(data.type || "");
					setSelectedChannel(data.channel?.toLowerCase() || "");
					setSelectedSegment(data.segment || "");
					
					if (data.isDrip) {
						setScheduleType("drip");
						setDaysAfterSignup(data.daysAfterSignup?.toString() || "");
					} else if (data.scheduledFor) {
						const d = new Date(data.scheduledFor);
						setDate(d);
						setTime(format(d, "HH:mm"));
					}

					if (data.propertyCriteria) {
						setPriceRange({
							min: data.propertyCriteria.minPrice || "",
							max: data.propertyCriteria.maxPrice || "",
						});
						setYearBuiltRange({
							min: data.propertyCriteria.builtYearMin || "",
							max: data.propertyCriteria.builtYearMax || "",
						});
						setSqftRange({
							min: data.propertyCriteria.minSqft || "",
						});
						setAcresRange({
							min: data.propertyCriteria.minAcres || "",
							max: data.propertyCriteria.maxAcres || "",
						});
						setHoa(data.propertyCriteria.hoa || "");
						setLocationDetails({
							subdivision: data.propertyCriteria.subdivision || "",
							school: data.propertyCriteria.school || "",
							address: data.propertyCriteria.address || "",
							postalCode: data.propertyCriteria.postalCode || "",
						});
						setBedroomRange({
							min: data.propertyCriteria.beds || "",
							max: "",
						});
						setBathroomRange({
							min: data.propertyCriteria.baths || "",
							max: "",
						});
						setSelectedPropertyTypes(data.propertyCriteria.propertyTypes || []);
						setSelectedAmenities(data.propertyCriteria.features || []);
						if (
							data.propertyCriteria.minPrice ||
							data.propertyCriteria.maxPrice ||
							data.propertyCriteria.builtYearMin ||
							data.propertyCriteria.builtYearMax ||
							data.propertyCriteria.minSqft ||
							data.propertyCriteria.minAcres ||
							data.propertyCriteria.maxAcres ||
							data.propertyCriteria.subdivision ||
							data.propertyCriteria.school ||
							data.propertyCriteria.address ||
							data.propertyCriteria.postalCode ||
							data.propertyCriteria.hoa ||
							data.propertyCriteria.beds ||
							data.propertyCriteria.baths ||
							(data.propertyCriteria.propertyTypes && data.propertyCriteria.propertyTypes.length > 0) ||
							(data.propertyCriteria.features && data.propertyCriteria.features.length > 0)
						) {
							setShowPropertyCriteria(true);
						}
					}
				} catch (err) {
					console.error("Error loading notification details:", err);
				}
			};
			fetchNotification();
		}
	}, [id]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (scheduleType === "drip") {
			if (!daysAfterSignup) {
				alert("Please select days after signup");
				return;
			}
			try {
				const url = id ? `/api/notifications/${id}` : "/api/v2/drip-campaigns";
				const method = id ? "PUT" : "POST";
				const response = await fetch(url, {
					method: method,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						title: title,
						name: title,
						channel: selectedChannel,
						daysAfterSignup: parseInt(daysAfterSignup, 10),
						message: message,
						messageTemplate: message,
					}),
				});
				if (response.ok) {
					alert(id ? "Automated campaign updated successfully!" : "Automated campaign created successfully!");
					router.push("/admin/notifications");
				} else {
					alert(id ? "Failed to update automated campaign" : "Failed to create automated campaign");
				}
			} catch (error) {
				console.error("Error saving campaign:", error);
				alert("Error saving campaign");
			}
			return;
		}

		const scheduledDateTime =
			date && time
				? new Date(`${format(date, "yyyy-MM-dd")}T${time}`)
				: null;

		try {
			const url = id ? `/api/notifications/${id}` : "/api/notifications";
			const method = id ? "PUT" : "POST";
			const response = await fetch(url, {
				method: method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					title: title,
					type: selectedType,
					channel: selectedChannel,
					segment: selectedSegment,
					scheduledFor: scheduledDateTime,
					message: message,

					propertyCriteria: {
						minPrice: priceRange.min,
						maxPrice: priceRange.max,
						builtYearMin: yearBuiltRange.min,
						builtYearMax: yearBuiltRange.max,
						minSqft: sqftRange.min,
						minAcres: acresRange.min,
						maxAcres: acresRange.max,
						hoa: hoa,
						subdivision: locationDetails.subdivision,
						school: locationDetails.school,
						address: locationDetails.address,
						postalCode: locationDetails.postalCode,
						beds: bedroomRange.min,
						baths: bathroomRange.min,
						propertyTypes: selectedPropertyTypes,
						features: selectedAmenities,
					},

					...(selectedSegment === "user" && { userId }),
					...(selectedType === "Price drop" && { propertyId }),
				}),
			});

			if (response.ok) {
				alert(id ? "Notification updated successfully!" : "Notification scheduled successfully!");
				router.push("/admin/notifications");
			} else {
				alert(id ? "Failed to update notification" : "Failed to schedule notification");
			}
		} catch (error) {
			console.error("Error saving notification:", error);
			alert("Error saving notification");
		}
	};

	const handleLocationToggle = (location: string) => {
		setSelectedLocations((prev) =>
			prev.includes(location)
				? prev.filter((l) => l !== location)
				: [...prev, location]
		);
	};

	const handlePropertyTypeToggle = (type: string) => {
		setSelectedPropertyTypes((prev) =>
			prev.includes(type)
				? prev.filter((t) => t !== type)
				: [...prev, type]
		);
	};

	const handleAmenityToggle = (amenity: string) => {
		setSelectedAmenities((prev) =>
			prev.includes(amenity)
				? prev.filter((a) => a !== amenity)
				: [...prev, amenity]
		);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/admin/notifications">
					<Button
						variant="ghost"
						size="sm"
						className="flex items-center gap-2">
						<ArrowLeft className="h-4 w-4" />
						Back to Notifications
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold text-foreground">
						{id ? "Edit Notification" : "Schedule Notification"}
					</h1>
					<p className="text-muted-foreground mt-2">
						{id ? "Edit and update the notification campaign parameters" : "Create and schedule a new notification campaign"}
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Notification Details</CardTitle>
							<CardDescription>
								Configure your notification campaign settings
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label htmlFor="type">Notification Type</Label>
										<Select
											value={selectedType}
											onValueChange={setSelectedType}>
											<SelectTrigger>
												<SelectValue placeholder="Select notification type" />
											</SelectTrigger>
											<SelectContent>
												{notificationTypes.map((type) => (
													<SelectItem
														key={type.value}
														value={type.value}>
														<div className="flex items-center gap-2">
															<type.icon className="h-4 w-4" />
															{type.label}
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="channel">Channel</Label>
										<Select
											value={selectedChannel}
											onValueChange={setSelectedChannel}>
											<SelectTrigger>
												<SelectValue placeholder="Select channel" />
											</SelectTrigger>
											<SelectContent>
												{channels.map((channel) => (
													<SelectItem
														key={channel.value}
														value={channel.value}>
														<div className="flex items-center gap-2">
															<channel.icon className="h-4 w-4" />
															{channel.label}
														</div>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="segment">Target Segment</Label>
									<Select
										value={selectedSegment}
										onValueChange={setSelectedSegment}>
										<SelectTrigger>
											<SelectValue placeholder="Select target segment" />
										</SelectTrigger>
										<SelectContent>
											{segments.map((segment) => (
												<SelectItem
													key={segment.value}
													value={segment.value}>
													<div className="flex items-center justify-between w-full">
														<span className="capitalize">
															{segment.label}
														</span>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								{selectedSegment === "user" && (
									<div className="space-y-2">
										<Label>Select User</Label>
										<Select value={userId} onValueChange={setUserId}>
											<SelectTrigger>
												<SelectValue placeholder="Select a user" />
											</SelectTrigger>
											<SelectContent>
												{usersList.map((u) => (
													<SelectItem key={u.id} value={u.id}>
														{u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "Unknown"} ({u.email || "No Email"})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}

								{selectedType === "Price drop" && (
									<div className="space-y-2">
										<Label htmlFor="propertyId">Property ID</Label>
										<Input
											id="propertyId"
											placeholder="Enter property ID"
											value={propertyId}
											onChange={(e) => setPropertyId(e.target.value)}
										/>
									</div>
								)}

								<div className="space-y-2">
									<Label htmlFor="title">Notification Title</Label>
									<Input
										id="title"
										placeholder="Enter notification title"
										value={title}
										onChange={(e) => setTitle(e.target.value)}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="message">Message Content</Label>
									<Textarea
										id="message"
										placeholder="Enter your notification message..."
										className="min-h-[120px]"
										value={message}
										onChange={(e) => setMessage(e.target.value)}
									/>
								</div>

								<div className="border-t border-border pt-6">
									<button
										type="button"
										onClick={() =>
											setShowPropertyCriteria(!showPropertyCriteria)
										}
										className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
										<ChevronDown
											className={cn(
												"h-4 w-4 transition-transform",
												showPropertyCriteria && "rotate-180"
											)}
										/>
										Property Criteria (Optional)
									</button>

									{showPropertyCriteria && (
										<div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label>Price Range</Label>
													<div className="flex gap-2">
														<Input
															placeholder="Min"
															type="number"
															value={priceRange.min}
															onChange={(e) =>
																setPriceRange({
																	...priceRange,
																	min: e.target.value,
																})
															}
														/>
														<Input
															placeholder="Max"
															type="number"
															value={priceRange.max}
															onChange={(e) =>
																setPriceRange({
																	...priceRange,
																	max: e.target.value,
																})
															}
														/>
													</div>
												</div>

												<div className="space-y-2">
													<Label>Bedrooms</Label>
													<div className="flex gap-2">
														<Input
															placeholder="Min"
															type="number"
															value={bedroomRange.min}
															onChange={(e) =>
																setBedroomRange({
																	...bedroomRange,
																	min: e.target.value,
																})
															}
														/>
														<Input
															placeholder="Max"
															type="number"
															value={bedroomRange.max}
															onChange={(e) =>
																setBedroomRange({
																	...bedroomRange,
																	max: e.target.value,
																})
															}
														/>
													</div>
												</div>

												<div className="space-y-2">
													<Label>Bathrooms</Label>
													<div className="flex gap-2">
														<Input
															placeholder="Min"
															type="number"
															value={bathroomRange.min}
															onChange={(e) =>
																setBathroomRange({
																	...bathroomRange,
																	min: e.target.value,
																})
															}
														/>
														<Input
															placeholder="Max"
															type="number"
															value={bathroomRange.max}
															onChange={(e) =>
																setBathroomRange({
																	...bathroomRange,
																	max: e.target.value,
																})
															}
														/>
													</div>
												</div>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label>Year Built</Label>
													<div className="flex gap-2">
														<Input
															placeholder="Min Year"
															type="number"
															value={yearBuiltRange.min}
															onChange={(e) =>
																setYearBuiltRange({
																	...yearBuiltRange,
																	min: e.target.value,
																})
															}
														/>
														<Input
															placeholder="Max Year"
															type="number"
															value={yearBuiltRange.max}
															onChange={(e) =>
																setYearBuiltRange({
																	...yearBuiltRange,
																	max: e.target.value,
																})
															}
														/>
													</div>
												</div>
												<div className="space-y-2">
													<Label>Size & Acres</Label>
													<div className="flex gap-2">
														<Input
															placeholder="Min Sqft"
															type="number"
															value={sqftRange.min}
															onChange={(e) =>
																setSqftRange({
																	...sqftRange,
																	min: e.target.value,
																})
															}
														/>
														<Input
															placeholder="Min Acres"
															type="number"
															value={acresRange.min}
															onChange={(e) =>
																setAcresRange({
																	...acresRange,
																	min: e.target.value,
																})
															}
														/>
														<Input
															placeholder="Max Acres"
															type="number"
															value={acresRange.max}
															onChange={(e) =>
																setAcresRange({
																	...acresRange,
																	max: e.target.value,
																})
															}
														/>
													</div>
												</div>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
												<div className="space-y-2">
													<Label>Location Details</Label>
													<div className="grid grid-cols-2 gap-2">
														<Input
															placeholder="Subdivision"
															value={locationDetails.subdivision}
															onChange={(e) =>
																setLocationDetails({
																	...locationDetails,
																	subdivision: e.target.value,
																})
															}
														/>
														<Input
															placeholder="School"
															value={locationDetails.school}
															onChange={(e) =>
																setLocationDetails({
																	...locationDetails,
																	school: e.target.value,
																})
															}
														/>
														<Input
															placeholder="Address"
															value={locationDetails.address}
															onChange={(e) =>
																setLocationDetails({
																	...locationDetails,
																	address: e.target.value,
																})
															}
														/>
														<Input
															placeholder="Zip Code"
															value={locationDetails.postalCode}
															onChange={(e) =>
																setLocationDetails({
																	...locationDetails,
																	postalCode: e.target.value,
																})
															}
														/>
													</div>
												</div>
												<div className="space-y-2">
													<Label>HOA Fees</Label>
													<Select
														value={hoa || "Any"}
														onValueChange={(v) =>
															setHoa(v === "Any" ? "" : v)
														}>
														<SelectTrigger>
															<SelectValue placeholder="HOA Fees" />
														</SelectTrigger>
														<SelectContent>
															{["Any", "No HOA", "Up to $100/mo", "Up to $300/mo", "Up to $500/mo"].map((v) => (
																<SelectItem key={v} value={v}>
																	{v}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
											</div>

											{/* <div className="space-y-2">
												<Label>Locations</Label>
												<div className="grid grid-cols-2 gap-2">
													{locationOptions.map((location) => (
														<div
															key={location}
															className="flex items-center gap-2">
															<Checkbox
																id={`location-${location}`}
																checked={selectedLocations.includes(
																	location
																)}
																onCheckedChange={() =>
																	handleLocationToggle(location)
																}
															/>
															<Label
																htmlFor={`location-${location}`}
																className="font-normal cursor-pointer">
																{location}
															</Label>
														</div>
													))}
												</div>
											</div> */}

											<div className="space-y-2">
												<Label>Property Type</Label>
												<div className="grid grid-cols-2 gap-2">
													{propertyTypeOptions.map((type) => (
														<div
															key={type}
															className="flex items-center gap-2">
															<Checkbox
																id={`type-${type}`}
																checked={selectedPropertyTypes.includes(
																	type
																)}
																onCheckedChange={() =>
																	handlePropertyTypeToggle(type)
																}
															/>
															<Label
																htmlFor={`type-${type}`}
																className="font-normal cursor-pointer">
																{type}
															</Label>
														</div>
													))}
												</div>
											</div>

											<div className="space-y-2">
												<Label>Amenities</Label>
												<div className="grid grid-cols-2 gap-2">
													{amenitiesOptions.map((amenity) => (
														<div
															key={amenity}
															className="flex items-center gap-2">
															<Checkbox
																id={`amenity-${amenity}`}
																checked={selectedAmenities.includes(
																	amenity
																)}
																onCheckedChange={() =>
																	handleAmenityToggle(amenity)
																}
															/>
															<Label
																htmlFor={`amenity-${amenity}`}
																className="font-normal cursor-pointer">
																{amenity}
															</Label>
														</div>
													))}
												</div>
											</div>
										</div>
									)}
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2 md:col-span-2">
										<Label>Schedule Type</Label>
										<Select value={scheduleType} onValueChange={setScheduleType}>
											<SelectTrigger>
												<SelectValue placeholder="Select schedule type" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="fixed">Fixed Date & Time</SelectItem>
												<SelectItem value="drip">Automated (Days After Signup)</SelectItem>
											</SelectContent>
										</Select>
									</div>

									{scheduleType === "fixed" ? (
										<>
											<div className="space-y-2">
												<Label>Schedule Date</Label>
												<Popover>
													<PopoverTrigger asChild>
														<Button
															variant="outline"
															className={cn(
																"w-full justify-start text-left font-normal",
																!date && "text-muted-foreground"
															)}>
															<CalendarIcon className="mr-2 h-4 w-4" />
															{date ? format(date, "PPP") : "Pick a date"}
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-auto p-0">
														<Calendar
															mode="single"
															selected={date}
															onSelect={setDate}
														/>
													</PopoverContent>
												</Popover>
											</div>

											<div className="space-y-2">
												<Label htmlFor="time">Schedule Time</Label>
												<Input
													id="time"
													type="time"
													value={time}
													onChange={(e) => setTime(e.target.value)}
												/>
											</div>
										</>
									) : (
										<div className="space-y-2 md:col-span-2">
											<Label>Days After Signup</Label>
											<Select value={daysAfterSignup} onValueChange={setDaysAfterSignup}>
												<SelectTrigger>
													<SelectValue placeholder="Select when to send" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="-1">10 Minutes After (Test)</SelectItem>
													<SelectItem value="0">Immediately</SelectItem>
													<SelectItem value="1">1 Day After</SelectItem>
													<SelectItem value="3">3 Days After</SelectItem>
													<SelectItem value="5">5 Days After</SelectItem>
													<SelectItem value="7">7 Days After</SelectItem>
													<SelectItem value="10">10 Days After</SelectItem>
													<SelectItem value="14">14 Days After</SelectItem>
													<SelectItem value="30">30 Days After</SelectItem>
													<SelectItem value="60">60 Days After</SelectItem>
													<SelectItem value="90">90 Days After</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}
								</div>

								<div className="flex gap-3 pt-4">
									<Button type="submit" className="flex-1">
										{id ? "Update Notification" : "Schedule Notification"}
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Preview</CardTitle>
							<CardDescription>
								How your notification will appear
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="p-4 border border-border rounded-lg bg-muted/50">
									<div className="flex items-center gap-2 mb-2">
										{selectedChannel && (
											<Badge variant="secondary" className="text-xs">
												{
													channels.find(
														(c) => c.value === selectedChannel
													)?.label
												}
											</Badge>
										)}
										{selectedType && (
											<Badge variant="outline" className="text-xs">
												{
													notificationTypes.find(
														(t) => t.value === selectedType
													)?.label
												}
											</Badge>
										)}
									</div>
									<h4 className="font-medium text-sm mb-1">
										{title || "Notification Title"}
									</h4>
									<p className="text-sm text-muted-foreground">
										{message ||
											"Your notification message will appear here..."}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								Campaign Summary
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										Scheduled For:
									</span>
									<span className="font-medium">
										{date && time
											? `${format(date, "MMM dd")} at ${time}`
											: "Not set"}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										Channel:
									</span>
									<span className="font-medium capitalize">
										{selectedChannel || "Not selected"}
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-muted-foreground">
										Target:
									</span>
									<span className="font-medium capitalize">
										{selectedSegment || "Not selected"}
									</span>
								</div>
								{(selectedLocations.length > 0 ||
									selectedPropertyTypes.length > 0 ||
									selectedAmenities.length > 0) && (
									<>
										<div className="border-t border-border pt-3 mt-3">
											<p className="text-xs font-semibold text-foreground mb-2">
												Property Criteria Applied:
											</p>
											{selectedLocations.length > 0 && (
												<p className="text-xs text-muted-foreground">
													Locations: {selectedLocations.join(", ")}
												</p>
											)}
											{selectedPropertyTypes.length > 0 && (
												<p className="text-xs text-muted-foreground">
													Types: {selectedPropertyTypes.join(", ")}
												</p>
											)}
											{selectedAmenities.length > 0 && (
												<p className="text-xs text-muted-foreground">
													Amenities: {selectedAmenities.join(", ")}
												</p>
											)}
										</div>
									</>
								)}
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

export default function ScheduleNotificationPage() {
	return (
		<Suspense fallback={<div className="p-6 text-center text-muted-foreground font-medium animate-pulse">Loading schedule configurations...</div>}>
			<ScheduleNotificationContent />
		</Suspense>
	);
}
