import { redirect } from "next/navigation";

type Props = {
	params: {
		city: string;
		community: string;
	};
};

export default async function Page(params: {
	city: string;
	community: string;
}) {
	const param = await params;
	return redirect(
		`/Florida-Real-Estate-Search/${param.city}/${param.community}`
	);
}
