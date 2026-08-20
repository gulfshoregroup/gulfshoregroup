import axios from "axios";

export default async function fetchProperty(id: string) {
	try {
		const response = await axios.get(`/api/v2/properties/${id}`);
		return response.data;
	} catch (error) {
		console.error(error);
	}
}
