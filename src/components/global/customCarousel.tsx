"use client";
import { log } from "console";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface CarouselProps {
	items: any[];
}

const CustomCarousel: React.FC<CarouselProps> = ({ items }) => {
	const [currentIndex, setCurrentIndex] = useState(1); // Start at 1 to show the first original item
	const trackRef = useRef<HTMLDivElement>(null);
	const [slideWidth, setSlideWidth] = useState(0);
	const [visibleSlides, setVisibleSlides] = useState(0);

	// Create modified items for infinite scrolling (first and last cloned)
	const modifiedItems = [items[items.length - 1], ...items, items[0]];

	useEffect(() => {
		const resizeHandler = () => {
			// Measure the first slide's width, assuming all slides have the same width
			const firstSlide = trackRef.current?.children[0] as HTMLElement;
			if (firstSlide) {
				setSlideWidth(firstSlide.offsetWidth + 20);

				// Calculate how many slides are visible based on the carousel's width
				const containerWidth = trackRef.current?.offsetWidth || 0;
				const slidesVisible = Math.floor(
					containerWidth / firstSlide.offsetWidth
				);
				setVisibleSlides(slidesVisible);
			}
		};

		resizeHandler(); // Initial calculation
		window.addEventListener("resize", resizeHandler); // Update on window resize

		return () => {
			window.removeEventListener("resize", resizeHandler); // Cleanup event listener
		};
	}, [items]);

	const calculateOffset = (index: number) => {
		return index * slideWidth;
	};

	const handleNext = () => {
		if (trackRef.current) {
			const nextIndex = currentIndex + 1;
			if (nextIndex >= modifiedItems.length - visibleSlides) {
				// Jump to the first original item (for seamless infinite loop)
				setCurrentIndex(1);
				trackRef.current.style.transition = "none";
				trackRef.current.style.transform = `translateX(-${calculateOffset(
					1
				)}px)`;
				setTimeout(() => {
					trackRef.current!.style.transition =
						"transform 0.4s ease-in-out";
				}, 0);
			} else {
				setCurrentIndex(nextIndex);
				trackRef.current.style.transform = `translateX(-${calculateOffset(
					nextIndex
				)}px)`;
			}
		}
	};

	const handlePrev = () => {
		if (trackRef.current) {
			const prevIndex = currentIndex - 1;
			if (prevIndex <= 0) {
				// Jump to the last original item (for seamless infinite loop)
				setCurrentIndex(modifiedItems.length - visibleSlides - 1);
				trackRef.current.style.transition = "none";
				trackRef.current.style.transform = `translateX(-${calculateOffset(
					modifiedItems.length - visibleSlides - 1
				)}px)`;
				setTimeout(() => {
					trackRef.current!.style.transition =
						"transform 0.4s ease-in-out";
				}, 0);
			} else {
				setCurrentIndex(prevIndex);
				trackRef.current.style.transform = `translateX(-${calculateOffset(
					prevIndex
				)}px)`;
			}
		}
	};
	return (
		<div className="carousel-container">
			<button
				className="carousel-arrow rounded-full p-2 bg-black  left-arrow"
				onClick={handlePrev}>
				<Image src="/svg/left-white.svg" alt="" width={25} height={25} />
			</button>
			<div className="carousel-wrapper container mx-auto py-2">
				<div className="carousel-track" ref={trackRef}>
					{modifiedItems.map((item, index) => (
						<div key={index} className="carousel-item">
							{item}
						</div>
					))}
				</div>
			</div>
			<button
				className="carousel-arrow rounded-full p-2 bg-black right-arrow"
				onClick={handleNext}>
				<Image src="/svg/right-white.svg" alt="" width={25} height={25} />
			</button>
		</div>
	);
};

export default CustomCarousel;
