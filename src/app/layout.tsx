import type { Metadata } from "next";
import "./globals.css";
import { Inter, Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import StoreProvider from "../state/StoreProvider";
import Script from "next/script";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});
const poppins = Poppins({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-poppins",
	display: "swap",
});

import UtmTracker from "../components/global/utmTracker";
import ForcedLoginModal from "../components/auth/ForcedLoginModal";
import MissingPhoneModal from "../components/auth/MissingPhoneModal";

export const metadata: Metadata = {
	title: "Naples Florida Real Estate Office - GULFSHORE GROUP",
	description:
		"Gulfshore Group Naples Florida Real Estate Office For Naples Florida Real Estate Properties and Surrounding Area. Find Condos, Homes and Vacant Land.",
	keywords:
		"SWFlorida Real Estate, Homes For Sale in Naples Florida, Southwest Florida Real Estate, Condos, Vacant Land, Waterfront Homes",
	openGraph: {
		type: "website",
		url: "https://gulfshoregroup.com",
		title: "Naples Florida Real Estate Office - GULFSHORE GROUP",
		description:
			"Gulfshore Group - Find the best homes, condos, and land for sale in Naples and Southwest Florida.",
		images: [
			{
				url: "https://gulfshoregroup.com/logo.png",
				width: 1200,
				height: 630,
				alt: "Gulfshore Group Logo",
			},
		],
		siteName: "Gulfshore Group",
	},
	twitter: {
		card: "summary_large_image",
		title: "Naples Florida Real Estate Office - GULFSHORE GROUP",
		description:
			"Gulfshore Group - Find the best real estate listings in Naples and Southwest Florida.",
		images: ["https://gulfshoregroup.com/logo.png"],
		site: "@GulfshoreGroup",
	},
	icons: {
		icon: "/logo.svg",
		apple: "/apple-touch-icon.png",
	},
	robots: "index, follow",
	authors: [{ name: "Gulfshore Group" }],
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ClerkProvider
			appearance={{
				layout: {
					termsPageUrl: "/terms",
					privacyPageUrl: "/policy",
				},
				variables: {
					colorPrimary: "#d90429",
				},
			}}>
			<html
				lang="en"
				suppressHydrationWarning
				className={`${inter.variable} ${poppins.variable}`}>
				<head>
					<link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
					<link rel="dns-prefetch" href="https://res.cloudinary.com" />
					<link rel="preconnect" href="https://dvvjkgh94f2v6.cloudfront.net" crossOrigin="anonymous" />
					<link rel="dns-prefetch" href="https://dvvjkgh94f2v6.cloudfront.net" />
					<link rel="preconnect" href="https://maps.googleapis.com" />
					<link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
					<link rel="dns-prefetch" href="https://maps.googleapis.com" />
					<link rel="dns-prefetch" href="https://maps.gstatic.com" />
					<link rel="preconnect" href="https://cdn.onesignal.com" />
					<link rel="preconnect" href="https://www.googletagmanager.com" />
				</head>
				<body className="antialiased">
					<script
						dangerouslySetInnerHTML={{
							__html: `
							window.addEventListener('error', function(event) {
								fetch('/api/v2/log-error', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({
										message: event.message,
										stack: event.error ? event.error.stack : null,
										url: window.location.href
									})
								}).catch(function() {});
							});
							window.addEventListener('unhandledrejection', function(event) {
								fetch('/api/v2/log-error', {
									method: 'POST',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({
										message: event.reason ? event.reason.message : 'Unhandled Rejection',
										stack: event.reason ? event.reason.stack : null,
										url: window.location.href
									})
								}).catch(function() {});
							});
							`
						}}
					/>
					<StoreProvider>
						<UtmTracker />
						<ForcedLoginModal />
						<MissingPhoneModal />
						{children}
					</StoreProvider>

					<Script
						id="onesignal-deferred-loader"
						strategy="lazyOnload"
						dangerouslySetInnerHTML={{
							__html: `
							(function() {
								if (window.location.hostname !== "gulfshoregroup.com" && window.location.hostname !== "www.gulfshoregroup.com") return;
								var loaded = false;
								function loadOneSignal() {
									if (loaded) return;
									loaded = true;
									window.removeEventListener('scroll', loadOneSignal);
									window.removeEventListener('click', loadOneSignal);
									window.removeEventListener('touchstart', loadOneSignal);
									var script = document.createElement('script');
									script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
									script.async = true;
									script.onload = function() {
										window.OneSignalDeferred = window.OneSignalDeferred || [];
										window.OneSignalDeferred.push(function(OneSignal) {
											OneSignal.init({
												appId: "3d518653-fe92-44ae-8e74-882e36c738a5",
												safari_web_id: "web.onesignal.auto.5abdae74-1423-41c2-a45a-5cf3c8870ffd",
											});
										});
									};
									document.head.appendChild(script);
								}
								window.addEventListener('scroll', loadOneSignal, { passive: true, once: true });
								window.addEventListener('click', loadOneSignal, { once: true });
								window.addEventListener('touchstart', loadOneSignal, { passive: true, once: true });
								setTimeout(loadOneSignal, 4500);
							})();
							`,
						}}
					/>
					<Script
						src="https://www.googletagmanager.com/gtag/js?id=G-1VDEW2DPN8"
						strategy="lazyOnload"
					/>
					<Script
						id="google-analytics"
						strategy="lazyOnload"
						dangerouslySetInnerHTML={{
							__html: `
							window.dataLayer = window.dataLayer || [];
							function gtag(){dataLayer.push(arguments);}
							gtag('js', new Date());
							gtag('config', 'G-1VDEW2DPN8', { send_page_view: true });
						`,
						}}
					/>
				</body>
			</html>
		</ClerkProvider>
	);
}
