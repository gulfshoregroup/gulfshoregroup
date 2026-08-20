import Image from "next/image";

export default function WhyChooseUs() {
	return (
		<div>
			<div className="w-11/12 lg:max-w-4/5 mx-auto  text-center">
				<div className="flex my-5 flex-col text-center items-center justify-center overflow-hidden">
					<h2 className="text-xl lg:text-2xl pt-10 text-center poppins font-medium">
						Why Choose Us
					</h2>
					<p className="py-4 lg:text-base md:text-sm text-center text-xs lg:font-medium text-gray-700">
						We make buying and selling homes stress-free with expert
						support and a wide range of properties.
					</p>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="p-6 bg-white rounded-lg">
						<Image
						  unoptimized
							width={500}
							height={500}
							src="https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289230/financial-analysts-doing_hnls5f.jpg"
							alt="Knowledge"
						/>
						<h3 className="text-xl font-medium border-b-[3px] stroke-border border-(--primary-color) w-fit text-gray-800 mb-4">
							Knowledge
						</h3>
						<p className="text-gray-600 text-sm font-medium leading-relaxed poppins text-start">
							We are qualified to guide you in buying or selling a
							home. We believe in using our skills in finance,
							contracts, negotiation and marketing to your best
							advantage.
						</p>
					</div>
					<div className="p-6 bg-white rounded-lg">
						<Image
						  unoptimized
							width={500}
							height={500}
							src="https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289230/experts-concept-illustration_ww93ft.jpg"
							alt="Expertise"
						/>
						<h3 className="text-xl font-medium border-b-[3px] stroke-border border-(--primary-color) w-fit  text-gray-800 mb-4">
							Expertise
						</h3>
						<p className="text-gray-600  text-sm font-medium leading-relaxed poppins text-start">
							We offer local market knowledge that&apos;s tailored to
							meet your needs. We know the neighborhoods, schools,
							market conditions, zoning regulations and the economy
							throughout each Florida city.
						</p>
					</div>
					<div className="p-6 bg-white rounded-lg">
						<Image
						  unoptimized
							width={500}
							height={500}
							src="https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289241/successful-businessman-celebrating-victory_1150-39772_nu6lci.jpg"
							alt="Success"
						/>

						<h3 className="text-xl font-medium border-b-[3px] stroke-border border-(--primary-color) w-fit  text-gray-800 mb-4">
							Your Satisfaction
						</h3>
						<p className="text-gray-600  text-sm font-medium leading-relaxed poppins text-start">
							We don&apos;t measure our success through awards
							received or achievements, but through the satisfaction
							of our clients. Whether you are looking to buy or sell
							your home, we will provide sound and trustworthy advice
							to help you achieve your real estate goals.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
