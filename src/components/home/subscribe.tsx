import Image from "next/image";
import React from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

function SubscribeCard() {
	return (
		<div className="w-full py-10">
			<div className="w-11/12 md:w-4/5 mx-auto relative overflow-hidden">
				<div className="relative rounded-2xl overflow-hidden h-full">
					<Image
						src={
							"https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289517/b8116620c2365c422108705cbb609f57_m9ddcy.jpg"
						}
						height={300}
						width={800}
						alt="Subscribe to Newletter"
						className="w-full max-h-[500px] object-cover"
					/>
				</div>
				<div className="absolute h-full bottom-0 left-0 right-0 text-center rounded-2xl bg-linear-to-b to-gray-800/45 via-black/70 from-black/45">
					<div className="flex flex-col items-center justify-center h-full">
						<h4 className="font-medium text-2xl md:text-4xl text-white">
							Subscribe to our Newsletter for Latest Updates
						</h4>

						<div className="flex flex-row  bg-white py-2 mx-4 px-2.5 rounded-2xl mt-10 md:w-md">
							<Input
								className="shadow-none border-none"
								type="email"
								placeholder="Enter your email address"
							/>
							<Button>Subscribe</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default SubscribeCard;
