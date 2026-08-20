import { SignIn } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function VerifyUser() {
	const { userId } = await auth();

	if (!userId) {
		return <SignIn />;
	}

	// Get the Backend API User object when you need access to the user's information
	const user = await currentUser();

	return user;
}
