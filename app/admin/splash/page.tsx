"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../../components/ui/button";
import { X } from "lucide-react";
import Image from "next/image";

export default function AdminSplash() {
	const [currentStep, setCurrentStep] = useState(0);
	const router = useRouter();

	const steps = [
		{
			title: "Welcome to Fun Station",
			subtitle: "Admin Control Panel",
			description:
				"Monitor, manage, and celebrate your event in real time.",
		},
		{
			title: "Real-Time Leaderboard",
			subtitle: "Live Competition Insights",
			description:
				"Track team progress, view results, and crown the winners.",
		},
		{
			title: "Ready to Oversee?",
			subtitle: "Let's Launch the Admin Dashboard",
			description: "All systems are ready for your command.",
		},
	];

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentStep((prev) => {
				if (prev < steps.length - 1) {
					return prev + 1;
				} else {
					setTimeout(() => {
						router.push("/admin/dashboard");
					}, 2000);
					return prev;
				}
			});
		}, 3000);
		return () => clearInterval(timer);
	}, [router, steps.length]);

	const handleSkip = () => {
		router.push("/admin/dashboard");
	};

	return (
		<div className="min-h-screen bg-black flex items-center justify-center p-4 overflow-hidden relative">
			{/* Animated Background */}
			<div className="absolute inset-0">
				{[...Array(50)].map((_, i) => (
					<motion.div
						key={i}
						className="absolute w-1 h-1 bg-yellow-400 rounded-full"
						style={{
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
						}}
						animate={{
							y: [0, -100, 0],
							opacity: [0, 1, 0],
							scale: [0, 1, 0],
						}}
						transition={{
							duration: Math.random() * 3 + 2,
							repeat: Number.POSITIVE_INFINITY,
							delay: Math.random() * 2,
						}}
					/>
				))}
				<div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-yellow-600/10"></div>
				<div className="absolute inset-0 bg-gradient-to-tl from-transparent via-yellow-400/5 to-transparent"></div>
			</div>
			{/* Skip Button */}
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5 }}
				className="absolute top-6 right-6 z-10"
			>
				<Button
					onClick={handleSkip}
					variant="outline"
					size="sm"
					className="bg-yellow-400/10 backdrop-blur-md border-yellow-400/20 text-yellow-400 hover:bg-yellow-400/20 hover:border-yellow-400/30"
				>
					<X className="w-4 h-4 mr-2" />
					Skip
				</Button>
			</motion.div>
			{/* Main Content */}
			<div className="text-center relative z-10 max-w-4xl mx-auto">
				{/* Logo Section */}
				<motion.div
					initial={{ scale: 0, rotate: -180 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ duration: 1, ease: "easeOut" }}
					className="mb-8"
				>
					<div className="flex justify-center mb-6">
						<motion.div
							animate={{
								scale: [1, 1.05, 1],
								rotate: [0, 2, -2, 0],
							}}
							transition={{
								duration: 4,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
						>
							<Image
								src="/logo.png"
								alt="Fun Station Logo"
								width={180}
								height={140}
								className="object-contain drop-shadow-2xl"
							/>
						</motion.div>
					</div>
				</motion.div>
				{/* Dynamic Content */}
				<AnimatePresence mode="wait">
					<motion.div
						key={currentStep}
						initial={{ opacity: 0, y: 50, scale: 0.9 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -50, scale: 0.9 }}
						transition={{ duration: 0.6, ease: "easeOut" }}
						className="space-y-6"
					>
						<motion.h1
							className="text-5xl md:text-7xl font-bold text-yellow-400 mb-4 leading-tight"
							animate={{
								textShadow: [
									"0 0 20px rgba(255,193,7,0.5)",
									"0 0 30px rgba(255,193,7,0.8)",
									"0 0 20px rgba(255,193,7,0.5)",
								],
							}}
							transition={{
								duration: 2,
								repeat: Number.POSITIVE_INFINITY,
							}}
						>
							{steps[currentStep].title}
						</motion.h1>
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3 }}
							className="text-2xl md:text-3xl text-yellow-200 mb-6 font-medium"
						>
							{steps[currentStep].subtitle}
						</motion.p>
						<motion.p
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.6 }}
							className="text-lg text-yellow-100 mb-8 max-w-2xl mx-auto leading-relaxed"
						>
							{steps[currentStep].description}
						</motion.p>
					</motion.div>
				</AnimatePresence>
				{/* Progress Indicators */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 1 }}
					className="flex justify-center space-x-3 mt-8"
				>
					{steps.map((_, index) => (
						<motion.div
							key={index}
							className={`w-3 h-3 rounded-full transition-all duration-300 ${
								index === currentStep
									? "bg-yellow-400 scale-125"
									: "bg-yellow-100"
							}`}
						/>
					))}
				</motion.div>
			</div>
		</div>
	);
}
