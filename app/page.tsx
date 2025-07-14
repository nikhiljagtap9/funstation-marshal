"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoginForm from "@/components/login-form";
import RegisterForm from "@/components/register-form";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function HomePage() {
	const [currentStep, setCurrentStep] = useState<"register" | "login">(
		"register"
	);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const router = useRouter();

	useEffect(() => {
		// Check if user is already authenticated
		const token = localStorage.getItem("authToken");
		if (token) {
			setIsAuthenticated(true);
			router.push("/dashboard");
			return;
		}
	}, [router]);

	const handleRegistrationComplete = () => {
		setCurrentStep("login");
	};

	if (isAuthenticated) {
		return null; // Will redirect to dashboard
	}

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<div className="flex justify-center mb-6">
						<Image
							src="/logo.png"
							alt="Fun Station Logo"
							width={200}
							height={150}
							className="object-contain"
						/>
					</div>
				</div>

				<div className="bg-white rounded-lg p-6 border border-gray-200 shadow-lg">
					{/* Step Indicator */}
					<div className="flex mb-6">
						<button
							onClick={() => setCurrentStep("register")}
							className={`flex-1 text-center py-2 px-4 rounded-l-lg border-r border-gray-200 focus:outline-none transition-all ${
								currentStep === "register"
									? "bg-yellow-400 text-black font-semibold"
									: "bg-gray-100 text-gray-600 hover:bg-yellow-100"
							}`}
						>
							1. Register
						</button>
						<button
							onClick={() => setCurrentStep("login")}
							className={`flex-1 text-center py-2 px-4 rounded-r-lg focus:outline-none transition-all ${
								currentStep === "login"
									? "bg-yellow-400 text-black font-semibold"
									: "bg-gray-100 text-gray-600 hover:bg-yellow-100"
							}`}
						>
							2. Login
						</button>
					</div>

					{currentStep === "register" ? (
						<RegisterForm onComplete={handleRegistrationComplete} />
					) : (
						<LoginForm />
					)}

					{/* Navigation */}
					<div className="mt-4 text-center space-y-2">
						{currentStep === "login" && (
							<Button
								variant="ghost"
								onClick={() => setCurrentStep("register")}
								className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
							>
								Don't have an account? Please Register →
							</Button>
						)}
						{currentStep === "register" && (
							<Button
								variant="ghost"
								onClick={() => setCurrentStep("login")}
								className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
							>
								Already have an account? Please login →
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
