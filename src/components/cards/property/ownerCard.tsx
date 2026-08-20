import Image from "next/image";
import { Phone, Mail, Award } from "lucide-react";
import Link from "next/link";
import ContactForm from "../contactus";

export default function OwnerCard({
	layout = "row",
	property = { MLSNumber: "", propertyAddress: "" },
}: {
	layout?: "row" | "column";
	property?: {
		MLSNumber: string;
		propertyAddress: string;
	};
}) {
	const whatsappLink = `https://wa.me/+12399929119?text=${encodeURIComponent(
		"Hello Dimitri, I saw your website and wanted to connect regarding some property options. Please provide more details."
	)}`;

	return (
		<div className="w-full max-w-11/12 lg:max-w-4/5 mx-auto my-10">
			<div className="flex flex-col pt-4 lg:text-center text-start mb-20">
				<h2 className="lg:text-3xl text-lg font-medium">
					Our Professional Realtor
				</h2>
				<p className="py-4 lg:text-center text-start text-sm font-medium text-gray-700">
					Meet Dimitri Schwarz, Your Trusted Southwest Florida Realtor
				</p>
			</div>
			{/* Owner Card */}
			<div className="overflow-hidden h-full mb-20 rounded-2xl shadow-none">
				<div className="grid lg:grid-cols-2 grid-cols-1 items-center text-center w-full mx-auto gap-10">
					{/* Profile Image */}
					<div className="w-72 mx-auto relative h-full min-h-80 rounded-lg">
						<Image
							src="https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289211/Dimitri-schwarz_r9ognl.jpg"
							alt="Dimitri Schwarz - Professional Realtor"
							fill
							unoptimized
							className="h-full w-full object-cover rounded-xl md:rounded-lg"
							priority
						/>
					</div>
					<div className="flex-col items-start justify-start text-start flex">
						<div className="space-y-1 text-start">
							<h3 className="text-2xl font-medium text-gray-900">
								Dimitri Schwarz
							</h3>
							<div className="flex items-start gap-2 text-gray-600">
								<Award className="w-4 h-4" />
								<span className="text-xs font-medium">
									Professional Realtor
								</span>
							</div>
							<span className="text-sm">
								180+ successful property sales across Naples and
								surrounding areas.
							</span>
						</div>

						<span>
							<p className="mt-4 text-gray-700 text-sm max-w-md">
								With over two decade of experience in the Southwest
								Florida real estate market, Dimitri Schwarz is
								dedicated to helping clients find their dream homes.
								His expertise, personalized approach, and local market
								knowledge make him a trusted choice for buyers and
								sellers alike.
							</p>
						</span>

						<div className="gap-2 flex flex-col  mt-4">
							{/* Email */}
							<a
								href="mailto:mailbox@gulfshoregroup.com"
								className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm transition-all duration-300 group hover:bg-purple-50">
								<div className="flex-1 text-left">
									<p className="text-sm text-gray-500">Email</p>
									<p className="text-gray-900 underline font-medium">
										mailbox@gulfshoregroup.com
									</p>
								</div>
							</a>

							{/* Phone */}
							<a
								href="tel:+12399929119"
								className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm transition-all duration-300 group hover:bg-blue-50">
								<div className="flex-1 text-left">
									<p className="text-sm text-gray-500">Phone</p>
									<p className="text-gray-900 underline font-medium">
										+1 (239) 992-9119
									</p>
								</div>
							</a>
						</div>
						{/* Action Buttons */}
						<div className="grid grid-cols-2 gap-2 w-full">
							{/* WhatsApp */}
							<Link
								href={whatsappLink}
								target="_blank"
								className="group relative overflow-hidden border-green-700 hover:border-green-600 text-green-700 border-2 bg-white font-medium py-3 rounded-lg flex justify-center items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
								<svg
									className="w-5 h-5 transition-transform duration-300 group-hover:scale-110"
									viewBox="0 0 24 24"
									fill="currentColor">
									<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
								</svg>
								<span className="text-sm">WhatsApp</span>
							</Link>

							{/* Call Now */}
							<a
								href="tel:+12399929119"
								className="group relative overflow-hidden w-full border-blue-500 hover:border-blue-600 bg-white text-blue-500 border-2 font-medium py-3 rounded-lg flex justify-center items-center gap-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
								<Phone className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
								<span className="text-sm">Call Now</span>
							</a>
						</div>
					</div>
				</div>
			</div>
			<ContactForm
				MLSNumber={property.MLSNumber}
				propertyAddress={property.propertyAddress}
			/>
		</div>
	);
}
