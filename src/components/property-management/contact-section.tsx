"use client";

import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactSection() {
	// const [formData, setFormData] = useState({
	// 	name: "",
	// 	email: "",
	// 	phone: "",
	// 	message: "",
	// });

	// const [submitted, setSubmitted] = useState(false);

	// const handleInputChange = (
	// 	e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	// ) => {
	// 	const { name, value } = e.target;
	// 	setFormData((prev) => ({ ...prev, [name]: value }));
	// };

	// const handleSubmit = (e: React.FormEvent) => {
	// 	e.preventDefault();
	// 	// Handle form submission here
	// 	console.log("Form submitted:", formData);
	// 	setSubmitted(true);
	// 	setTimeout(() => {
	// 		setSubmitted(false);
	// 		setFormData({ name: "", email: "", phone: "", message: "" });
	// 	}, 3000);
	// };

	return (
		<section id="contact" className="py-24 md:py-32 bg-background">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-12">
					{/* Contact Information */}
					<div>
						<p className="text-muted-foreground text-sm font-serif tracking-widest uppercase mb-4">
							Get in Touch
						</p>
						<h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-8">
							Ready to Experience Excellence?
						</h2>

						<div className="space-y-6">
							<div className="flex gap-4">
								<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
									<Mail className="text-primary" size={24} />
								</div>
								<div>
									<h3 className="font-serif font-semibold text-foreground mb-1">
										Email
									</h3>
									<p className="text-muted-foreground">
										<a href="mailto:mailbox@gulfshoregroup.com">
											mailbox@gulfshoregroup.com
										</a>
									</p>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
									<Phone className="text-primary" size={24} />
								</div>
								<div>
									<h3 className="font-serif font-semibold text-foreground mb-1">
										Phone
									</h3>
									<p className="text-muted-foreground">
										<a href="tel:+12399929119"> +1 (239) 992-9119</a>
									</p>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
									<MapPin className="text-primary" size={24} />
								</div>
								<div>
									<h3 className="font-serif font-semibold text-foreground mb-1">
										Primary Contact
									</h3>
									<p className="text-muted-foreground">
										Dimitri Schwarz
									</p>
								</div>
							</div>
						</div>

						<p className="text-muted-foreground mt-8 pt-8 border-t border-border leading-relaxed">
							Let us handle the details while you enjoy the peace of
							mind that comes with professional property management.
							Whether you reside in Southwest Florida year-round,
							visit seasonally, or maintain an investment residence,
							GulfShore Group offers a refined blend of Concierge
							Services, Property Oversight, and Seasonal Coordination
							designed to bring confidence, comfort, and peace of mind
							to every homeowner. We understand that each property and
							each client carries unique expectations, so our approach
							is rooted in discretion, dependability, and a
							personalized experience tailored to your lifestyle. At
							GulfShore Group, we provide premium, hands-on concierge
							property management throughout Naples, Marco Island,
							Bonita Springs, Estero, and the surrounding coastal
							communities. Our focus is on elevating the ownership
							experience through attentive oversight, consistent
							communication, and a level of care that reflects the
							quality of the homes we manage and the trust our clients
							place in us. For full-time residents, our presence
							ensures effortless continuity. For seasonal homeowners,
							our coordination brings seamless transitions in and out
							of the Southwest Florida lifestyle. And for investment
							property owners, our steady oversight helps preserve
							long-term value and peace of mind. With GulfShore Group,
							you gain more than management—you gain a dedicated
							partner committed to maintaining the integrity, comfort,
							and excellence of your property throughout every season.
							If you’re looking for a concierge property management
							company that truly elevates your ownership experience
							across Southwest Florida, GulfShore Group is here to
							deliver consistent excellence, every single day.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
