"use client";

import React, { useState, useEffect } from "react";
import MarketReportSection from "@/components/search/marketReportSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminMarketReportsPage() {
	const [cityInput, setCityInput] = useState("");
	const [activeCity, setActiveCity] = useState("Naples"); // Default city
	const [cities, setCities] = useState<{name: string}[]>([]);

	useEffect(() => {
		fetch("/api/v2/cities?limit=100")
			.then(res => res.json())
			.then(data => {
				if (Array.isArray(data)) {
					setCities(data);
				} else if (data && Array.isArray(data.data)) {
					setCities(data.data);
				}
			})
			.catch(err => console.error("Error fetching cities", err));
	}, []);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (cityInput.trim()) {
			setActiveCity(cityInput.trim());
		}
	};

	return (
		<div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-8 px-4">
			<div>
				<h1 className="text-3xl font-bold tracking-tight mb-2">Market Reports</h1>
				<p className="text-muted-foreground">
					View the live Monthly Market Report statistics for any city. These are exactly what users see on the public website.
				</p>
			</div>

		<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
				<form onSubmit={handleSearch} className="flex gap-4 items-end max-w-md">
					<div className="flex-1 space-y-2">
						<label className="text-sm font-medium">Select City</label>
						<Select value={cityInput} onValueChange={(val) => setCityInput(val)}>
							<SelectTrigger className="w-full bg-white">
								<SelectValue placeholder="Select a city..." />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="All">All Cities</SelectItem>
								{cities.map((city) => (
									<SelectItem key={city.name} value={city.name}>
										{city.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Button type="submit">
						<Search className="w-4 h-4 mr-2" />
						Generate Report
					</Button>
				</form>
			</div>

			<div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden pt-4">
				<MarketReportSection city={activeCity} />
			</div>
		</div>
	);
}
