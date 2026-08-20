"use server";

import Footer from "@/components/global/footer";

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<div className="overflow-hidden">
				<div className="flex w-full h-full">
					<div className="relative bg-white mx-auto overflow-hidden flex flex-col">
						<div
							id="container"
							className="h-full flex-col flex overflow-y-auto gap-2">
							<div>
								<div>{children}</div>

								<div className="w-11/12 mt-20 mb-8 mx-auto px-4">
									<span className="font-semibold text-sm">
										Disclaimer:
									</span>
									<span className="text-xs font-light text-gray-600">
										The source of this real property information is
										the copyrighted and proprietary database
										compilation of the M.L.S. of Naples, Inc.
										Copyright M.L.S. of Naples, Inc. All rights
										reserved. The accuracy of this information is not
										warranted or guaranteed. This information should
										be independently verified if any person intends to
										engage in a transaction in reliance upon it.
									</span>
								</div>

								<Footer />
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
