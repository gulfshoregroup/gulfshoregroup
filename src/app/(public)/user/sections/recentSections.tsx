"use client";
import { useEffect, useState } from "react";
import RecentProperties from "./recentProperties";
import RecentSearch from "./recentSearch";
import axios from "axios";

function RecentSections() {
	const [recentProperties, setRecentProperties] = useState<any[]>([]);
	const [recentSearch, setRecentSearch] = useState<any[]>([]);
	const [errors, setError] = useState<any>("");
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		const fetchdata = async () => {
			try {
				setLoading(true);
				const res = await axios.get("/api/v2/user/activity");
				const data = res.data.data;
				setRecentSearch(data.searchHistory);
				setRecentProperties(data.viewedProperties);
				setLoading(false);
			} catch (error) {
				setError(error);
			} finally {
				setLoading(false);
			}
		};

		fetchdata();
	}, []);

	if (loading) {
		return <div></div>;
	}
	if (errors) return null;
	return (
		<div className="flex flex-col my-1 space-y-2">
			<RecentSearch data={recentSearch} />
			<RecentProperties data={recentProperties} />
		</div>
	);
}

export default RecentSections;
