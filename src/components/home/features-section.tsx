import React, { Suspense } from "react";
import Head from "next/head";
import Link from "next/link";
import {
	ArrowUpRightFromSquare,
	Calculator,
	ChevronsRightIcon,
	Map,
	Search,
} from "lucide-react";
import { Filters } from "../search/desktopFilters";

const FeaturesSection = () => {
	return (
		<>
			<hr className=" bg-red-800" />
			<section className="py-7 w-11/12 lg:max-w-4/5 mx-auto">
				<div>
					<div className="flex flex-col pt-8 lg:text-center text-start mb-10">
						<h2 className="lg:text-2xl text-lg font-medium">
							Your Key to Finding the Perfect Southwest Florida Home
						</h2>
						<p className="py-4 lg:text-center text-start text-sm lg:font-semibold text-gray-700">
							Explore Our Features which help you to find best
							listings in Southwest Florida
						</p>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
						{/* Advanced Property Search */}
						<div className="lg:text-center text-start">
							<div className="block p-6 bg-blue-50/40 h-full rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
								<div className="flex flex-col space-y-3 text-center items-center">
									<Search size={45} className="text-red-400" />

									<h3 className="text-lg text-slate-800 font-medium mb-4">
										Advanced Property Search
									</h3>

									<p className="text-gray-600 mb-4 text-sm">
										Find your dream home with our advanced search
										filters. Refine your search by location, price,
										property type, and more.
									</p>

									<Suspense
										fallback={
											<span className="text-gray-500">
												Loading filters…
											</span>
										}>
										<Filters asLink={true} />
									</Suspense>
								</div>
							</div>
						</div>

						{/* Interactive Map Search */}
						<div className="lg:text-center text-start">
							<div className="block p-6 bg-blue-50/40 h-full rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
								<div className="flex flex-col space-y-3 text-center items-center">
									<Map size={45} className="text-red-400" />
									<h3 className="text-lg text-slate-800 font-medium mb-4">
										Interactive Map Search
									</h3>

									<p className="text-gray-600 mb-4 text-sm">
										Discover properties visually using our interactive
										map. Explore neighborhoods, schools, and nearby
										amenities.
									</p>
									<Link href="/Florida-Real-Estate-Search?view=map">
										<span className="text-blue-700 font-medium items-center text-sm md:text-md hover:underline inline-flex">
											Search on the Map{" "}
											<ChevronsRightIcon size={20} />
										</span>
									</Link>
								</div>
							</div>
						</div>

						{/* EMI Calculator */}
						<div>
							<div className="block p-6 bg-blue-50/40 h-full rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
								<div className="flex flex-col space-y-3 text-center items-center">
									<Calculator size={45} className="text-red-400" />

									<h3 className="text-lg text-slate-800 font-medium mb-4">
										Mortgage Calculator
									</h3>

									<p className="text-gray-600 mb-4 text-sm">
										Calculate your estimated monthly payment for home
										loans. Simply enter the loan amount, interest
										rate, and tenure.
									</p>
									<Link href="/mortgage-calculator">
										<span className="text-blue-700 font-medium items-center text-sm md:text-md hover:underline inline-flex">
											Calculate
											<ChevronsRightIcon size={20} />
										</span>
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
};

export default FeaturesSection;
