"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle } from "lucide-react";

interface RegisterFormProps {
	onComplete: () => void;
}

export default function RegisterForm({ onComplete }: RegisterFormProps) {
	const [formData, setFormData] = useState({
		marshalName: "",
		password: "",
		confirmPassword: "",
	});
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const { toast } = useToast();

	const ADMIN_USERNAME = "eric@fantasia.com";
	const ADMIN_PASSWORD = "eric@2025";

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setErrors({});

		const newErrors: Record<string, string> = {};
		if (!formData.marshalName)
			newErrors.marshalName = "Marshal name is required";
		if (!formData.password) newErrors.password = "Password is required";
		if (!formData.confirmPassword)
			newErrors.confirmPassword = "Confirm password is required";
		if (formData.password !== formData.confirmPassword)
			newErrors.confirmPassword = "Passwords do not match";
		// Prevent admin credentials in marshal registration
		if (formData.marshalName === ADMIN_USERNAME) {
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

		// Admin registration logic
		if (
			formData.marshalName === "eric@fantasia.com" &&
			formData.password === "eric@2025"
		) {
			try {
				const res = await fetch("/api/register-admin", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						username: formData.marshalName,
						password: formData.password,
					}),
				});
				const result = await res.json();
				if (!res.ok) {
					setErrors({
						marshalName: result.error || "Registration failed",
					});
					setIsLoading(false);
					return;
				}
				// Show toast and redirect to admin login (not splash)
				toast({
					title: "Successfully Registered, Eric!",
					description: "Please login as admin to continue.",
					duration: 2500,
				});
				setTimeout(() => {
					window.location.href = "/admin";
				}, 1500);
			} catch (err) {
				setErrors({
					marshalName: "Registration failed. Please try again.",
				});
			} finally {
				setIsLoading(false);
			}
			return;
		}

		// Register user via API
		try {
			const res = await fetch("/api/register-user", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					username: formData.marshalName,
					password: formData.password,
					marshalName: formData.marshalName,
				}),
			});
			const result = await res.json();
			if (!res.ok) {
				setErrors({
					marshalName: result.error || "Registration failed",
				});
				setIsLoading(false);
				return;
			}
			// Save to localStorage for session
			localStorage.setItem(
				"marshalData",
				JSON.stringify({
					marshalName: formData.marshalName,
					username: formData.marshalName,
				})
			);
			toast({
				title: "Registration Successful!",
				description: "Please proceed to login with your credentials.",
				duration: 3000,
			});
			setTimeout(() => {
				onComplete();
			}, 1000);
		} catch (err) {
			setErrors({
				marshalName: "Registration failed. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<Label htmlFor="marshalName" className="text-gray-700">
					Username
				</Label>
				<Input
					id="marshalName"
					value={formData.marshalName}
					onChange={(e) =>
						handleChange("marshalName", e.target.value)
					}
					className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
					placeholder="Enter marshal name"
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
						value={formData.password}
						onChange={(e) =>
							handleChange("password", e.target.value)
						}
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
				<Label htmlFor="confirmPassword" className="text-gray-700">
					Confirm Password
				</Label>
				<Input
					id="confirmPassword"
					type="password"
					value={formData.confirmPassword}
					onChange={(e) =>
						handleChange("confirmPassword", e.target.value)
					}
					className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400"
					placeholder="Confirm password"
				/>
				{errors.confirmPassword && (
					<p className="text-red-500 text-sm mt-1">
						{errors.confirmPassword}
					</p>
				)}
			</div>

			<Button
				type="submit"
				className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
				disabled={isLoading}
			>
				{isLoading ? (
					"Registering..."
				) : (
					<>
						<CheckCircle className="w-4 h-4 mr-2" />
						Complete Registration
					</>
				)}
			</Button>
		</form>
	);
}
