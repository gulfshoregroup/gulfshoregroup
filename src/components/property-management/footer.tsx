"use client";

export default function Footer() {
	const currentYear = new Date().getFullYear();

	return (
		<footer className="bg-primary text-primary-foreground py-12 md:py-16">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
					<div>
						<h3 className="text-2xl font-serif font-bold mb-4">
							GulfShore Group
						</h3>
						<p className="text-primary-foreground/80 leading-relaxed">
							At GulfShore Group, we provide premium, hands-on
							concierge property management throughout Naples, Marco
							Island, Bonita Springs, Estero, and surrounding coastal
							communities.
						</p>
					</div>

					<div>
						<h4 className="font-serif font-semibold mb-4">
							Quick Links
						</h4>
						<ul className="space-y-2">
							<li>
								<a
									href="#services"
									className="hover:text-primary-foreground transition-colors">
									Services
								</a>
							</li>
							<li>
								<a
									href="#about"
									className="hover:text-primary-foreground transition-colors">
									About
								</a>
							</li>
							<li>
								<a
									href="#contact"
									className="hover:text-primary-foreground transition-colors">
									Contact
								</a>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="font-serif font-semibold mb-4">Contact</h4>
						<p className="text-primary-foreground/80 mb-2">
							mailbox@gulfshoregroup.com
						</p>
						<p className="text-primary-foreground/80">
							+1 (239) 992-9119
						</p>
					</div>
				</div>

				<div className="border-t border-primary-foreground/20 pt-8">
					<p className="text-center text-primary-foreground/60 text-sm">
						© {currentYear} GulfShore Group. All rights reserved. |
						Premium Property Management
					</p>
				</div>
			</div>
		</footer>
	);
}
