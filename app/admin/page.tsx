"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Image from "next/image";

const ADMIN_USERNAME = "eric@fantasia.com";
const ADMIN_PASSWORD = "eric@2025";

export default function AdminLoginPage() {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();

	useEffect(() => {
		if (
			typeof window !== "undefined" &&
			localStorage.getItem("adminSession")
		) {
			router.push("/admin/dashboard");
		}
	}, [router]);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);
		if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
			setError("Invalid admin credentials");
			setLoading(false);
			return;
		}
		// Register admin in cloud if not already present
		try {
			const res = await fetch("/api/register-admin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});
			if (!res.ok) {
				const result = await res.json();
				setError(result.error || "Failed to register admin");
				setLoading(false);
				return;
			}
			// Store session token
			localStorage.setItem("adminSession", "admin-session-token");
			router.push("/admin/splash");
		} catch (err) {
			setError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-blue-100">
			<div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col items-center px-8 py-10 sm:px-10 sm:py-12">
				<Image
					src="/logo.png"
					alt="Fun Station Logo"
					width={120}
					height={60}
					className="object-contain mb-4"
				/>
				<h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
					Admin Login
				</h2>
				<form onSubmit={handleLogin} className="w-full space-y-5">
					<div>
						<Label
							htmlFor="username"
							className="text-gray-700 mb-1 block"
						>
							Username
						</Label>
						<Input
							id="username"
							type="text"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400"
							placeholder="Enter admin username"
							autoComplete="off"
							required
						/>
					</div>
					<div>
						<Label
							htmlFor="password"
							className="text-gray-700 mb-1 block"
						>
							Password
						</Label>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-yellow-400 focus:ring-yellow-400 pr-10"
								placeholder="Enter password"
								autoComplete="off"
								required
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-gray-700"
								onClick={() => setShowPassword(!showPassword)}
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
					{error && (
						<p className="text-red-500 text-sm text-center mt-2">
							{error}
						</p>
					)}
					<Button
						type="submit"
						className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold mt-2"
						disabled={loading}
					>
						{loading ? (
							"Logging in..."
						) : (
							<>
								<LogIn className="w-4 h-4 mr-2" />
								Login
							</>
						)}
					</Button>
				</form>
			</div>
		</div>
	);
}
