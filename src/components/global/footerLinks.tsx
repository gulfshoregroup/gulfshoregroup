import { Facebook, Instagram, Search } from "lucide-react";
import Link from "next/link";

interface FooterLink {
	href: string;
	label: string;
}

const FooterLinks = () => {
	const links: FooterLink[] = [
		{
			href: "/",
			label: "Gulfshoregroup",
		},
		{ href: "/about", label: "About Us" },
		{ href: "/contact", label: "Contact Us" },
		{ href: "/sell", label: "Home Valuation" },

		// ... more links
	];

	const exploreCities: FooterLink[] = [
		{
			href: "/explore/Naples",
			label: "Naples, FL",
		},
		{
			href: "/explore/Immokalee",
			label: "Immokalee, FL",
		},
		{
			href: "/explore/Marco-Island",
			label: "Marco Island, FL",
		},
		{
			href: "/explore/Sanibel",
			label: "Sanibel, FL",
		},
		{
			href: "/explore/Bonita-Springs",
			label: "Bonita Springs, FL",
		},
		{
			href: "/explore/Fort-Myers",
			label: "Fort Myers, FL",
		},
		{
			href: "/explore/Cape-Coral",
			label: "Cape Coral FL",
		},
		// ... more cities
	];

	return (
		<>
			<div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(70px,1fr))]">
				<div className="space-y-2 col-span-3">
					<h4 className="font-medium text-xl">Quick Links</h4>
					<ul className="space-y-1">
						{links.map((link) => (
							<li key={link.href}>
								<Link
									prefetch={false}
									href={link.href}
									className="hover:underline font-normal">
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
				{/* Explore Cities */}
				<div className="space-y-2 col-span-3">
					<h4 className="font-medium text-xl">Explore Cities</h4>
					<ul className="space-y-1">
						{exploreCities.map((city) => (
							<li key={city.href}>
								<Link
									prefetch={false}
									href={city.href}
									className="hover:underline font-normal">
									{city.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
				{/* Example of another section (e.g., Contact) */}
				<div className="space-y-2 col-span-3">
					<h4 className="font-medium text-xl">Contact Us</h4>
					<ul className="space-y-1">
						<li>
							<a
								href="tel:+1 239-992-9119"
								className="hover:underline font-normal">
								+1 (239) 992-9119
							</a>
						</li>
						<li>
							<a
								href="mailto:mailbox@gulfshoregroup.com"
								className="hover:underline font-normal">
								mailbox@gulfshoregroup.com
							</a>
						</li>
					</ul>
				</div>
				{/* Example of a 4th section (e.g., Social Media) */}
				<div className="space-y-2 col-span-3">
					<h4 className="font-medium text-xl">Follow Us</h4>
					<ul className="space-y-1">
						<li>
							<Link
								prefetch={false}
								target="_blank"
								href="https://www.facebook.com/share/1Kc3pRfpPr/"
								className="hover:underline font-light text-blue-500">
								Facebook
							</Link>
						</li>

						<li>
							<Link
								prefetch={false}
								target="_blank"
								href="https://www.instagram.com/gulfshoregroup_florida/"
								className="hover:underline font-light text-blue-500">
								Instagram
							</Link>
						</li>
					</ul>
				</div>
			</div>
		</>
	);
};

export default FooterLinks;
