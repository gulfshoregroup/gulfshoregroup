import { redirect } from "next/navigation";

type Props = {
	params: { city: string };
};

export default async function Page(params: { city: string }) {
	const city = (await params).city;
	return redirect(`/Florida-Real-Estate-Search/${city}`);
}
