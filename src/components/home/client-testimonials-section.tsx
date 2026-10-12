"use client";

import Image from "next/image";
import { useState } from "react";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
	{
		name: "Bob J.",
		location: "Naples, FL",
		text: "It was all due to his well organized effort of carting us from place to place and then being smart enough to spot a great deal for us in a building we really wanted to be in. Dimitri laid out a large number of condos for us to look at in different areas based on our requests. Within a few weeks he identified a new listing in the building and we bought it on the spot.",
		rating: 5,
	},
	{
		name: "Michael A.",
		location: "Canada → Naples, FL",
		text: "Living in Canada and purchasing in Florida could have been challenging but he made it so easy! From the first telephone conversation to taking the time on our trip down to show us all the communities and amenities, we were thoroughly impressed. His approach is professional, informative and caring. Could not believe the amount of time and effort they spent with us.",
		rating: 5,
	},
	{
		name: "Mary Z.",
		location: "Southwest Florida",
		text: "Dimitri was wonderful to work with and went above and beyond to help us find the property with the specific attributes and environment we were searching for in our home. He effectively introduced us to the SW Florida lifestyle. We couldn't have asked for a better realtor.",
		rating: 5,
	},
	{
		name: "Jerry B.",
		location: "Naples, FL",
		text: "Dimitri found us just the right neighborhood and even got us a great deal on a house full of furniture. All of this from 1500 miles away. He moved us up the property ladder by helping us buy a vacation home then sell it and later purchase a larger one. I can't imagine anyone doing it better than him.",
		rating: 5,
	},
	{
		name: "David C.",
		location: "Naples, FL",
		text: "At no point in those five months did his dedication to selling our property disappoint us. He is a skilled listener and negotiator, with very in-depth knowledge of the local markets. We listed two properties with him at the same time. Without doubt, we would seek him out immediately for any upcoming real estate transaction in the future.",
		rating: 5,
	},
];

export default function ClientTestimonialsSection() {
	const [active, setActive] = useState(0);

	const prev = () =>
		setActive((i) => (i - 1 + testimonials.length) % testimonials.length);
	const next = () => setActive((i) => (i + 1) % testimonials.length);

	const current = testimonials[active];

	return (
		<section className="w-full py-16 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-hidden">
			<div className="w-11/12 lg:max-w-5xl mx-auto">
				{/* Heading */}
				<div className="text-center mb-12">
					<p className="text-primary text-sm font-semibold uppercase tracking-widest mb-2">
						Client Stories
					</p>
					<h2 className="text-2xl lg:text-3xl font-semibold text-gray-900">
						What Our Happy Clients Say
					</h2>
					<p className="mt-3 text-gray-500 text-sm max-w-md mx-auto">
						Real experiences from real people who found their dream homes in
						Southwest Florida with Gulfshore Group.
					</p>
				</div>

				{/* Main card */}
				<div className="grid lg:grid-cols-5 gap-0 rounded-2xl shadow-xl overflow-hidden border border-gray-100 bg-white">
					{/* Left — Realtor image panel */}
					<div className="lg:col-span-2 relative min-h-72 lg:min-h-auto bg-gradient-to-br from-slate-800 to-slate-900">
						<Image
							src="https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289211/Dimitri-schwarz_r9ognl.jpg"
							alt="Dimitri Schwarz - Professional Realtor at Gulfshore Group"
							fill
							unoptimized
							className="object-cover object-top opacity-80 mix-blend-luminosity"
						/>
						{/* Overlay gradient */}
						<div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-800/30 to-transparent" />

						{/* Stat badges */}
						<div className="absolute bottom-6 left-6 right-6 space-y-3">
							<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
								<p className="text-white font-bold text-2xl">180+</p>
								<p className="text-white/70 text-xs">Successful Sales</p>
							</div>
							<div className="flex gap-3">
								<div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
									<p className="text-white font-bold text-lg">20+</p>
									<p className="text-white/70 text-xs">Years Exp.</p>
								</div>
								<div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/20 text-center">
									<p className="text-white font-bold text-lg">5★</p>
									<p className="text-white/70 text-xs">Avg. Rating</p>
								</div>
							</div>
						</div>

						{/* Realtor name */}
						<div className="absolute top-6 left-6">
							<p className="text-white font-semibold text-sm">Dimitri Schwarz</p>
							<p className="text-white/60 text-xs">Licensed Realtor · SWFL</p>
						</div>
					</div>

					{/* Right — testimonial panel */}
					<div className="lg:col-span-3 flex flex-col justify-between p-8 lg:p-10">
						{/* Quote icon */}
						<div className="flex items-start gap-4 mb-6">
							<div className="shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
								<Quote className="w-5 h-5 text-primary" />
							</div>
							{/* Stars */}
							<div className="flex gap-1 pt-2">
								{Array.from({ length: current.rating }).map((_, i) => (
									<Star
										key={i}
										className="w-4 h-4 text-amber-400 fill-amber-400"
									/>
								))}
							</div>
						</div>

						{/* Review text */}
						<blockquote className="flex-1">
							<p className="text-gray-700 text-base leading-relaxed italic">
								&ldquo;{current.text}&rdquo;
							</p>
						</blockquote>

						{/* Client info + navigation */}
						<div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
							<div>
								<p className="font-semibold text-gray-900">{current.name}</p>
								<p className="text-sm text-gray-500">{current.location}</p>
							</div>

							{/* Navigation */}
							<div className="flex items-center gap-3">
								<span className="text-xs text-gray-400">
									{active + 1} / {testimonials.length}
								</span>
								<button
									onClick={prev}
									aria-label="Previous testimonial"
									className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-primary transition-all duration-200">
									<ChevronLeft className="w-4 h-4 text-gray-600" />
								</button>
								<button
									onClick={next}
									aria-label="Next testimonial"
									className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-all duration-200">
									<ChevronRight className="w-4 h-4 text-white" />
								</button>
							</div>
						</div>

						{/* Dots */}
						<div className="flex gap-2 mt-4">
							{testimonials.map((_, i) => (
								<button
									key={i}
									onClick={() => setActive(i)}
									aria-label={`Go to testimonial ${i + 1}`}
									className={`h-1.5 rounded-full transition-all duration-300 ${
										i === active ? "w-6 bg-primary" : "w-1.5 bg-gray-200"
									}`}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
