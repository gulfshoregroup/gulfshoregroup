import React from "react";
import Image from "next/image";

export default function EmailPreviewPage() {
	return (
		<div className="min-h-screen bg-gray-100 py-10 flex items-center justify-center">
			{/* EMAIL CONTAINER */}
			<div className="w-full max-w-[600px] bg-white shadow-2xl rounded-sm overflow-hidden font-sans">
				
				{/* HEADER SPLIT SECTION */}
				<div className="flex flex-col sm:flex-row h-auto sm:h-[350px]">
					{/* Left Image Side */}
					<div className="relative w-full sm:w-[55%] h-[250px] sm:h-full">
						<Image
							src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80"
							alt="Market Update"
							fill
							className="object-cover"
							unoptimized
						/>
						{/* Tag */}
						<div className="absolute top-1/2 -translate-y-1/2 left-0 bg-[#d90429] text-white px-6 py-4 text-xs font-bold tracking-[0.2em] uppercase z-10 shadow-lg">
							SWFL EDITION
						</div>
					</div>
					
					{/* Right Text Side */}
					<div className="w-full sm:w-[45%] bg-white flex flex-col justify-center items-center p-8 sm:p-4 text-center">
						<h1 className="text-4xl sm:text-5xl font-light text-[#1A0A0A] leading-tight tracking-tight mb-6">
							MARKET <br />
							<span className="font-semibold text-[#8B2020]">UPDATE</span>
						</h1>
						{/* Mock Signature */}
						<div className="mt-8">
							<span className="font-[cursive] text-3xl text-gray-800">Gulfshore</span>
						</div>
					</div>
				</div>

				{/* DATA SECTION */}
				<div className="relative bg-[#FAF7F2] p-8 pb-12 border-t-4 border-[#C9A96E]">
					
					{/* Header of data section */}
					<div className="text-center mb-8">
						<div className="inline-block border-b border-[#C9A96E] pb-2 mb-2">
							<h2 className="text-xl font-bold tracking-widest text-[#1A0A0A] uppercase">
								Naples Area Activity
							</h2>
						</div>
						<p className="text-xs text-gray-500 uppercase tracking-widest">
							June 2026 compared with June 2025
						</p>
					</div>

					{/* Grid of stats */}
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{/* Stat Box 1 */}
						<StatBox title="Overall Inventory" value="4,741" change="23%" up={true} />
						{/* Stat Box 2 */}
						<StatBox title="Overall Pending" value="855" change="15%" up={true} />
						{/* Stat Box 3 */}
						<StatBox title="Median Price" value="$595K" change="4%" up={true} />
						{/* Stat Box 4 */}
						<StatBox title="Closed Sales" value="881" change="17%" up={true} />
						{/* Stat Box 5 */}
						<StatBox title="New Listings" value="830" change="10%" up={false} />
						{/* Stat Box 6 */}
						<StatBox title="Days on Market" value="103" change="5%" up={true} />
						{/* Stat Box 7 */}
						<StatBox title="Months Supply" value="6.3" change="35%" up={false} />
						{/* Stat Box 8 */}
						<div className="bg-white rounded-lg p-3 text-center border border-[#E8DDD8] shadow-sm flex flex-col justify-center items-center group cursor-pointer hover:border-[#d90429] transition-colors">
							<span className="text-[10px] font-bold text-[#8B2020] uppercase tracking-wider mb-2">View Full Report</span>
							<div className="w-8 h-8 rounded-full bg-[#d90429] text-white flex items-center justify-center">
								→
							</div>
						</div>
					</div>

				</div>

				{/* FOOTER */}
				<div className="bg-[#1A0A0A] text-white text-center py-6 px-4">
					<p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Gulfshore Group Real Estate</p>
					<p className="text-[10px] text-gray-500">© 2026 Gulfshore Group. All rights reserved.</p>
				</div>
			</div>
		</div>
	);
}

function StatBox({ title, value, change, up }: { title: string; value: string; change: string; up: boolean }) {
	const arrowColor = up ? "text-[#d90429]" : "text-[#C9A96E]"; // Brand red for up, gold for down
	const bgColor = up ? "bg-[#d90429]/10" : "bg-[#C9A96E]/10";
	
	return (
		<div className="bg-white rounded-lg p-3 text-center border border-[#E8DDD8] shadow-sm flex flex-col justify-between">
			<h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider leading-tight h-8 mb-2 flex items-center justify-center">
				{title}
			</h3>
			<p className="text-xl font-bold text-[#1A0A0A] mb-2">{value}</p>
			<div className={`mx-auto flex flex-col items-center justify-center w-8 h-10 ${bgColor} rounded-sm`}>
				<span className={`text-xs font-black ${arrowColor}`}>{up ? "↑" : "↓"}</span>
				<span className={`text-[9px] font-bold ${arrowColor}`}>{change}</span>
			</div>
		</div>
	);
}
