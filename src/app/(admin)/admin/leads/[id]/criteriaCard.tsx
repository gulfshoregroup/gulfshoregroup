"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import CityList from "@/data/cities";

interface LeadCriteriaProps {
	lead: any;
	refreshLead: () => Promise<void>;
}

export default function PropertyCriteria({
	lead,
	refreshLead,
}: LeadCriteriaProps) {
	const [communities, setCommunities] = useState<{ name: string }[]>(
		[]
	);
	const [selectedCity, setSelectedCity] = useState("");
	const [selectedCommunity, setSelectedCommunity] = useState("");
	const [comSearch, setComSearch] = useState("");
	const [citySearch, setCitySearch] = useState("");

	const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
	const [editingTitleValue, setEditingTitleValue] = useState("");

	const [criteria, setCriteria] = useState({
		city: "",
		developmentName: "",
		beds: "",
		baths: "",
		minPrice: "",
		maxPrice: "",
		propertyTypes: [] as string[],
		features: [] as string[],
	});

	// static lists
	const bedBathOptions = ["1", "2", "3", "4"];
	const propertyTypeOptions = ["Homes", "Condos", "Residential-Lots"];
	const featureOptions = ["Waterfront", "Pool", "GulfAccess"];

	// fetch communities when city changes
	useEffect(() => {
		const fetchCommunities = async () => {
			if (!selectedCity) return;
			try {
				const res = await axios.get(
					`/api/cities/${selectedCity}/communities`
				);
				setCommunities(res.data.data || []);
			} catch {
				setCommunities([]);
			}
		};
		fetchCommunities();
	}, [selectedCity]);

	// input handlers
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
		setCriteria({ ...criteria, [e.target.name]: e.target.value });

	const handleCitySelect = (value: string) => {
		setSelectedCity(value);
		setCriteria((prev) => ({ ...prev, city: value }));
		setSelectedCommunity("");
	};

	const handleCommunitySelect = (value: string) => {
		setSelectedCommunity(value);
		setCriteria((prev) => ({ ...prev, developmentName: value }));
	};

	const handleCheckboxChange = (
		name: "propertyTypes" | "features",
		value: string,
		checked: boolean
	) => {
		setCriteria((prev) => {
			const arr = new Set(prev[name]);
			checked ? arr.add(value) : arr.delete(value);
			return { ...prev, [name]: Array.from(arr) };
		});
	};

	const handleAddCriteria = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!criteria.city) {
			toast("Please select a city");
			return;
		}
		try {
			await axios.post(`/api/leads/${lead.id || lead._id}/criteria`, criteria);
			toast("Criteria added successfully!");
			setCriteria({
				city: "",
				developmentName: "",
				beds: "",
				baths: "",
				minPrice: "",
				maxPrice: "",
				propertyTypes: [],
				features: [],
			});
			setSelectedCity("");
			setSelectedCommunity("");
			await refreshLead();
		} catch {
			toast.error("Failed to add criteria");
		}
	};

	const handleDeleteCriteria = async (id: string) => {
		try {
			await axios.delete(`/api/leads/${lead.id || lead._id}/criteria/${id}`);
			toast("Criteria removed");
			await refreshLead();
		} catch {
			toast.error("Failed to delete criteria");
		}
	};

	const handleEditTitle = async (id: string) => {
		try {
			await axios.put(`/api/leads/${lead.id || lead._id}/criteria/${id}`, { name: editingTitleValue });
			toast.success("Title updated successfully!");
			setEditingTitleId(null);
			await refreshLead();
		} catch {
			toast.error("Failed to update title");
		}
	};

	const filteredCities = CityList.filter((c) => {
		const matchesSearch = c
			?.toLowerCase()
			.includes(citySearch.toLowerCase());
		return matchesSearch;
	});
	const filteredCommunities = communities.filter((comm) => {
		const matchesSearch = comm.name
			?.toLowerCase()
			.includes(comSearch.toLowerCase());
		return matchesSearch;
	});
	return (
		<Card>
			<CardHeader>
				<CardTitle>Property Criteria</CardTitle>
				<CardDescription>
					Lead’s preferred search filters
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<form onSubmit={handleAddCriteria} className="space-y-3">
					{/* City / Community */}
					<div className="grid grid-cols-2 gap-2">
						<Select
							value={selectedCity}
							onValueChange={handleCitySelect}>
							<SelectTrigger>
								<SelectValue placeholder="Select City" />
							</SelectTrigger>
							<SelectContent>
								<Input
									placeholder="Search city..."
									onChange={(e) => {
										const search = e.target.value.toLowerCase();
										setCitySearch(search);
									}}
									className="m-2"
								/>
								{filteredCities.map((city) => (
									<SelectItem key={city} value={city}>
										{city}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={selectedCommunity}
							onValueChange={handleCommunitySelect}
							disabled={!selectedCity}>
							<SelectTrigger>
								<SelectValue placeholder="Select Community" />
							</SelectTrigger>
							<SelectContent>
								<Input
									placeholder="Search community..."
									onChange={(e) => {
										const search = e.target.value.toLowerCase();
										setComSearch(search);
									}}
									className="m-2"
								/>
								{filteredCommunities?.map((community) => (
									<SelectItem
										key={community.name}
										value={community.name}>
										{community.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Beds & Baths */}
					<div className="grid grid-cols-2 gap-2">
						<Select
							value={criteria.beds}
							onValueChange={(v) =>
								setCriteria({ ...criteria, beds: v })
							}>
							<SelectTrigger>
								<SelectValue placeholder="Beds" />
							</SelectTrigger>
							<SelectContent>
								{bedBathOptions.map((v) => (
									<SelectItem key={v} value={v}>
										{v}
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Select
							value={criteria.baths}
							onValueChange={(v) =>
								setCriteria({ ...criteria, baths: v })
							}>
							<SelectTrigger>
								<SelectValue placeholder="Baths" />
							</SelectTrigger>
							<SelectContent>
								{bedBathOptions.map((v) => (
									<SelectItem key={v} value={v}>
										{v}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Price Range */}
					<div className="grid grid-cols-2 gap-2">
						<Input
							name="minPrice"
							value={criteria.minPrice}
							onChange={handleChange}
							placeholder="Min Price"
						/>
						<Input
							name="maxPrice"
							value={criteria.maxPrice}
							onChange={handleChange}
							placeholder="Max Price"
						/>
					</div>

					{/* Property Types */}
					<div>
						<p className="text-sm font-medium mb-2">Property Types</p>
						<div className="flex flex-wrap gap-3">
							{propertyTypeOptions.map((type) => (
								<div key={type} className="flex items-center gap-2">
									<Checkbox
										id={`ptype-${type}`}
										checked={criteria.propertyTypes.includes(type)}
										onCheckedChange={(checked) =>
											handleCheckboxChange(
												"propertyTypes",
												type,
												!!checked
											)
										}
									/>
									<label htmlFor={`ptype-${type}`} className="cursor-pointer">{type}</label>
								</div>
							))}
						</div>
					</div>

					{/* Features */}
					<div>
						<p className="text-sm font-medium mb-2">Features</p>
						<div className="flex flex-wrap gap-3">
							{featureOptions.map((feature) => (
								<div
									key={feature}
									className="flex items-center gap-2">
									<Checkbox
										id={`feat-${feature}`}
										checked={criteria.features.includes(feature)}
										onCheckedChange={(checked) =>
											handleCheckboxChange(
												"features",
												feature,
												!!checked
											)
										}
									/>
									<label htmlFor={`feat-${feature}`} className="cursor-pointer">{feature}</label>
								</div>
							))}
						</div>
					</div>

					<Button type="submit" className="w-full">
						Add Criteria
					</Button>
				</form>

				{/* Display Criteria */}
				{lead.propertyCriteria?.length ? (
					<div className="space-y-2">
						{lead.propertyCriteria.map((c: any) => (
							<div
								key={c._id}
								className="p-2 border rounded flex items-center justify-between">
								<div className="flex flex-col w-full text-sm">
									{editingTitleId === c._id ? (
										<div className="flex items-center gap-2 mb-1">
											<Input 
												value={editingTitleValue} 
												onChange={(e) => setEditingTitleValue(e.target.value)} 
												className="h-7 text-xs py-0"
											/>
											<Button onClick={() => handleEditTitle(c._id)} size="sm" className="h-7 px-2">
												<Check className="w-3 h-3" />
											</Button>
											<Button onClick={() => setEditingTitleId(null)} size="sm" variant="outline" className="h-7 px-2">
												<X className="w-3 h-3" />
											</Button>
										</div>
									) : (
										<p className="font-bold flex items-center gap-2">
											{c.name || `${c.city} • ${c.developmentName}`}
											<button 
												onClick={() => {
													setEditingTitleId(c._id);
													setEditingTitleValue(c.name || `${c.city} • ${c.developmentName}`);
												}}
												className="text-gray-400 hover:text-blue-500"
											>
												<Edit2 className="w-3 h-3" />
											</button>
										</p>
									)}
									<p className="text-gray-500 text-xs mt-1">
										<b>{c.city}</b> {c.developmentName ? `• ${c.developmentName}` : ""}
									</p>
									<p>
										{c.beds} Beds / {c.baths} Baths
									</p>
									<p>
										${c.minPrice} - ${c.maxPrice}
									</p>
									{c.propertyTypes?.length > 0 && (
										<p>Types: {Array.isArray(c.propertyTypes) ? c.propertyTypes.join(", ") : c.propertyTypes}</p>
									)}
									{c.features?.length > 0 && (
										<p>Features: {Array.isArray(c.features) ? c.features.join(", ") : c.features}</p>
									)}
								</div>
								<div className="flex flex-col gap-2">
									<Button
										onClick={() => handleDeleteCriteria(c._id)}
										variant="destructive"
										size="icon">
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</div>
						))}
					</div>
				) : (
					<p className="text-sm text-muted-foreground">
						No property criteria yet.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
