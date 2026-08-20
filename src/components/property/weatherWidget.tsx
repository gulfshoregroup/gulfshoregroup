"use client";
import { useEffect } from "react";

export default function WeatherWidget({ city = "Naples" }: { city?: string }) {
	useEffect(() => {
		// Avoid adding the script multiple times
		if (!document.getElementById("weatherwidget-io-js")) {
			const script = document.createElement("script");
			script.src = "https://weatherwidget.io/js/widget.min.js";
			script.id = "weatherwidget-io-js";
			script.async = true;
			document.body.appendChild(script);
		}
	}, []);

	const cityIds: { [key: string]: string } = {
		naples: "26d14n81d79",
		estero: "26d44n81d81",
		"bonita-springs": "26d34n81d78",
		"cape-coral": "26d56n81d95",
		"fort-myers": "26d64n81d87",
		immokalee: "26d42n81d42",
		"ave-maria": "26d34n81d44",
		"babcock-ranch": "26d88n81d73/33982",
		"lehigh-acres": "26d63n81d62",
		"marco-island": "25d94n81d71",
		sanibel: "26d45n82d02",
	};

	// Fallback to "Naples" if city is undefined or empty
	const safeCity = city || "Naples";

	// Normalize city name to match the key
	const cityName = safeCity.toLowerCase().trim().replace(/\s+/g, "-");

	// Safely get URL
	const url = (cityIds[cityName] || cityIds["naples"]) + "/" + cityName;
	
	return (
		<div className="py-4">
			<a
				className="weatherwidget-io"
				href={`https://forecast7.com/en/${url}/?unit=us`}
				data-label_1={safeCity.toUpperCase() + " FL"}
				data-label_2="WEATHER"
				data-font="Roboto"
				data-icons="Climacons"
				data-days="5"
				data-theme="clear">
				{safeCity.toUpperCase()}, FL
			</a>
		</div>
	);
}

