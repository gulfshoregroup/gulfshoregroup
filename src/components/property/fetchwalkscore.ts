'use server'
import axios from "axios";

export default async function fetchWalkScore ({
	latitude,
	longitude,
	address,

}: {
	latitude: number;
	longitude: number;
	address: string;
}) {
	try {
		const encodedAddress = encodeURIComponent(address);
		const apiKey = process.env.NEXT_PUBLIC_WALK_SCORE_API;
		const url = `https://api.walkscore.com/score?format=json&address=${encodedAddress}&lat=${latitude}&lon=${longitude}&transit=1&bike=1&wsapikey=${apiKey}`;

		const response = await axios.get(url);
		const data = response.data;
        // console.log(data);
        return data;
		// setWalkScoreData(data);
	} catch (error) {
        console.error("Error fetching Walk Score:", error);
        return null;
	}
};
