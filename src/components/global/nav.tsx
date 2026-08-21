"use client";

import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "../ui/sheet";
import {
	HeartIcon,
	LucideMenu,
	Mail,
	Phone,
	Sparkles,
} from "lucide-react";

import {
	SignedIn,
	SignedOut,
	SignInButton,
	SignUpButton,
	UserButton,
	useUser,
	SignOutButton,
} from "@clerk/nextjs";
import { usePathname, useSearchParams } from "next/navigation";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import Image from "next/image";

const Navbar = () => {
	const path = usePathname();
	const isHomePage = path === "/";
	const isSearchPage = path.startsWith("/Florida-Real-Estate-Search");

	const [isScrolled, setIsScrolled] = useState(false);
	const { user, isLoaded, isSignedIn } = useUser();

	const searchParams = useSearchParams();

	const [fakeInitials, setFakeInitials] = useState<string | null>(null);

	useEffect(() => {
		const utmSource = searchParams.get("utm_source");
		const nameParam = searchParams.get("n");

		if (utmSource === "email_alert") {
			const initials = nameParam 
				? nameParam.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
				: "VIP";
			sessionStorage.setItem("fake_logged_in_initials", initials);
			setFakeInitials(initials);
		} else {
			const stored = sessionStorage.getItem("fake_logged_in_initials");
			if (stored) setFakeInitials(stored);
		}
	}, [searchParams]);

	const [generalSettings, setGeneralSettings] = useState({
		siteName: "GULFSHORE GROUP",
		contactEmail: "mailbox@gulfshoregroup.com",
		siteUrl: "https://gulfshoregroup.com",
	});

	useEffect(() => {
		fetch("/api/admin/general-settings")
			.then((res) => res.json())
			.then((data) => {
				if (data.siteName || data.contactEmail) {
					setGeneralSettings((prev) => ({
						siteName: data.siteName ? data.siteName.toUpperCase() : prev.siteName,
						contactEmail: data.contactEmail || prev.contactEmail,
						siteUrl: data.siteUrl || prev.siteUrl,
					}));
				}
			})
			.catch(() => {});
	}, []);

	// Redirect admin users to admin panel ONLY right after fresh login in production
	useEffect(() => {
		if (isLoaded && isSignedIn && user?.publicMetadata?.role === "admin") {
			const justSignedIn = typeof sessionStorage !== "undefined"
				? sessionStorage.getItem("just_signed_in")
				: null;

			if (justSignedIn === "true") {
				sessionStorage.removeItem("just_signed_in");
				window.location.href = "/admin/dashboard";
			}
		}
	}, [isLoaded, isSignedIn, user]);

	// Handle scroll effect
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navBgClass = isHomePage
		? `text-white absolute top-0 left-0 right-0 z-50 transition-all duration-300 backdrop-blur-md bg-white/95`
		: "bg-white/95 backdrop-blur-md text-black shadow-sm border-b border-gray-200/50";

	const logoTextClass = isHomePage && "text-black";

	const menuIconClass = `transition-colors duration-300 text-black`;

	const navLinksClass = "";

	const headerClass = isHomePage
		? "fixed top-0 left-0 right-0 z-40"
		: "static";

	if (path === "/property-management") return null;

	return (
		<header className={headerClass}>
			<NavigationMenu
				className={`p-4 container justify-between max-w-full lg:px-12 flex items-center min-h-[72px] ${navBgClass}`}>
				<div className="flex justify-between w-full items-center">
					<Link
						href="/"
						className={`text-sm md:text-xl md:font-bold font-semibold tracking-tight hover:scale-105 transition-transform duration-200 ${logoTextClass}`}
						aria-label="Gulfshore Group Home">
						<div className="flex flex-row items-center justify-center gap-2">
							<Image
								src={"/logored.svg"}
								alt="Gulfshoregroup"
								className="w-6 md:w-9"
								width={35}
								height={8}
							/>

							<div className="flex flex-col">
								<span className="text-primary">{generalSettings.siteName}</span>
								<span
									className={`text-gray-600 md:font-medium font-normal text-start md:text-sm text-[10px]`}>
									London Forster Realty
								</span>
							</div>
						</div>
					</Link>
					<div className="hidden lg:block">
						<NavigationMenuList
							className={`space-x-3 text-black ${navLinksClass}`}>
							{[
								{ path: "/", label: "Home" },
								{
									path: "/Florida-Real-Estate-Search",
									label: "Search",
								},
								{ path: "/sell", label: "Sell" },
							].map(({ path: navPath, label }) => (
								<NavigationMenuItem key={navPath}>
									<NavigationMenuLink
										className="relative px-4 py-3 rounded-xl font-medium text-black hover:bg-gray-100 hover:text-black transition-all duration-200"
										href={navPath}>
										{label}
										{path === navPath && (
											<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 h-1 bg-current rounded-full" />
										)}
									</NavigationMenuLink>
								</NavigationMenuItem>
							))}
							<NavigationMenuItem key={"call"}>
								<NavigationMenuLink
									className="relative inline-flex flex-row whitespace-nowrap items-center gap-2 px-4 py-3 rounded-xl font-medium hover:bg-gray-100 hover:text-black transition-all duration-200"
									aria-label="Call us at 239-992-9119"
									href={"tel:+1 239-992-9119"}>
									<Phone size={20} className="shrink-0" />
									+1 (239) 992-9119
								</NavigationMenuLink>
							</NavigationMenuItem>
							<NavigationMenuItem key={"mail"}>
								<NavigationMenuLink
									className="relative inline-flex flex-row whitespace-nowrap items-center gap-2 px-4 py-3 rounded-xl font-medium hover:bg-gray-100 hover:text-black transition-all duration-200"
									aria-label="Email us"
									href={`mailto:${generalSettings.contactEmail}`}>
									<Mail size={20} className="shrink-0" />
									E-mail Us
								</NavigationMenuLink>
							</NavigationMenuItem>
							<SignedOut>
								<NavigationMenuItem>
									<Link href={`/signup${path !== "/" ? `?redirect_url=${encodeURIComponent(path)}` : ""}`}>
										<Button className="rounded-full font-bold cursor-pointer bg-primary hover:bg-accent text-white px-6">
											Sign Up
										</Button>
									</Link>
								</NavigationMenuItem>
							</SignedOut>
							<SignedIn>
								<NavigationMenuItem>
									<div className="flex items-center gap-4">
										{user?.publicMetadata?.role === "admin" && (
											<Link href="/admin/dashboard">
												<Button variant="outline" className="rounded-lg font-bold cursor-pointer border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
													Admin Panel
												</Button>
											</Link>
										)}
										<UserButton />
									</div>
								</NavigationMenuItem>
							</SignedIn>
						</NavigationMenuList>
					</div>
					{/* Mobile Actions */}
					<div className="flex items-center gap-2 md:gap-3">
						<NavigationMenu className="lg:hidden flex items-center">
							<NavigationMenuList className="flex items-center">
								<NavigationMenuItem key={"call"}>
									<NavigationMenuLink
										className="relative inline-flex text-center items-center gap-1.5 p-2 rounded-xl font-medium hover:bg-gray-100 hover:text-black transition-all duration-200"
										href={"tel:+1 239-992-9119"}
										aria-label="Call us">
										<Phone size={20} />
										<span className="text-xs font-medium hidden sm:inline">Call</span>
									</NavigationMenuLink>
								</NavigationMenuItem>
								<NavigationMenuItem key={"mail"}>
									<NavigationMenuLink
										className="relative inline-flex text-center items-center gap-1.5 p-2 rounded-xl font-medium hover:bg-gray-100 hover:text-black transition-all duration-200"
										href={"mailto:mailbox@gulfshoregroup.com"}
										aria-label="Email us">
										<Mail size={20} />
										<span className="text-xs font-medium hidden sm:inline">Email</span>
									</NavigationMenuLink>
								</NavigationMenuItem>
							</NavigationMenuList>
						</NavigationMenu>

						{/* User status buttons for mobile */}
						<div className="lg:hidden flex items-center">
							<SignedIn>
								<UserButton />
							</SignedIn>
							<SignedOut>
								<Link href={`/signup${path !== "/" ? `?redirect_url=${encodeURIComponent(path)}` : ""}`}>
									<Button className="rounded-full font-bold cursor-pointer bg-primary hover:bg-accent text-white px-4 py-2 text-xs h-9">
										Sign Up
									</Button>
								</Link>
							</SignedOut>
						</div>

						<DrawerMenu menuIconClass={menuIconClass} />
					</div>
				</div>
			</NavigationMenu>
		</header>
	);
};

export default Navbar;

export const DrawerMenu = ({
	menuIconClass = "",
}: {
	menuIconClass?: string;
}) => {
	const path = usePathname();
	const { user } = useUser();

	return (
		<Sheet>
			<SheetTrigger
				className="rounded-xl p-3 hover:bg-gray-100 transition-colors duration-200"
				style={{
					backdropFilter: "blur(10px)",
				}}
				aria-label="Open navigation menu">
				<LucideMenu className={`w-7 h-7 ${menuIconClass}`} />
			</SheetTrigger>
			<SheetContent className="w-[300px] bg-white/95 backdrop-blur-xl border-l border-gray-200/50">
				<SheetClose />
				<SheetTitle className="text-2xl font-bold bg-clip-text text-gray-900 px-4">
					Gulfshore Group
				</SheetTitle>
				<div className="w-full">
					<div className="flex flex-col pt-6 space-y-1">
						{[
							{ path: "/", label: "Home" },
							{
								path: "/Florida-Real-Estate-Search?openFilters=true",
								label: "Advanced Search (Filters)",
							},
							{
								path: "/Florida-Real-Estate-Search?view=map",
								label: "Interactive Map Search",
							},
							{
								path: "/mortgage-calculator",
								label: "Mortgage Calculator",
							},
							{ path: "/sell", label: "Home Valuation" },
							{ path: "/contact", label: "Contact" },
							{ path: "/about", label: "About" },
						].map(({ path: navPath, label }) => (
							<SheetClose key={navPath} asChild>
								<Link
									href={navPath}
									className="relative block w-full px-4 py-3 rounded-xl hover:bg-linear-to-r hover:from-blue-50 hover:to-purple-50 hover:text-black text-gray-800 transition-all duration-200 font-medium text-base">
									<span className="relative z-10">{label}</span>
									{path === navPath && (
										<div className="absolute inset-0 bg-linear-to-r from-blue-100 to-purple-100 opacity-50 rounded-xl" />
									)}
								</Link>
							</SheetClose>
						))}
						<SignedOut>
							<SheetClose asChild>
								<Link href={`/signup${path !== "/" ? `?redirect_url=${encodeURIComponent(path)}` : ""}`} className="w-full block">
									<button className="w-full text-left relative px-4 py-3 rounded-xl hover:bg-linear-to-r hover:from-blue-50 hover:to-purple-50 hover:text-black text-gray-800 transition-all duration-200 font-medium text-base cursor-pointer">
										Sign Up
									</button>
								</Link>
							</SheetClose>
							<SheetClose asChild>
								<Link href={`/signin${path !== "/" ? `?redirect_url=${encodeURIComponent(path)}` : ""}`} className="w-full block">
									<button className="w-full text-left relative px-4 py-3 rounded-xl hover:bg-linear-to-r hover:from-blue-50 hover:to-purple-50 hover:text-black text-gray-800 transition-all duration-200 font-medium text-base cursor-pointer">
										Sign In
									</button>
								</Link>
							</SheetClose>
						</SignedOut>
						<SignedIn>
							{" "}
							{user?.publicMetadata?.role === "admin" && (
								<SheetClose asChild>
									<Link
										href="/admin/dashboard"
										className="relative block w-full px-4 py-3 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 font-bold text-base">
										<span>Admin Dashboard</span>
									</Link>
								</SheetClose>
							)}
							<SheetClose asChild>
								<Link
									href="/favorites"
									className="relative block w-full px-4 py-3 rounded-xl hover:bg-linear-to-r hover:from-blue-50 hover:to-purple-50 hover:text-black text-gray-800 transition-all duration-200 font-medium text-base">
									<span>Saved Properties</span>
								</Link>
							</SheetClose>
							<SheetClose asChild>
								<Link
									href="/user/saved-searches"
									className="relative block w-full px-4 py-3 rounded-xl hover:bg-linear-to-r hover:from-blue-50 hover:to-purple-50 hover:text-black text-gray-800 transition-all duration-200 font-medium text-base">
									<span>Saved Searches</span>
								</Link>
							</SheetClose>
							<SheetClose asChild>
								<SignOutButton>
									<button className="w-full text-left relative px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 font-semibold cursor-pointer text-base">
										Sign Out
									</button>
								</SignOutButton>
							</SheetClose>
						</SignedIn>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};
