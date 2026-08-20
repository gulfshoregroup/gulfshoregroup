"use client";

import Image from "next/image";
import Link from "next/link";
import FooterLinks from "./footerLinks";
import SearchSuggestions from "./searchSuggestions";
import { useState, useEffect } from "react";

export default function Footer() {
	const [siteName, setSiteName] = useState("GulfshoreGroup");
	const [siteUrl, setSiteUrl] = useState("https://gulfshoregroup.com");

	useEffect(() => {
		fetch("/api/admin/general-settings")
			.then((res) => res.json())
			.then((data) => {
				if (data.siteName) setSiteName(data.siteName);
				if (data.siteUrl) setSiteUrl(data.siteUrl);
			})
			.catch(() => {});
	}, []);

	const cities = [
		"Naples",
		"Bonita Springs",
		"Cape Coral",
		"Estero",
		"Fort Myers",
		"Immokalee",
		"Ave Maria",
		"Babcock Ranch",
		"Lehigh Acres",
		"Marco Island",
		"Pineland",
	];
	return (
		<>
			<SearchSuggestions />
			<footer className="bg-gray-50">
				<div className="w-full poppins rounded-t-md  border-t-2 mt-5 border-gray-500">
					<div className="flex flex-col items-start w-11/12 lg:w-4/5 mx-auto justify-center  text-gray-800">
						<div className="w-full my-2">
							<div className="flex flex-wrap w-full justify-between items-center mb-4 py-4">
								<div className="flex flex-nowrap gap-3 justify-start text-start items-center">
									<Image
										src="/logored.svg"
										width={32}
										height={32}
										alt={`${siteName} Logo`}
									/>
									<h2 className="text-xl text-primary font-bold">
										{siteName}
									</h2>
								</div>
							</div>
							<h3 className="text-lg font-medium lg:text-xl py-1 leading-relaxed">
								About
							</h3>
							<p className="poppins lg:text-base font-light text-sm">
								Gulfshore Group Naples Florida Real Estate Office - We
								are dedicated to deliver exceptional service and
								unparalleled expertise in Southwest Florida’s dynamic
								property market. From luxurious beachfront homes to
								exclusive waterfront estates, we bring you the finest
								coastal living experiences.
							</p>
						</div>
						<div className="w-full my-5">
							<FooterLinks />
							<h5 className="text-lg font-medium lg:text-xl py-4 leading-relaxed">
								Useful Links
							</h5>
							<ul className="flex flex-wrap justify-start items-start list-none gap-2">
								<li className="poppins">
									<Link prefetch={false} href={"/contact"}>
										<span className="pr-2">Contact Us</span>
									</Link>
									|
								</li>
								<li className="poppins">
									<Link prefetch={false} href={"/about"}>
										{" "}
										<span className="pr-2">About Us</span>
									</Link>
									|
								</li>

								<li className="poppins">
									<Link prefetch={false} href={"/terms"}>
										<span className="pr-2">Terms</span>
									</Link>
									|
								</li>
								<li className="poppins">
									<Link prefetch={false} href={"/policy"}>
										<span className="pr-2">Privacy Policy</span>
									</Link>
									|
								</li>
								<li className="poppins">
									<Link prefetch={false} href={"/sitemaps"}>
										<span className="pr-2">Sitemap</span>
									</Link>
								</li>
								<li className="poppins">
									<Link
										prefetch={false}
										href={"/property-management"}>
										<span className="pr-2">
											Property Management Services
										</span>
									</Link>
								</li>
							</ul>
						</div>
					</div>
				</div>
				<div className="w-full h-fit text-center text-sm py-3">
					Thanks for visiting {siteName}.
				</div>
				<div className="w-full h-fit text-sm lg:text-base py-2 border-t-2 border-white text-white bg-black text-center poppins">
					&copy; {siteName} | All rights reserved. <br />
				</div>
			</footer>
		</>
	);
}
