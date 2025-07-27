"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";

export default function LoginForm() {
	const [marshalName, setMarshalName] = useState("");
	const [password, setPassword] = useState("");
	const [gameCode, setGameCode] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<{
		marshalName?: string;
		password?: string;
		gameCode?: string;
	}>({});
	const [showResetModal, setShowResetModal] = useState(false);
	const [resetPassword, setResetPassword] = useState("");
	const [resetConfirmPassword, setResetConfirmPassword] = useState("");
	const [resetLoading, setResetLoading] = useState(false);
	const [resetError, setResetError] = useState("");

	const { toast } = useToast();
	const router = useRouter();

	const ADMIN_USERNAME = "eric@fantasia.com";
	const ADMIN_PASSWORD = "eric@2025";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setErrors({});

		const newErrors: {
			marshalName?: string;
			password?: string;
			gameCode?: string;
		} = {};
		if (!marshalName) newErrors.marshalName = "Username is required";
		if (!password) newErrors.password = "Password is required";
		if (!gameCode) newErrors.gameCode = "Game code is required";

		// Prevent admin credentials in marshal login
		if (marshalName === ADMIN_USERNAME) {
			setErrors({
				marshalName: "This username is reserved for admin only.",
			});
			setIsLoading(false);
			return;
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			setIsLoading(false);
			return;
		}

		// Admin login logic
		if (marshalName === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
			try {
				const res = await fetch("/api/register-admin", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username: marshalName, password }),
				});
				const result = await res.json();
				if (!res.ok) {
					setErrors({ marshalName: result.error || "Login failed" });
					setIsLoading(false);
					return;
				}
				// Redirect to admin panel (no localStorage for admin)
				window.location.href = "/admin";
			} catch (err) {
				setErrors({ marshalName: "Login failed. Please try again." });
			} finally {
				setIsLoading(false);
			}
			return;
		}

		// Validate game code first
		try {
			const gameCodeRes = await fetch("/api/validate-game-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ gameCode }),
			});
			const gameCodeResult = await gameCodeRes.json();

			if (!gameCodeResult.valid) {
				setErrors({ gameCode: "Invalid game code" });
				setIsLoading(false);
				return;
			}
		} catch (err) {
			setErrors({ gameCode: "Failed to validate game code" });
			setIsLoading(false);
			return;
		}

		// Login via API
		try {
			const res = await fetch("/api/login-user", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: marshalName,
					password,
					gameCode,
				}),
			});
			const result = await res.json();
			if (!res.ok) {
				if (result.error === "User not found") {
					localStorage.removeItem("marshalData");
					localStorage.removeItem("authToken");
					localStorage.removeItem("users");
				}
				setErrors({ marshalName: result.error || "Login failed" });
				setIsLoading(false);
				return;
			}
			localStorage.setItem("authToken", `marshal-token-${Date.now()}`);
			localStorage.setItem("marshalData", JSON.stringify(result));
			toast({
				title: "Login Successful!",
				description: "Welcome! Redirecting to splash screen...",
				duration: 2000,
			});
			setTimeout(() => {
				router.push("/splash");
			}, 1000);
		} catch (err) {
			setErrors({ marshalName: "Login failed. Please try again." });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<form onSubmit={handleSubmit} className="space-y-4">
				<div>
					<Label htmlFor="marshalName" className="text-gray-700">
						Username
					</Label>
					<Input
						id="marshalName"
						type="text"
						value={marshalName}
						onChange={(e) => setMarshalName(e.target.value)}
						className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
						placeholder="Enter username"
						autoComplete="off"
						required={true}
					/>
					{errors.marshalName && (
						<p className="text-red-500 text-sm mt-1">
							{errors.marshalName}
						</p>
					)}
				</div>

				<div>
					<Label htmlFor="password" className="text-gray-700">
						Password
					</Label>
					<div className="relative">
						<Input
							id="password"
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400 pr-10"
							placeholder="Enter password"
							autoComplete="off"
							required={true}
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
					{errors.password && (
						<p className="text-red-500 text-sm mt-1">
							{errors.password}
						</p>
					)}
				</div>

				<div>
					<Label htmlFor="gameCode" className="text-gray-700">
						Game Code
					</Label>
					<Input
						id="gameCode"
						type="text"
						value={gameCode}
						onChange={(e) =>
							setGameCode(e.target.value.toUpperCase())
						}
						className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
						placeholder="Enter game code"
						autoComplete="off"
						required={true}
						maxLength={12}
					/>
					{errors.gameCode && (
						<p className="text-red-500 text-sm mt-1">
							{errors.gameCode}
						</p>
					)}
				</div>

				<Button
					type="submit"
					className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
					disabled={isLoading}
				>
					{isLoading ? (
						"Logging in..."
					) : (
						<>
							<LogIn className="w-4 h-4 mr-2" />
							Login
						</>
					)}
				</Button>
				<div className="text-center mt-2">
					<button
						type="button"
						className="text-sm text-blue-600 hover:underline"
						onClick={() => setShowResetModal(true)}
					>
						Forgot Password?
					</button>
				</div>
			</form>

			<Dialog open={showResetModal} onOpenChange={setShowResetModal}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reset Password</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Label htmlFor="reset-password">New Password</Label>
						<Input
							id="reset-password"
							type="text"
							value={resetPassword}
							onChange={(e) => setResetPassword(e.target.value)}
							placeholder="Enter new password"
							autoComplete="off"
							className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
						/>
						<Label htmlFor="reset-confirm-password">
							Retype Password
						</Label>
						<Input
							id="reset-confirm-password"
							type="text"
							value={resetConfirmPassword}
							onChange={(e) =>
								setResetConfirmPassword(e.target.value)
							}
							placeholder="Retype new password"
							autoComplete="off"
							className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
						/>
						{resetError && (
							<p className="text-red-500 text-sm">{resetError}</p>
						)}
					</div>
					<DialogFooter>
						<Button
							disabled={resetLoading}
							onClick={async () => {
								setResetError("");
								if (!resetPassword || !resetConfirmPassword) {
									setResetError("Both fields are required");
									return;
								}
								if (resetPassword !== resetConfirmPassword) {
									setResetError("Passwords do not match");
									return;
								}
								if (!marshalName) {
									setResetError(
										"Please enter your username above"
									);
									return;
								}
								setResetLoading(true);
								try {
									const res = await fetch(
										"/api/reset-password",
										{
											method: "POST",
											headers: {
												"Content-Type":
													"application/json",
											},
											body: JSON.stringify({
												username: marshalName,
												newPassword: resetPassword,
											}),
										}
									);
									const result = await res.json();
									if (!res.ok) {
										if (result.error === "User not found") {
											localStorage.removeItem(
												"marshalData"
											);
											localStorage.removeItem(
												"authToken"
											);
											localStorage.removeItem("users");
										}
										setResetError(
											result.error ||
												"Password reset failed"
										);
										setResetLoading(false);
										return;
									}
									setShowResetModal(false);
									toast({
										title: "Password Reset Successful!",
										description:
											"You can now log in with your new password.",
										duration: 2000,
									});
								} catch (err) {
									setResetError(
										"Password reset failed. Please try again."
									);
								} finally {
									setResetLoading(false);
								}
							}}
							className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
						>
							{resetLoading ? "Resetting..." : "Reset Password"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

// Utility function for logout
export function logout(router: any) {
	localStorage.removeItem("authToken");
	router.push("/"); // This will trigger the login step if users exist
}

export async function fetchAllUsers() {
	const res = await fetch("/api/list-users");
	if (!res.ok) throw new Error("Failed to fetch users");
	return await res.json();
}
