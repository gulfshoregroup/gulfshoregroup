"use client";
import React from "react";
// @ts-ignore
import { createPortal } from "react-dom";

export function ClerkProvider({ children }: { children: React.ReactNode }) {
	const [signedIn, setSignedIn] = React.useState(false);
	const [showModal, setShowModal] = React.useState(false);
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [error, setError] = React.useState("");

	React.useEffect(() => {
		const check = () => {
			const isSignedIn = getCookie("mock_signed_in") === "true";
			setSignedIn(isSignedIn);
			if (isSignedIn) {
				const mockUserId = getCookie("mock_user_id");
				const mockEmail = getCookie("mock_user_email");
				if (!mockUserId || mockUserId === "false") {
					const isAdmin = mockEmail && mockEmail !== "false" && mockEmail.toLowerCase().includes("admin@gulfshore.com");
					setCookie("mock_user_id", isAdmin ? "admin_dummy_123" : "user_dummy_123");
				}
			}
		};
		check();
		const interval = setInterval(check, 1000);

		const handleOpenSignIn = () => {
			setShowModal(true);
			setError("");
			setEmail("");
			setPassword("");
		};

		if (typeof window !== "undefined") {
			window.addEventListener("open-mock-signin", handleOpenSignIn);
		}

		return () => {
			clearInterval(interval);
			if (typeof window !== "undefined") {
				window.removeEventListener("open-mock-signin", handleOpenSignIn);
			}
		};
	}, []);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		try {
			const res = await fetch("/api/admin/auth", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "login", email, password })
			});
			const data = await res.json();
			if (data.success) {
				setCookie("mock_signed_in", "true");
				setCookie("mock_user_email", data.email);
				setCookie("mock_user_id", "admin_dummy_123");
				if (typeof sessionStorage !== "undefined") {
					sessionStorage.setItem("just_signed_in", "true");
				}
				setShowModal(false);
				window.location.reload();
			} else {
				setError(data.error || "Invalid credentials");
			}
		} catch (err) {
			setError("Failed to connect to authentication service.");
		}
	};

	return (
		<>
			<script src="https://accounts.google.com/gsi/client" async defer></script>
			{children}
			{showModal && (
				<div style={{
					position: "fixed",
					inset: 0,
					backgroundColor: "rgba(0, 0, 0, 0.5)",
					backdropFilter: "blur(4px)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontFamily: "sans-serif",
					zIndex: 999999
				}}>
					<div style={{
						backgroundColor: "white",
						padding: "32px",
						borderRadius: "16px",
						boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
						maxWidth: "400px",
						width: "90%",
						color: "#1f2937"
					}}>
						<div style={{ textAlign: "center", marginBottom: "24px" }}>
							<h2 style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: "bold", color: "#111827" }}>Gulfshore Group</h2>
							<p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>Sign in to your account</p>
						</div>

						<form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
							<div>
								<label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Email Address</label>
								<input 
									type="email" 
									required 
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@example.com or admin@gulfshore.com"
									style={{
										width: "100%",
										padding: "10px 14px",
										borderRadius: "8px",
										border: "1px solid #d1d5db",
										fontSize: "15px",
										boxSizing: "border-box"
									}}
								/>
							</div>

							<div>
								<label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Password</label>
								<input 
									type="password" 
									required 
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="••••••••"
									style={{
										width: "100%",
										padding: "10px 14px",
										borderRadius: "8px",
										border: "1px solid #d1d5db",
										fontSize: "15px",
										boxSizing: "border-box"
									}}
								/>
							</div>

							{error && (
								<p style={{ margin: 0, color: "#ef4444", fontSize: "13px", fontWeight: 500 }}>{error}</p>
							)}

							<button 
								type="submit"
								style={{
									backgroundColor: "#3b82f6",
									color: "white",
									border: "none",
									padding: "12px",
									borderRadius: "8px",
									fontSize: "16px",
									fontWeight: "bold",
									cursor: "pointer",
									marginTop: "8px",
									transition: "background-color 0.2s"
								}}>
								Sign In
							</button>

							<button 
								type="button"
								onClick={() => setShowModal(false)}
								style={{
									backgroundColor: "transparent",
									color: "#4b5563",
									border: "none",
									padding: "8px",
									fontSize: "14px",
									cursor: "pointer",
									textDecoration: "underline"
								}}>
								Cancel
							</button>
						</form>
						
						<div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f3f4f6", borderRadius: "8px", fontSize: "12px", color: "#4b5563", textAlign: "center" }}>
							<strong>Credentials:</strong><br />
							Admin: <code>admin@gulfshore.com</code> / <code>admin</code><br />
							User: Use any email and password (min 4 chars)!
						</div>
					</div>
				</div>
			)}
		</>
	);
}

const getCookie = (name: string) => {
	if (typeof document === "undefined") return "false";
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		const cookieVal = parts.pop()?.split(';').shift() || "false";
		try {
			return decodeURIComponent(cookieVal);
		} catch {
			return cookieVal;
		}
	}
	return "false";
};

const setCookie = (name: string, val: string) => {
	if (typeof document !== "undefined") {
		document.cookie = `${name}=${val}; path=/; max-age=31536000`;
	}
};

export function SignedIn({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = React.useState(false);
	const [signedIn, setSignedIn] = React.useState(false);
	React.useEffect(() => {
		setSignedIn(getCookie("mock_signed_in") === "true");
		setMounted(true);
	}, []);
	if (!mounted) return null;
	return signedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = React.useState(false);
	const [signedIn, setSignedIn] = React.useState(false);
	React.useEffect(() => {
		setSignedIn(getCookie("mock_signed_in") === "true");
		setMounted(true);
	}, []);
	if (!mounted) return null;
	return !signedIn ? <>{children}</> : null;
}

export function UserButton() {
	const [email, setEmail] = React.useState("user@gulfshore.com");
	const [isOpen, setIsOpen] = React.useState(false);
	const [btnRect, setBtnRect] = React.useState<DOMRect | null>(null);
	const btnRef = React.useRef<HTMLButtonElement>(null);
	const dropdownRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		const mockEmail = getCookie("mock_user_email");
		if (mockEmail && mockEmail !== "false") {
			setEmail(mockEmail);
		}

		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
				btnRef.current && !btnRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleToggle = () => {
		if (!isOpen && btnRef.current) {
			setBtnRect(btnRef.current.getBoundingClientRect());
		}
		setIsOpen(prev => !prev);
	};

	const initials = email.toLowerCase().includes("admin@gulfshore.com") ? "AD" : email.substring(0, 2).toUpperCase();

	const handleSignOut = () => {
		setCookie("mock_signed_in", "false");
		setCookie("mock_user_email", "false");
		setCookie("mock_user_id", "false");
		window.location.href = "/";
	};

	// Dropdown rendered via portal to escape any stacking context
	const dropdown = isOpen && btnRect ? (
		<div
			ref={dropdownRef}
			style={{
				position: "fixed",
				top: btnRect.bottom + 8,
				right: window.innerWidth - btnRect.right,
				width: "224px",
				zIndex: 99999,
			}}
			className="rounded-xl bg-white border border-gray-200 shadow-xl py-2 text-left"
		>
			<div className="px-4 py-2 border-b border-gray-100">
				<p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Logged in as</p>
				<p className="text-xs font-semibold text-gray-800 truncate mt-0.5">{email}</p>
			</div>
			<div className="py-1">
				<a
					href="/favorites"
					className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
				>
					Saved Properties
				</a>
				<a
					href="/user/saved-searches"
					className="flex items-center px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
				>
					Saved Searches
				</a>
			</div>
			<div className="border-t border-gray-100 pt-1">
				<button
					onClick={handleSignOut}
					className="w-full text-left flex items-center px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors cursor-pointer"
				>
					Sign Out
				</button>
			</div>
		</div>
	) : null;

	return (
		<>
			<button
				ref={btnRef}
				onClick={handleToggle}
				className="w-9 h-9 rounded-full bg-[#d90429] hover:bg-[#bf0022] text-white flex items-center justify-center text-sm font-bold shadow-xs transition-all focus:outline-hidden cursor-pointer"
			>
				{initials}
			</button>
			{typeof document !== "undefined" && dropdown &&
				createPortal(dropdown, document.body)
			}
		</>
	);
}

export function useUser() {
	const [isLoaded, setIsLoaded] = React.useState(false);
	const [signedIn, setSignedIn] = React.useState(false);
	const [email, setEmail] = React.useState("user@gulfshore.com");
	const [userId, setUserId] = React.useState("");

	React.useEffect(() => {
		setSignedIn(getCookie("mock_signed_in") === "true");
		const mockEmail = getCookie("mock_user_email");
		const mockUserId = getCookie("mock_user_id");
		if (mockEmail && mockEmail !== "false") {
			setEmail(mockEmail);
		}
		if (mockUserId && mockUserId !== "false") {
			setUserId(mockUserId);
		}
		setIsLoaded(true);
	}, []);

	const isAdmin = signedIn && email.toLowerCase().includes("admin@gulfshore.com");

	return {
		isLoaded,
		isSignedIn: signedIn,
		user: signedIn ? {
			id: userId || (isAdmin ? "admin_dummy_123" : "user_dummy_123"),
			fullName: isAdmin ? "Admin User" : "Regular User",
			primaryEmailAddress: { emailAddress: email },
			publicMetadata: { role: isAdmin ? "admin" : "user" }
		} : null
	};
}

export function useAuth() {
	const [isLoaded, setIsLoaded] = React.useState(false);
	const [signedIn, setSignedIn] = React.useState(false);
	const [userId, setUserId] = React.useState("");

	React.useEffect(() => {
		setSignedIn(getCookie("mock_signed_in") === "true");
		const mockUserId = getCookie("mock_user_id");
		if (mockUserId && mockUserId !== "false") {
			setUserId(mockUserId);
		}
		setIsLoaded(true);
	}, []);

	const mockEmail = getCookie("mock_user_email");
	const isAdmin = signedIn && mockEmail.toLowerCase().includes("admin@gulfshore.com");

	return {
		isLoaded,
		isSignedIn: signedIn,
		userId: signedIn ? (userId || (isAdmin ? "admin_dummy_123" : "user_dummy_123")) : null,
		getToken: async () => "dummy-token"
	};
}

export function SignInButton({ children }: { children: React.ReactNode }) {
	const handleSignIn = () => {
		if (typeof window !== "undefined") {
			window.location.href = "/signup?mode=signin";
		}
	};
	return <span onClick={handleSignIn} style={{ cursor: "pointer" }}>{children}</span>;
}

export function SignOutButton({ children }: { children: React.ReactNode }) {
	const handleSignOut = () => {
		setCookie("mock_signed_in", "false");
		setCookie("mock_user_email", "false");
		setCookie("mock_user_id", "false");
		window.location.href = "/";
	};
	return <span onClick={handleSignOut} style={{ cursor: "pointer" }}>{children}</span>;
}

export function SignUpButton({ children }: { children: React.ReactNode }) {
	const handleSignUp = () => {
		if (typeof window !== "undefined") {
			window.dispatchEvent(new Event("open-mock-signin"));
		}
	};
	return <span onClick={handleSignUp} style={{ cursor: "pointer" }}>{children}</span>;
}

export function GoogleOneTap() {
	React.useEffect(() => {
		const initGoogleOneTap = () => {
			if (typeof window !== "undefined" && (window as any).google && getCookie("mock_signed_in") !== "true") {
				(window as any).google.accounts.id.initialize({
					client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
					callback: async (response: any) => {
						if (response.credential) {
							try {
								const res = await fetch("/api/v2/user/google-auth", {
									method: "POST",
									headers: { "Content-Type": "application/json" },
									body: JSON.stringify({ credential: response.credential })
								});
								const data = await res.json();
								if (data.success) {
									if (typeof sessionStorage !== "undefined") {
										sessionStorage.setItem("just_signed_in", "true");
									}
									window.location.reload();
								}
							} catch (err) {
								console.error("Error during Google One Tap auth:", err);
							}
						}
					}
				});
				(window as any).google.accounts.id.prompt();
			}
		};

		// Try immediately in case it's loaded
		initGoogleOneTap();

		// Also listen for script load if not loaded yet
		const interval = setInterval(() => {
			if (typeof window !== "undefined" && (window as any).google) {
				clearInterval(interval);
				initGoogleOneTap();
			}
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return null;
}

export function SignIn() {
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [showPasswordStep, setShowPasswordStep] = React.useState(false);
	const [showResetPassword, setShowResetPassword] = React.useState(false);
	const [resetStep, setResetStep] = React.useState<"request" | "verify">("request");
	const [otp, setOtp] = React.useState("");
	const [newPassword, setNewPassword] = React.useState("");
	const [confirmPassword, setConfirmPassword] = React.useState("");
	const [resetSuccess, setResetSuccess] = React.useState("");
	const [error, setError] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);

	const handleGoogleLogin = async () => {
		setIsLoading(true);
		setError("");
		if (typeof window === "undefined" || !(window as any).google) {
			setError("Google Auth is not loaded.");
			setIsLoading(false);
			return;
		}
		const client = (window as any).google.accounts.oauth2.initTokenClient({
			client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
			scope: "email profile",
			callback: async (tokenResponse: any) => {
				if (tokenResponse && tokenResponse.access_token) {
					try {
						const res = await fetch("/api/v2/user/google-auth", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ access_token: tokenResponse.access_token })
						});
						const data = await res.json();
						if (data.success) {
							if (typeof sessionStorage !== "undefined") {
								sessionStorage.setItem("just_signed_in", "true");
							}
							window.location.href = "/";
						} else {
							setError(data.error || "Google authentication failed.");
							setIsLoading(false);
						}
					} catch (err) {
						setError("Error during Google authentication.");
						setIsLoading(false);
					}
				} else {
					setError("Google authentication was cancelled or failed.");
					setIsLoading(false);
				}
			},
			error_callback: (err: any) => {
				setError("Google authentication failed.");
				setIsLoading(false);
			}
		});
		client.requestAccessToken();
	};

	const handleContinue = (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) {
			setError("Email is required.");
			return;
		}
		setError("");
		setResetSuccess("");
		setShowPasswordStep(true);
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setResetSuccess("");
		setIsLoading(true);

		try {
			// If it is admin, log in via admin api, else use general user signin api
			const isAdmin = email.toLowerCase().includes("admin@gulfshore.com");
			if (isAdmin) {
				const res = await fetch("/api/admin/auth", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ action: "login", email, password })
				});
				const data = await res.json();
				if (data.success) {
					setCookie("mock_signed_in", "true");
					setCookie("mock_user_email", data.email);
					setCookie("mock_user_id", "admin_dummy_123");
					if (typeof sessionStorage !== "undefined") {
						sessionStorage.setItem("just_signed_in", "true");
					}
					window.location.href = "/";
				} else {
					setError(data.error || "Invalid credentials");
				}
			} else {
				const res = await fetch("/api/v2/user/signin", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ email, password })
				});
				const data = await res.json();
				if (data.success) {
					setCookie("mock_signed_in", "true");
					setCookie("mock_user_email", data.user.email);
					setCookie("mock_user_id", data.user.clerkId);
					window.location.href = "/";
				} else {
					setError(data.error || "Invalid credentials");
				}
			}
		} catch (err) {
			setError("Failed to sign in. Please check your credentials.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSendOtp = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) {
			setError("Email is required.");
			return;
		}
		setError("");
		setResetSuccess("");
		setIsLoading(true);

		try {
			const res = await fetch("/api/v2/user/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email })
			});
			const data = await res.json();
			if (data.success) {
				setResetStep("verify");
				setResetSuccess(data.message || "Verification code sent successfully.");
				if (data.mockOtp && typeof window !== "undefined") {
					alert(`Gulfshore Mock Clerk Mode:\nYour password reset verification code is: ${data.mockOtp}`);
				}
			} else {
				setError(data.error || "Failed to request password reset");
			}
		} catch (err) {
			setError("Failed to request password reset. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleResetPassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setResetSuccess("");

		if (!otp) {
			setError("Verification code is required");
			return;
		}
		if (newPassword.length < 6) {
			setError("Password must be at least 6 characters long");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch("/api/v2/user/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, otp, newPassword })
			});
			const data = await res.json();
			if (data.success) {
				setResetSuccess("Password reset successfully! Please sign in with your new password.");
				setShowResetPassword(false);
				setResetStep("request");
				setPassword("");
				setOtp("");
				setNewPassword("");
				setConfirmPassword("");
			} else {
				setError(data.error || "Failed to reset password");
			}
		} catch (err) {
			setError("Failed to reset password. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full max-w-[400px] bg-white border border-gray-200 rounded-2xl shadow-xl p-8 flex flex-col items-center font-sans text-[#1f2937] mx-auto my-12">
			{/* Logo */}
			<div className="w-12 h-12 mb-4 relative flex items-center justify-center">
				<img src="/logo.svg" alt="Gulfshore Group Logo" className="w-full h-full object-contain" />
			</div>

			<h2 className="text-xl font-bold text-gray-900 text-center mb-1">Sign in to Gulfshore Group</h2>
			<p className="text-sm text-gray-500 text-center mb-6">Welcome back! Please sign in to continue</p>

			{error && (
				<div className="w-full bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs mb-4">
					{error}
				</div>
			)}

			{resetSuccess && (
				<div className="w-full bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-xs mb-4">
					{resetSuccess}
				</div>
			)}

			{!showResetPassword && !showPasswordStep && (
				<div className="w-full mb-6">
					<button 
						type="button"
						onClick={handleGoogleLogin} 
						disabled={isLoading}
						className="w-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold py-3 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-sm cursor-pointer">
						<svg className="w-5 h-5" viewBox="0 0 24 24">
							<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
							<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
							<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
							<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
						</svg>
						Continue with Google
					</button>

					<div className="relative flex items-center py-4">
						<div className="flex-grow border-t border-gray-200"></div>
						<span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Or continue with</span>
						<div className="flex-grow border-t border-gray-200"></div>
					</div>
				</div>
			)}

			{showResetPassword ? (
				resetStep === "request" ? (
					<form onSubmit={handleSendOtp} className="w-full flex flex-col">
						<h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 text-center">Reset Password</h3>

						
						{/* Email Input */}
						<label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email address</label>
						<input
							type="email"
							placeholder="Enter your email address"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d90429] focus:border-transparent transition-all mb-4"
							required
						/>

						<div className="flex gap-2">
							{/* Back Button */}
							<button
								type="button"
								onClick={() => {
									setShowResetPassword(false);
									setError("");
									setResetSuccess("");
								}}
								className="w-1/3 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg cursor-pointer transition-colors duration-200"
							>
								Cancel
							</button>
							{/* Send Code Button */}
							<button
								type="submit"
								disabled={isLoading}
								className="w-2/3 px-4 py-2.5 bg-[#d90429] hover:bg-[#bf0022] text-white text-sm font-semibold rounded-lg shadow-md cursor-pointer transition-colors duration-200"
							>
								{isLoading ? "Sending..." : "Send Code"}
							</button>
						</div>
					</form>
				) : (
					<form onSubmit={handleResetPassword} className="w-full flex flex-col">
						<h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-4 text-center">Reset Password for {email}</h3>
						
						{/* OTP Input */}
						<label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Verification Code (OTP)</label>
						<input
							type="text"
							placeholder="Enter 6-digit code"
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
							className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d90429] focus:border-transparent transition-all mb-4"
							required
						/>

						{/* New Password Input */}
						<label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">New Password</label>
						<input
							type="password"
							placeholder="Minimum 6 characters"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d90429] focus:border-transparent transition-all mb-4"
							required
						/>

						{/* Confirm Password Input */}
						<label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Confirm New Password</label>
						<input
							type="password"
							placeholder="Re-enter new password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d90429] focus:border-transparent transition-all mb-4"
							required
						/>

						<div className="flex gap-2">
							{/* Back Button */}
							<button
								type="button"
								onClick={() => {
									setResetStep("request");
									setError("");
									setResetSuccess("");
									setOtp("");
								}}
								className="w-1/3 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg cursor-pointer transition-colors duration-200"
							>
								Back
							</button>
							{/* Reset Button */}
							<button
								type="submit"
								disabled={isLoading}
								className="w-2/3 px-4 py-2.5 bg-[#d90429] hover:bg-[#bf0022] text-white text-sm font-semibold rounded-lg shadow-md cursor-pointer transition-colors duration-200"
							>
								{isLoading ? "Resetting..." : "Reset"}
							</button>
						</div>
					</form>
				) ) : !showPasswordStep ? (
				<form onSubmit={handleContinue} className="w-full flex flex-col">
					{/* Email Input */}
					<label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email address</label>
					<input
						type="email"
						placeholder="Enter your email address"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d90429] focus:border-transparent transition-all mb-4"
						required
					/>

					{/* Continue Button */}
					<button
						type="submit"
						disabled={isLoading}
						className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#d90429] hover:bg-[#bf0022] text-white text-sm font-semibold rounded-lg shadow-md cursor-pointer transition-colors duration-200"
					>
						<span>Continue</span>
						<span className="text-xs">▶</span>
					</button>
				</form>
			) : (
				<form onSubmit={handleLogin} className="w-full flex flex-col">
					{/* Password Input */}
					<div className="flex justify-between items-center mb-2">
						<label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Password</label>
						<button
							type="button"
							onClick={() => {
								setShowResetPassword(true);
								setError("");
								setResetSuccess("");
							}}
							className="text-xs text-[#d90429] hover:underline font-medium focus:outline-none cursor-pointer"
						>
							Forgot password?
						</button>
					</div>
					<input
						type="password"
						placeholder="Enter your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d90429] focus:border-transparent transition-all mb-4"
						required
					/>

					<div className="flex gap-2">
						{/* Back Button */}
						<button
							type="button"
							onClick={() => setShowPasswordStep(false)}
							className="w-1/3 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg cursor-pointer transition-colors duration-200"
						>
							Back
						</button>
						{/* Sign In Button */}
						<button
							type="submit"
							disabled={isLoading}
							className="w-2/3 px-4 py-2.5 bg-[#d90429] hover:bg-[#bf0022] text-white text-sm font-semibold rounded-lg shadow-md cursor-pointer transition-colors duration-200"
						>
							{isLoading ? "Signing In..." : "Sign In"}
						</button>
					</div>
				</form>
			)}

			{/* Footer Sign Up Link */}
			<div className="mt-8 text-sm text-gray-600 text-center">
				Don't have an account?{" "}
				<a href="/signup" className="text-[#d90429] hover:underline font-medium">Sign up</a>
			</div>

		
		</div>
	);
}

export function AuthenticateWithRedirectCallback() {
	return null;
}

export function useSignUp() {
	return {
		isLoaded: true,
		signUp: {
			create: async (params: any) => {
				console.log("Mock signup create called:", params);
				return { status: "missing_requirements" };
			},
			prepareEmailAddressVerification: async (params: any) => {
				console.log("Mock prepare email verification:", params);
				if (typeof window !== "undefined") {
					alert("Gulfshore Mock Clerk Mode:\nYour verification code is: 123456");
				}
				return { status: "missing_requirements" };
			},
			attemptEmailAddressVerification: async (params: { code: string }) => {
				console.log("Mock attempt verification code:", params.code);
				if (params.code === "123456" || params.code.length === 6) {
					setCookie("mock_signed_in", "true");
					return { status: "complete", createdSessionId: "mock_session_id" };
				}
				return { status: "missing_requirements", missingFields: ["code"] };
			},
		}
	};
}

export function useSignIn() {
	return {
		isLoaded: true,
		signIn: {
			authenticateWithRedirect: async (params: any) => {
				if (params.strategy === "oauth_google") {
					if (typeof window === "undefined" || !(window as any).google) {
						console.error("Google Auth is not loaded.");
						return;
					}
					const client = (window as any).google.accounts.oauth2.initTokenClient({
						client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
						scope: "email profile",
						callback: async (tokenResponse: any) => {
							if (tokenResponse && tokenResponse.access_token) {
								try {
									const res = await fetch("/api/v2/user/google-auth", {
										method: "POST",
										headers: { "Content-Type": "application/json" },
										body: JSON.stringify({ access_token: tokenResponse.access_token })
									});
									const data = await res.json();
									if (data.success) {
										if (typeof sessionStorage !== "undefined") {
											sessionStorage.setItem("just_signed_in", "true");
										}
										window.location.href = params.redirectUrlComplete || "/";
									} else {
										console.error(data.error || "Google authentication failed.");
									}
								} catch (err) {
									console.error("Error during Google authentication.", err);
								}
							} else {
								console.error("Google authentication was cancelled or failed.");
							}
						},
					});
					client.requestAccessToken();
				} else {
					console.log("Mock signIn authenticateWithRedirect called:", params);
					setCookie("mock_signed_in", "true");
					setCookie("mock_user_email", "admin@gulfshore.com");
					setCookie("mock_user_id", "admin_dummy_123");
					if (typeof sessionStorage !== "undefined") {
						sessionStorage.setItem("just_signed_in", "true");
					}
					window.location.reload();
				}
			}
		},
		setActive: async (params: any) => {
			console.log("Mock signIn setActive called:", params);
		}
	};
}

