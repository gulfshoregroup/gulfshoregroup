import type { Metadata } from "next";

export const metadata: Metadata = {
	title:
		"GulfShore Group | Property Management in Naples, Florida & Surrounding Areas",
	description:
		"Premium property management services in Naples, Marco Island, Bonita Springs, and surrounding coastal communities. Expert hands-on concierge service.",
	icons: {
		icon: [
			{
				url: "/icon-light-32x32.png",
				media: "(prefers-color-scheme: light)",
			},
			{
				url: "/icon-dark-32x32.png",
				media: "(prefers-color-scheme: dark)",
			},
			{
				url: "/icon.svg",
				type: "image/svg+xml",
			},
		],
		apple: "/apple-icon.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`font-sans antialiased`}>{children}</body>
		</html>
	);
}
