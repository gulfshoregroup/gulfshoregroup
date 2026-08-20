"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Home,
	Wrench,
	Shield,
	Users,
	Calendar,
	FileText,
} from "lucide-react";

const services = [
	{
		icon: Home,
		title: "Property Oversight",
		description:
			"Complete day-to-day management of your property with attention to every detail.",
	},

	{
		icon: Shield,
		title: "Concierge Services",
		description:
			"We provide personalized concierge services designed to make your life easier, smoother, and stress-free.",
	},

	{
		icon: Calendar,
		title: "Seasonal Coordination",
		description:
			"Seamless management for seasonal residents and vacation property scheduling.",
	},
];

export default function ServicesSection() {
	return (
		<section id="services" className="py-24 md:py-32 bg-background">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-16">
					<p className="text-muted-foreground text-sm font-serif tracking-widest uppercase mb-4">
						Our Expertise
					</p>
					<h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
						Comprehensive Property Services
					</h2>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
						From day-to-day oversight to urgent needs, we handle every
						aspect of property management with professionalism and
						transparency.
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{services.map((service, index) => {
						const Icon = service.icon;
						return (
							<Card
								key={index}
								className="py-2 border border-border hover:border-primary/50 transition-colors">
								<CardHeader>
									<div className="mb-4 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
										<Icon className="text-primary" size={24} />
									</div>
									<CardTitle className="font-serif text-xl">
										{service.title}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-base leading-relaxed">
										{service.description}
									</CardDescription>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</section>
	);
}
