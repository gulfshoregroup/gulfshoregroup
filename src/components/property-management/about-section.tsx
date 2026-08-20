"use client";

import Image from "next/image";

export default function AboutSection() {
	const areas = [
		"Naples",
		"Marco Island",
		"Bonita Springs",
		"Estero",
		"Surrounding Coastal Communities",
	];

	return (
		<section id="about" className="py-24 md:py-32 bg-secondary/30">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
					<div className="relative h-[350px] md:h-[500px] w-full">
						<Image
							src="https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289517/b8116620c2365c422108705cbb609f57_m9ddcy.jpg"
							alt="GulfShore Group office"
							fill
							className="rounded-lg object-cover shadow-lg"
						/>
					</div>
					<div>
						<p className="text-muted-foreground text-sm font-serif tracking-widest uppercase mb-4">
							About GulfShore Group
						</p>
						<h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">
							Deep Local Expertise
						</h2>
						<p className="text-lg text-muted-foreground mb-6 leading-relaxed">
							With deep local expertise and a commitment to
							exceptional care, we ensure your property is always
							protected, well-maintained, and managed to the highest
							standard.
						</p>
						<p className="text-lg text-muted-foreground mb-8 leading-relaxed">
							Whether you live in Southwest Florida full-time, visit
							seasonally, or own an investment property, GulfShore
							Group is here to make property ownership effortless. We
							manage every detail with discretion, reliability, and a
							personalized touch, ensuring your home remains secure,
							well-maintained, and guest-ready at all times. Our
							tailored approach means your priorities become our
							priorities, allowing you to enjoy your property without
							the stress of daily oversight. At GulfShore Group, we
							provide premium, hands-on concierge property management
							throughout Naples, Marco Island, Bonita Springs, Estero,
							and the surrounding coastal communities.
						</p>

						<div>
							<h3 className="text-xl font-serif font-semibold text-foreground mb-4">
								Service Areas
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								{areas.map((area, index) => (
									<div
										key={index}
										className="flex items-center gap-3">
										<div className="w-2 h-2 bg-primary rounded-full"></div>
										<p className="text-muted-foreground">{area}</p>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
