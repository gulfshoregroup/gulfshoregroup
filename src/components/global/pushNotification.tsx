"use client";
import OneSignal from "react-onesignal";

import { useEffect, useState } from "react";

const OneSignalSetup = () => {
	const [initialized, setInitialized] = useState(false);
	useEffect(() => {
		if (typeof window !== "undefined") {
			if (initialized) {
				return;
			}
			OneSignal.init({
				appId: "3d518653-fe92-44ae-8e74-882e36c738a5",
				safari_web_id:
					"web.onesignal.auto.5abdae74-1423-41c2-a45a-5cf3c8870ffd",
			})
				.then(() => {
					setInitialized(true);
					OneSignal.Slidedown.promptPush();
					console.log("OneSignal SDK initialized");
				})
				.catch((error) => {
					console.error("OneSignal initialization error:", error);
				});
		}
	}, []);

	return null;
};

export default OneSignalSetup;
