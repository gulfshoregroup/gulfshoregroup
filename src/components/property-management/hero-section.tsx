"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function HeroSection() {
	return (
		<section className="relative bg-gradient-to-br from-secondary via-background to-background py-24 md:py-32">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
					<div>
						<h1 className="text-muted-foreground text-sm font-serif tracking-widest uppercase mb-4">
							Gulfshoregroup Premium Property Management
						</h1>
						<h2 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight">
							Complete Peace of Mind
						</h2>
						<p className="text-lg text-muted-foreground mb-8 leading-relaxed">
							At GulfShore Group, we provide premium, hands-on
							concierge property management throughout Naples, Marco
							Island, Bonita Springs, Estero, and surrounding coastal
							communities.
						</p>
						<div className="flex flex-col sm:flex-row gap-4">
							<Button
								onClick={() =>
									document
										.getElementById("contact")
										?.scrollIntoView({ behavior: "smooth" })
								}
								className="bg-primary text-primary-foreground hover:bg-primary/90">
								Get Started
							</Button>
							<Button variant="outline">Learn More</Button>
						</div>
					</div>
					<div className="hidden md:block">
						<div className="relative h-96 bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden">
							<Image
								src="https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289237/hero-bg_dy8ttf.jpg"
								alt="Luxury waterfront property"
								fill
								priority
								className="object-cover"
							/>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
