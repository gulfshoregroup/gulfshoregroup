import React from "react";
import OwnerCard from "./cards/property/ownerCard";

const AboutSection = () => {
	return (
		<section className="py-10 bg-white/10">
			<div>
				<div className="text-sm lg:text-base w-11/12 lg:max-w-4/5 mx-auto text-gray-800 leading-relaxed mb-20">
					<p className="mb-4">
						Greetings from Gulfshore Group, your go-to real estate
						firm office with a focus on Naples, Florida and
						Surrounding. In Naples, Florida Real Estate, Gulfshore
						Group Can Help You Find Your Ideal House. We are committed
						to making your home-buying or home-selling experience
						enjoyable and easy. We assist clients in finding the ideal
						property that meets their needs thanks to our years of
						experience and thorough knowledge of the Naples, Florida
						market.
					</p>
					<p className="mb-4">
						At Gulfshore Group, we put your satisfaction first by
						providing individualized care, open communication, and
						knowledgeable direction. Our website makes it simple to
						look at a range of properties by providing the most recent
						listings in and around Naples, Florida. We have the tools
						to help you find a chic condo, a family-friendly house, or
						an opulent waterfront estate.
					</p>
					<p className="mb-6">
						We believe in building lasting relationships with our
						clients, and we&apos;re committed to being your trusted
						real estate partner for years to come. Explore our
						listings today and discover why Gulfshore Group is the
						best real estate website for finding your dream home in
						Southwest Florida. Let us transform your real estate
						aspirations into reality. - Dimitri Schwarz, Realtor.
					</p>
				</div>
			</div>
			<hr />
			<div className="flex justify-center items-center">
				<OwnerCard layout="row" />
			</div>
		</section>
	);
};

export default AboutSection;
