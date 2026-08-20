"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<div className="flex-shrink-0">
						<a href="https://gulfshoregroup.com">
							<span className="text-2xl font-serif font-bold text-primary">
								GulfShore Group
							</span>
						</a>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex gap-8">
						<a
							href="#services"
							className="text-foreground hover:text-primary transition-colors">
							Services
						</a>
						<a
							href="#about"
							className="text-foreground hover:text-primary transition-colors">
							About
						</a>
						<a
							href="#contact"
							className="text-foreground hover:text-primary transition-colors">
							Contact
						</a>
					</nav>

					{/* Mobile Menu Button */}
					<button
						className="md:hidden"
						onClick={() => setIsMenuOpen(!isMenuOpen)}>
						{isMenuOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>

				{/* Mobile Navigation */}
				{isMenuOpen && (
					<nav className="md:hidden pb-4 flex flex-col gap-4">
						<a
							href="#services"
							className="text-foreground hover:text-primary transition-colors"
							onClick={() => setIsMenuOpen(false)}>
							Services
						</a>
						<a
							href="#about"
							className="text-foreground hover:text-primary transition-colors"
							onClick={() => setIsMenuOpen(false)}>
							About
						</a>
						<a
							href="#contact"
							className="text-foreground hover:text-primary transition-colors"
							onClick={() => setIsMenuOpen(false)}>
							Contact
						</a>
					</nav>
				)}
			</div>
		</header>
	);
}
