import React, { Suspense } from "react";
import SearchBox from "./home-searchbox";


const HeroSection = () => {
    const heroImage =
        "https://res.cloudinary.com/dm68hqwp9/image/upload/v1752289517/b8116620c2365c422108705cbb609f57_m9ddcy.jpg";

    return (
        <section className="relative w-full min-h-[65vh] md:min-h-[85vh] bg-slate-950">
            {/* Background Image */}
            <div
                className="absolute inset-0 overflow-hidden bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: `url("${heroImage}")`,
                }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/50 to-black/30" />

            {/* Content */}
            <div className="relative z-10 flex h-full min-h-[65vh] md:min-h-[85vh] flex-col justify-end">
                <div className="w-full px-4 sm:px-6 lg:px-10 pb-6 md:pb-10">
                    
                    {/* Text Section */}
                    <div className="max-w-4xl mb-5">
                        <h1 className="hidden md:block text-left text-3xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight tracking-tight">
                            Buy Or Sell In Naples, FL And Surrounding Area
                        </h1>

                        <h2 className="block md:hidden text-left text-3xl font-bold text-white leading-tight">
                            Buy Or Sell In Naples, FL And Surrounding Area
                        </h2>

                        <p className="mt-3 text-left text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl">
                            Search thousands of up-to-date listings, track price
                            changes, and explore properties on the map.
                        </p>
                    </div>

                    {/* Full Width Search Bar */}
                    <div className="w-full">
                        <Suspense
                            fallback={
                                <div className="h-14 w-full rounded-2xl bg-slate-800/50 animate-pulse" />
                            }
                        >
                        <SearchBox/>
                        </Suspense>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;