"use client";

import { useEffect, useState } from "react";
import { fetchClientGeneralSettings } from "@/lib/general-settings-client";

/**
 * The admin-editable site name, as a tiny client "island" so the rest of the
 * footer can render with no client JavaScript. Loads when the browser is idle
 * (shares one cached request with the navbar).
 */
export default function SiteName({ fallback = "GulfshoreGroup" }: { fallback?: string }) {
	const [name, setName] = useState(fallback);
	useEffect(() => {
		const load = () =>
			fetchClientGeneralSettings()
				.then((data) => data.siteName && setName(data.siteName))
				.catch(() => {});
		const w = window as any;
		if (typeof w.requestIdleCallback === "function") {
			const id = w.requestIdleCallback(load, { timeout: 4000 });
			return () => w.cancelIdleCallback?.(id);
		}
		const t = setTimeout(load, 2000);
		return () => clearTimeout(t);
	}, []);
	return <>{name}</>;
}
